import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log("AI Response - CallUUID:", callUuid, "Speech:", speechResult);

    // If no speech detected, say goodbye
    if (!speechResult || speechResult.trim() === "") {
      const goodbyeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="Polly.Joanna" language="en-US">I didn't hear anything. Thank you for your time. One of our team members will follow up with you shortly. Have a great day!</Speak>
</Response>`;
      return new Response(goodbyeXml, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Find session and conversation history
    let session: any = null;
    let leadName = "the caller";
    let businessName = "our company";
    let serviceInterest = "";
    let conversationHistory: Array<{ role: string; content: string }> = [];

    if (callUuid) {
      const { data: sess } = await supabase
        .from("voice_agent_sessions")
        .select("*")
        .eq("plivo_call_uuid", callUuid)
        .single();
      session = sess;

      if (session) {
        // Get lead info
        if (session.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("name, service_interest, email, phone")
            .eq("id", session.lead_id)
            .single();
          if (lead) {
            leadName = lead.name || leadName;
            serviceInterest = lead.service_interest || "";
          }
        } else if (session.inquiry_id) {
          const { data: inq } = await supabase
            .from("inquiries")
            .select("name, service, email, phone, message")
            .eq("id", session.inquiry_id)
            .single();
          if (inq) {
            leadName = inq.name || leadName;
            serviceInterest = inq.service || inq.message || "";
          }
        }

        // Get business info
        const { data: biz } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", session.business_id)
          .single();
        if (biz?.name) businessName = biz.name;

        // Get previous conversation events for context
        const { data: events } = await supabase
          .from("voice_agent_events")
          .select("event_type, payload_json")
          .eq("session_id", session.id)
          .in("event_type", ["USER_SPEECH", "AI_RESPONSE"])
          .order("created_at", { ascending: true })
          .limit(20);

        if (events) {
          for (const evt of events) {
            const payload = evt.payload_json as any;
            if (evt.event_type === "USER_SPEECH" && payload?.text) {
              conversationHistory.push({ role: "user", content: payload.text });
            } else if (evt.event_type === "AI_RESPONSE" && payload?.text) {
              conversationHistory.push({ role: "assistant", content: payload.text });
            }
          }
        }

        // Log this user speech
        await supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "PLIVO",
          event_type: "USER_SPEECH",
          payload_json: { text: speechResult },
        });
      }
    }

    // Build AI prompt
    const systemPrompt = `You are a professional, friendly AI sales assistant for ${businessName}. You are on a live phone call with ${leadName}.

Your goals:
1. Qualify the lead by understanding their needs, budget, and timeline
2. Answer questions about the company's services professionally
3. If the caller wants to schedule a meeting or callback, collect their preferred date/time
4. Keep responses concise and conversational (2-3 sentences max) since this is a phone call
5. Be warm, professional, and helpful - never pushy

${serviceInterest ? `The caller initially expressed interest in: ${serviceInterest}` : ""}

Important rules:
- Keep each response under 50 words - this is spoken aloud
- Sound natural and conversational, not robotic
- If the caller wants to end the call, say goodbye politely
- If asked something you don't know, offer to have a team member follow up
- Never mention you are an AI unless directly asked`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: speechResult },
    ];

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 150,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      throw new Error("AI Gateway error");
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || 
      "Thank you for that. Let me have a team member follow up with more details.";

    console.log("AI response text:", aiText);

    // Log AI response
    if (session) {
      await supabase.from("voice_agent_events").insert({
        business_id: session.business_id,
        session_id: session.id,
        event_source: "INTERNAL",
        event_type: "AI_RESPONSE",
        payload_json: { text: aiText, user_said: speechResult },
      });

      // Append to transcript
      const currentTranscript = session.transcript_text || "";
      const newTranscript = currentTranscript +
        `\nCaller: ${speechResult}\nAgent: ${aiText}`;
      await supabase.from("voice_agent_sessions").update({
        transcript_text: newTranscript.trim(),
      }).eq("id", session.id);
    }

    // Check if the AI is saying goodbye (simple heuristic)
    const isGoodbye = /\b(goodbye|good bye|bye|take care|have a great day|have a good day|farewell)\b/i.test(aiText) &&
      aiText.length < 200;

    const selfUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

    let responseXml: string;
    if (isGoodbye) {
      // End the conversation
      responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="Polly.Joanna" language="en-US">${escapeXml(aiText)}</Speak>
</Response>`;

      // Update session as completed
      if (session) {
        // Generate AI summary
        const summaryMessages = [
          { role: "system", content: "Summarize this call transcript in 2-3 sentences. Include: caller's needs, qualification level (hot/warm/cold), and any follow-up actions needed." },
          { role: "user", content: session.transcript_text + `\nCaller: ${speechResult}\nAgent: ${aiText}` },
        ];

        try {
          const summaryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: summaryMessages,
              max_tokens: 200,
            }),
          });

          if (summaryResp.ok) {
            const summaryData = await summaryResp.json();
            const summary = summaryData.choices?.[0]?.message?.content || "Call completed.";
            await supabase.from("voice_agent_sessions").update({
              status: "COMPLETED",
              ended_at: new Date().toISOString(),
              ai_summary: summary,
            }).eq("id", session.id);

            await supabase.from("system_events").insert({
              business_id: session.business_id,
              event_type: "VOICE_CALL_SUMMARY_READY",
              payload_json: { session_id: session.id, summary },
            });
          }
        } catch (sumErr) {
          console.error("Summary generation error:", sumErr);
          await supabase.from("voice_agent_sessions").update({
            status: "COMPLETED",
            ended_at: new Date().toISOString(),
          }).eq("id", session.id);
        }
      }
    } else {
      // Continue the conversation - speak AI response then listen again
      responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${selfUrl}" method="POST" inputType="speech" speechEndTimeout="2500" speechModel="enhanced" profanityFilter="false" log="true">
    <Speak voice="Polly.Joanna" language="en-US">${escapeXml(aiText)}</Speak>
  </GetInput>
  <Speak voice="Polly.Joanna" language="en-US">It seems like we got disconnected. Thank you for your time, and we'll follow up with you soon. Goodbye!</Speak>
</Response>`;
    }

    return new Response(responseXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("Plivo AI response error:", err);
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="Polly.Joanna" language="en-US">I apologize, but I'm having a technical difficulty. One of our team members will follow up with you shortly. Thank you for your patience. Goodbye!</Speak>
</Response>`;
    return new Response(errorXml, {
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
    .replace(/'/g, "&apos;");
}
