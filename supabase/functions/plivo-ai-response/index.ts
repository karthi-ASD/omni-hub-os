import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retell AI best practice: Use high-quality neural voice with Australian accent
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
    // Parse input — support both JSON and form-encoded (Plivo sends form-encoded)
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

    // Retell AI technique: Handle no-speech gracefully with a natural re-prompt
    if (!speechResult || speechResult.trim() === "") {
      const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;
      return new Response(buildXml(
        `<GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="auto" speechModel="command_and_search" executionTimeout="30" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%" volume="loud">Sorry, I didn&#39;t quite catch that. Could you say that again for me?</prosody></Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">No worries at all. We&#39;ll have someone follow up with you. Have a lovely day!</prosody></Speak>`
      ), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
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
      // Retell AI technique: ALL DB reads in parallel for minimum latency
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
          .limit(10),
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

      // Retell AI technique: Conversation history distillation
      // Keep only the last 4 exchanges raw, summarize older ones
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
        knowledgeContext = "\n\n## Knowledge Base\n" +
          (knowledgeResult.data as any[]).map((k: any) => `- ${k.title}: ${k.content}`).join("\n");
      }

      let qualificationQuestions = "";
      if (scriptResult.data?.[0]) {
        const script = scriptResult.data[0] as any;
        const questions = script.qualification_questions_json as any[];
        if (questions?.length) {
          qualificationQuestions = "\n\n## Qualification Questions (ask naturally, one at a time)\n" +
            questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join("\n");
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

      // ============================================================
      // RETELL AI BEST PRACTICE: SECTIONAL PROMPT STRUCTURE
      // Sections: Identity → Style Guardrails → Response Guidelines → Task
      // ============================================================
      const systemPrompt = `## Identity
You are Sarah, a warm and friendly Australian woman who works at ${businessName} as a sales consultant. You are on a live phone call with ${leadName}.

## Style Guardrails
- Be concise: Keep responses to 1-2 short sentences maximum. This is a phone call, not an essay.
- Be conversational: Use natural language, contractions ("we've", "you'll", "that's"), and acknowledge what the caller says before responding.
- Be empathetic: Show genuine understanding for the caller's situation.
- Use Australian expressions naturally: "no worries", "lovely", "brilliant", "sounds great", "absolutely", "for sure".
- Use filler words sparingly for natural feel: "oh", "well", "look", "so", "hmm".
- Add backchannel acknowledgments: "got it", "right", "I see", "of course".

## Response Guidelines
- Maximum 1-2 sentences per response. Never more. Ever.
- Ask only ONE question at a time. Never stack multiple questions.
- Return dates in spoken form: say "January fifth" not "01/05".
- Return times in spoken form: say "two thirty PM" not "2:30 PM".
- Return phone numbers spelled out: say "oh four one two" not "0412".
- Never use bullet points, numbered lists, or any formatted text — this is spoken aloud.
- Never use asterisks, hashtags, or markdown formatting.
- Reference what the caller just said to show active listening.
- Use the caller's name naturally but not in every response.

## Task
1. Greet warmly and establish rapport.
2. Understand the caller's needs through natural conversation.
3. Ask qualification questions one at a time, weaving them in naturally.
4. Provide relevant information from the knowledge base when appropriate.
5. If you can't answer something, say "Let me get our team onto that for you".
6. When wrapping up, say goodbye naturally: "Lovely chatting with you!" or "Thanks so much for your time!"

## Strict Rules
- Your name is Sarah. Never say "[Your Name]" or anything like it.
- Never mention being an AI unless directly asked. If asked, say "I'm Sarah from ${businessName}".
- Never break character. You are a real person on a real phone call.
- If the caller is upset, acknowledge their frustration before solving.
${serviceInterest ? `\n## Context\nThey mentioned interest in: ${serviceInterest}` : ""}${knowledgeContext}${qualificationQuestions}`;

      // Retell AI technique: Keep only last 4 messages for speed, older context is in the system prompt
      const recentHistory = conversationHistory.slice(-4);
      const messages = [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: speechResult },
      ];

      // Retell AI technique: AI call + DB writes in parallel for minimum latency
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
            max_tokens: 40, // Retell AI: Force brevity — 1-2 sentences max
            temperature: 0.9, // Retell AI: Natural variation in responses
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

      // Retell AI: Clean up any markdown/formatting artifacts
      aiText = aiText
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#/g, "")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

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

      // Retell AI: Detect goodbye intent
      const isGoodbye = /\b(goodbye|bye|take care|cheers|have a great|have a good|farewell|lovely chatting|thanks so much)\b/i.test(aiText) &&
        !/\b(question|help|tell me|what|how)\b/i.test(aiText);

      const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

      // Retell AI: SSML prosody for warm, natural delivery
      const ssmlResponse = `<prosody rate="95%" volume="loud">${escapeXml(aiText)}</prosody>`;

      if (isGoodbye) {
        supabase.from("voice_agent_sessions").update({
          status: "COMPLETED",
          ended_at: new Date().toISOString(),
          ai_summary: `Call with ${leadName}. Transcript recorded.`,
        }).eq("id", session.id).then(() => {}).catch(e => console.error(e));

        return new Response(buildXml(
          `<Speak voice="${VOICE}" language="${LANG}">${ssmlResponse}</Speak>`
        ), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
      }

      return new Response(buildXml(
        `<GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="auto" speechModel="command_and_search" executionTimeout="30" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${ssmlResponse}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">Looks like we lost connection. No worries, we&#39;ll be in touch! Cheers!</prosody></Speak>`
      ), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    // No session fallback
    return new Response(buildXml(
      `<Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%" volume="loud">Thanks for calling! Someone from our team will be in touch shortly. Cheers!</prosody></Speak>`
    ), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
  } catch (err) {
    console.error("ai-response error:", err);
    return new Response(buildXml(
      `<Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">Sorry about that, small technical hiccup! Our team will follow up with you shortly. Cheers!</prosody></Speak>`
    ), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } });
  }
});

function buildXml(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${inner}\n</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
