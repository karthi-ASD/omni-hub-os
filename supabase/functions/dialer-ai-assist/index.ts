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

    const systemPrompt = `You are an expert real-time AI sales coach analyzing a live call transcript. The transcript has [agent] and [customer] labels.

CRITICAL RULES:
- Focus on the LAST 2-3 lines of the transcript to understand the current moment
- Detect the conversation stage: opening, discovery, objection, negotiation, closing
- Suggestions must be SPECIFIC to what was just said — never generic
- Each suggestion must be something the agent can say RIGHT NOW in this exact conversation
- Coach tips must be ONE strong actionable instruction, not vague advice

BANNED SUGGESTIONS (never generate these):
- "Thanks for your time"
- "Is there anything else I can help with?"
- "That's a great question"
- Any greeting or pleasantry
- Anything the agent already said

Return a JSON object with two keys:

1. "suggestions" - Array of exactly 2 suggested responses. Each has:
   - "type": one of "reply", "objection", "close", "question", "follow_up"
   - "text": the exact words to say (conversational, max 25 words, ready to speak aloud)
   - "confidence": 0-1 how appropriate this is right now

2. "coaching" - Real-time coaching:
   - "intent": what the customer wants RIGHT NOW (max 10 words)
   - "sentiment": "positive", "neutral", or "negative"
   - "risk": "low", "medium", or "high" - risk of losing this prospect
   - "opportunity": ONE specific thing the agent should do next (max 15 words)
   - "tips": array of exactly 1 strong actionable coaching instruction (max 20 words)
   - "missed_opportunities": array of 0-1 things the agent missed (max 15 words each)
   - "talk_listen_balance": "agent_heavy", "balanced", or "customer_heavy"
   - "close_readiness": "not_ready", "warming", or "ready"

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
          { role: "user", content: `Live call transcript (focus on the last 2-3 lines):\n${transcript}\n\nProvide 2 specific suggestions and 1 strong coaching instruction for this exact moment.` },
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

      // Filter out generic suggestions
      const BANNED_PHRASES = [
        "thanks for your time", "great question", "anything else",
        "how can i help", "nice to meet", "pleasure speaking",
        "have a great day", "thank you for calling",
      ];

      if (parsed.suggestions) {
        parsed.suggestions = parsed.suggestions.filter((s: any) => {
          const lower = (s.text || "").toLowerCase();
          return !BANNED_PHRASES.some(bp => lower.includes(bp));
        }).slice(0, 2); // Max 2 suggestions
      }

      // Ensure tips is max 1 strong instruction
      if (parsed.coaching?.tips) {
        parsed.coaching.tips = parsed.coaching.tips.slice(0, 1);
      }

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
