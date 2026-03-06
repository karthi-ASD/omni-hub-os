import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICE = "Polly.Nicole";
const LANG = "en-AU";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    let callUuid = "";
    let speechResult = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      callUuid = body.CallUUID || "";
      speechResult = body.Speech || "";
    } else {
      const body = await req.text();
      const params = new URLSearchParams(body);
      callUuid = params.get("CallUUID") || "";
      speechResult = params.get("Speech") || "";
    }

    console.log("ai-response - UUID:", callUuid, "Speech:", speechResult);

    // No speech — prompt again instead of hanging up
    if (!speechResult || speechResult.trim() === "") {
      const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="auto" speechModel="command_and_search" executionTimeout="30" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%" volume="loud">Sorry, I didn&#39;t quite catch that. Could you say that again for me?</prosody></Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">No worries at all. We&#39;ll have someone follow up with you. Have a lovely day!</prosody></Speak>
</Response>`, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Find session
    let session: any = null;
    let leadName = "mate";
    let businessName = "Nextweb";
    let serviceInterest = "";
    let conversationHistory: Array<{ role: string; content: string }> = [];
    let knowledgeContext = "";

    if (callUuid) {
      const { data: sess } = await supabase
        .from("voice_agent_sessions")
        .select("id, business_id, lead_id, inquiry_id, transcript_text")
        .eq("plivo_call_uuid", callUuid)
        .single();
      session = sess;

      if (!session) {
        const { data: recentSess } = await supabase
          .from("voice_agent_sessions")
          .select("id, business_id, lead_id, inquiry_id, transcript_text")
          .eq("status", "IN_PROGRESS")
          .order("started_at", { ascending: false })
          .limit(1);
        if (recentSess?.[0]) {
          session = recentSess[0];
          supabase.from("voice_agent_sessions").update({
            plivo_call_uuid: callUuid,
          }).eq("id", session.id).then(() => {}).catch(() => {});
        }
      }
    }

    if (session) {
      // ALL DB reads in parallel for maximum speed
      const [leadResult, bizResult, eventsResult, knowledgeResult, scriptResult] = await Promise.all([
        session.lead_id
          ? supabase.from("leads").select("name, service_interest").eq("id", session.lead_id).single()
          : session.inquiry_id
            ? supabase.from("inquiries").select("name, service").eq("id", session.inquiry_id).single()
            : Promise.resolve({ data: null }),
        supabase.from("businesses").select("name").eq("id", session.business_id).single(),
        supabase.from("voice_agent_events")
          .select("event_type, payload_json")
          .eq("session_id", session.id)
          .in("event_type", ["USER_SPEECH", "AI_RESPONSE"])
          .order("created_at", { ascending: true })
          .limit(8),
        supabase.from("ai_agent_knowledge_base")
          .select("title, content")
          .eq("business_id", session.business_id)
          .limit(5),
        supabase.from("ai_agent_scripts")
          .select("qualification_questions_json, scheduling_text")
          .eq("business_id", session.business_id)
          .eq("is_default", true)
          .limit(1),
      ]);

      if (leadResult.data) {
        leadName = (leadResult.data as any).name || leadName;
        serviceInterest = (leadResult.data as any).service_interest || (leadResult.data as any).service || "";
      }
      if (bizResult.data?.name) businessName = bizResult.data.name;

      if (eventsResult.data) {
        for (const evt of eventsResult.data) {
          const payload = evt.payload_json as any;
          if (evt.event_type === "USER_SPEECH" && payload?.text) {
            conversationHistory.push({ role: "user", content: payload.text });
          } else if (evt.event_type === "AI_RESPONSE" && payload?.text) {
            conversationHistory.push({ role: "assistant", content: payload.text });
          }
        }
      }

      if (knowledgeResult.data?.length) {
        knowledgeContext = "\n\nCOMPANY INFO:\n" +
          (knowledgeResult.data as any[]).map((k: any) => `${k.title}: ${k.content}`).join("\n");
      }
      if (scriptResult.data?.[0]) {
        const script = scriptResult.data[0] as any;
        const questions = script.qualification_questions_json as any[];
        if (questions?.length) {
          knowledgeContext += "\n\nASK NATURALLY: " +
            questions.map((q: any) => q.question).join("; ");
        }
      }

      // Fire-and-forget: log speech + update transcript
      const currentTranscript = session.transcript_text || "";
      const updatedTranscript = currentTranscript
        ? `${currentTranscript}\nCaller: ${speechResult}`
        : `Caller: ${speechResult}`;

      const dbWrites = Promise.all([
        supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "PLIVO",
          event_type: "USER_SPEECH",
          payload_json: { text: speechResult },
        }),
        supabase.from("voice_agent_sessions").update({
          transcript_text: updatedTranscript,
        }).eq("id", session.id),
      ]);

      // SYSTEM PROMPT — optimized for human-like, jovial, warm conversation
      const systemPrompt = `You are Sarah, a warm and friendly Australian woman who works at ${businessName} as a sales consultant. You are on a live phone call with ${leadName}.

PERSONALITY:
- You are genuinely cheerful, upbeat, and love chatting with people
- You speak like a real Australian — use expressions like "no worries", "lovely", "brilliant", "sounds great", "absolutely", "for sure"
- You laugh naturally — use "haha" occasionally when appropriate
- You show genuine enthusiasm and empathy
- You listen carefully and reference what the caller just said
- You use the caller's name naturally in conversation

SPEAKING RULES (CRITICAL):
- Maximum 25 words per response — you are speaking on a phone, be concise
- Use short, punchy sentences — never long paragraphs
- Use contractions: "we've", "you'll", "that's", "we're" — never formal speech
- Add natural filler words sparingly: "oh", "well", "look", "so"
- End with a question to keep the conversation flowing
- Never use bullet points, lists, or formatted text — this is spoken aloud

KNOWLEDGE:
${serviceInterest ? `They mentioned interest in: ${serviceInterest}` : ""}
${knowledgeContext}

STRICT RULES:
- Your name is Sarah — never say "[Your Name]" or anything similar
- Never mention being an AI unless directly asked — if asked, say "I'm Sarah from ${businessName}"
- If you don't know something, say "Let me get our team onto that for you"
- When wrapping up, say goodbye naturally: "Lovely chatting with you!" or "Thanks so much for your time!"`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6),
        { role: "user", content: speechResult },
      ];

      // AI call + DB writes in parallel
      const [aiResponse] = await Promise.all([
        fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages,
            max_tokens: 60,
            temperature: 0.8,
          }),
        }),
        dbWrites,
      ]);

      if (!aiResponse.ok) {
        console.error("AI error:", aiResponse.status);
        throw new Error("AI error");
      }

      const aiData = await aiResponse.json();
      let aiText = aiData.choices?.[0]?.message?.content ||
        "No worries, let me get someone from the team to help you out!";

      // Clean up any markdown or formatting artifacts
      aiText = aiText.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "").trim();

      console.log("AI:", aiText);

      // Fire-and-forget: log AI response + update transcript
      const aiTranscript = `${updatedTranscript}\nAgent: ${aiText}`;
      Promise.all([
        supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "INTERNAL",
          event_type: "AI_RESPONSE",
          payload_json: { text: aiText, user_said: speechResult },
        }),
        supabase.from("voice_agent_sessions").update({
          transcript_text: aiTranscript.trim(),
        }).eq("id", session.id),
      ]).catch(e => console.error("DB write error:", e));

      // Check goodbye
      const isGoodbye = /\b(goodbye|bye|take care|cheers|have a great|have a good|farewell|lovely chatting|thanks so much)\b/i.test(aiText) &&
        !/\b(question|help|tell me|what|how)\b/i.test(aiText);

      const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

      // SSML prosody for warm, natural delivery
      const ssmlResponse = `<prosody rate="95%" volume="loud">${escapeXml(aiText)}</prosody>`;

      if (isGoodbye) {
        // Complete session in background
        supabase.from("voice_agent_sessions").update({
          status: "COMPLETED",
          ended_at: new Date().toISOString(),
          ai_summary: `Call with ${leadName}. Transcript recorded.`,
        }).eq("id", session.id).then(() => {}).catch(e => console.error(e));

        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">${ssmlResponse}</Speak>
</Response>`, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="auto" speechModel="command_and_search" executionTimeout="30" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${ssmlResponse}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">Looks like we lost connection. No worries, we&#39;ll be in touch! Cheers!</prosody></Speak>
</Response>`, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // No session fallback
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%" volume="loud">Thanks for calling! Someone from our team will be in touch shortly. Cheers!</prosody></Speak>
</Response>`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("ai-response error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">Sorry about that, small technical hiccup! Our team will follow up with you shortly. Cheers!</prosody></Speak>
</Response>`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}