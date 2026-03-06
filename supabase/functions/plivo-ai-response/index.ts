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

    if (!speechResult || speechResult.trim() === "") {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Sorry, I didn&#39;t catch that. Could you say that again?</Speak>
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
          await supabase.from("voice_agent_sessions").update({
            plivo_call_uuid: callUuid,
          }).eq("id", session.id);
        }
      }

      if (session) {
        // Parallel: lead info, business name, conversation history, knowledge — ALL at once
        const [leadResult, bizResult, eventsResult, knowledgeResult, scriptResult] = await Promise.all([
          // Lead info
          session.lead_id
            ? supabase.from("leads").select("name, service_interest").eq("id", session.lead_id).single()
            : session.inquiry_id
              ? supabase.from("inquiries").select("name, service").eq("id", session.inquiry_id).single()
              : Promise.resolve({ data: null }),
          // Business
          supabase.from("businesses").select("name").eq("id", session.business_id).single(),
          // Conversation history
          supabase.from("voice_agent_events")
            .select("event_type, payload_json")
            .eq("session_id", session.id)
            .in("event_type", ["USER_SPEECH", "AI_RESPONSE"])
            .order("created_at", { ascending: true })
            .limit(10),
          // Knowledge base (limit to 5 most relevant)
          supabase.from("ai_agent_knowledge_base")
            .select("title, content")
            .eq("business_id", session.business_id)
            .limit(5),
          // Script
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

        // Build conversation history
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

        // Log user speech + update transcript in parallel (non-blocking for AI call)
        const currentTranscript = session.transcript_text || "";
        const updatedTranscript = currentTranscript
          ? `${currentTranscript}\nCaller: ${speechResult}`
          : `Caller: ${speechResult}`;

        // Fire-and-forget DB writes — don't await before AI call
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

        // Build knowledge context
        let knowledgeContext = "";
        if (knowledgeResult.data?.length) {
          knowledgeContext = "\n\nCOMPANY INFO:\n" +
            knowledgeResult.data.map((k: any) => `${k.title}: ${k.content}`).join("\n");
        }
        if (scriptResult.data?.[0]) {
          const script = scriptResult.data[0] as any;
          const questions = script.qualification_questions_json as any[];
          if (questions?.length) {
            knowledgeContext += "\n\nASK THESE (naturally): " +
              questions.map((q: any) => q.question).join("; ");
          }
        }

        // Call AI immediately — don't wait for DB writes
        const systemPrompt = `You are Sarah, a friendly Australian sales assistant at ${businessName}, on a live phone call with ${leadName}. You have an Australian accent and speak naturally.

RULES (CRITICAL):
- Max 30 words per response — this is spoken on a phone, be brief
- Sound human and warm, use Australian expressions like "no worries", "lovely", "brilliant"
- Never say "[Your Name]" — your name is Sarah
- Answer using company info below
- If unsure, say "let me get our team to follow up on that"
- Never mention being an AI unless directly asked
${serviceInterest ? `\nThey are interested in: ${serviceInterest}` : ""}
${knowledgeContext}`;

        const messages = [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-6), // Only last 6 turns for speed
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
              max_tokens: 80,
            }),
          }),
          dbWrites,
        ]);

        if (!aiResponse.ok) {
          console.error("AI error:", aiResponse.status);
          throw new Error("AI error");
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.choices?.[0]?.message?.content ||
          "No worries, let me get someone from the team to help you out.";

        console.log("AI:", aiText);

        // Log AI response + update transcript (fire-and-forget)
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

        // Check if goodbye
        const isGoodbye = /\b(goodbye|bye|take care|cheers|have a great|have a good|farewell)\b/i.test(aiText) &&
          aiText.length < 150;

        const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

        if (isGoodbye) {
          // Complete session in background
          supabase.from("voice_agent_sessions").update({
            status: "COMPLETED",
            ended_at: new Date().toISOString(),
            ai_summary: `Call with ${leadName}. Transcript recorded.`,
          }).eq("id", session.id).then(() => {}).catch(e => console.error(e));

          return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">${escapeXml(aiText)}</Speak>
</Response>`, {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/xml" },
          });
        }

        return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="2" speechModel="default" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${escapeXml(aiText)}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}">Looks like we lost connection. We&#39;ll follow up soon. Cheers!</Speak>
</Response>`, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }
    }

    // Fallback — no session found
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Thanks for calling! Someone from our team will be in touch shortly. Cheers!</Speak>
</Response>`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("ai-response error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Sorry about that, having a small technical hiccup. Our team will follow up with you shortly. Cheers!</Speak>
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