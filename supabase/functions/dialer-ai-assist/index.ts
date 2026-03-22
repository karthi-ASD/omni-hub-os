import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { transcript, session_id, business_id, disposition } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return new Response(
        JSON.stringify({ suggestions: [], coaching: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a real-time AI sales coach analyzing a live call transcript. The transcript has [agent] and [customer] labels.

Return a JSON object with two keys:
1. "suggestions" - Array of 3-5 suggested responses the agent could say next. Each has:
   - "type": one of "reply", "objection", "close", "question", "follow_up"
   - "text": the actual response text (conversational, concise, human-sounding)
   - "confidence": 0-1 how appropriate this response is

2. "coaching" - Real-time coaching insights:
   - "intent": what the customer wants (1 sentence)
   - "sentiment": "positive", "neutral", or "negative"
   - "risk": "low", "medium", or "high" - risk of losing this prospect
   - "opportunity": current opportunity to advance the sale (1 sentence)
   - "tips": array of 2-3 short actionable coaching tips for the agent right now
   - "missed_opportunities": array of 0-2 things the agent could have done better
   - "talk_listen_balance": "agent_heavy", "balanced", or "customer_heavy"
   - "close_readiness": "not_ready", "warming", or "ready"

Keep suggestions conversational, practical, and ready to speak aloud.
Keep coaching actionable and brief.
Never hallucinate pricing, promises, or commitments.
${disposition ? `Current disposition stage: ${disposition}` : ""}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Live call transcript:\n${transcript}\n\nProvide suggestions and coaching.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_call_assistance",
              description: "Provide real-time suggestions and coaching for a live sales call",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["reply", "objection", "close", "question", "follow_up"] },
                        text: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["type", "text"],
                    },
                  },
                  coaching: {
                    type: "object",
                    properties: {
                      intent: { type: "string" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                      risk: { type: "string", enum: ["low", "medium", "high"] },
                      opportunity: { type: "string" },
                      tips: { type: "array", items: { type: "string" } },
                      missed_opportunities: { type: "array", items: { type: "string" } },
                      talk_listen_balance: { type: "string", enum: ["agent_heavy", "balanced", "customer_heavy"] },
                      close_readiness: { type: "string", enum: ["not_ready", "warming", "ready"] },
                    },
                    required: ["intent", "sentiment", "risk", "tips"],
                  },
                },
                required: ["suggestions", "coaching"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_call_assistance" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ suggestions: [], coaching: null, error: "AI processing failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let result = { suggestions: [], coaching: null };
    if (toolCall?.function?.arguments) {
      const parsed =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      result = parsed;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI assist error:", err);
    return new Response(
      JSON.stringify({ suggestions: [], coaching: null, error: String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
