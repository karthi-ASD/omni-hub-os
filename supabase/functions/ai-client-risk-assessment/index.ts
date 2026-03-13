import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI business analyst for an agency management platform. 
Analyze client data and return a JSON assessment using tool calling.

Evaluate these factors:
- Payment history and consistency
- Contract value and duration
- Service type and engagement level
- Support ticket frequency
- Overall client health indicators

Return structured predictions for renewal probability, churn risk, health score, and actionable recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this client data and provide renewal prediction:\n${JSON.stringify(client_data)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "client_risk_assessment",
              description: "Return structured client risk and renewal assessment",
              parameters: {
                type: "object",
                properties: {
                  renewal_probability: { type: "string", enum: ["high", "medium", "low"] },
                  churn_risk: { type: "string", enum: ["high", "medium", "low"] },
                  health_score: { type: "string", enum: ["excellent", "healthy", "needs_attention", "critical"] },
                  risk_factors: {
                    type: "array",
                    items: { type: "string" },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        target_team: { type: "string", enum: ["sales", "accounts", "seo", "support"] },
                      },
                      required: ["action", "priority", "target_team"],
                      additionalProperties: false,
                    },
                  },
                  upsell_opportunities: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["renewal_probability", "churn_risk", "health_score", "risk_factors", "recommendations", "upsell_opportunities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "client_risk_assessment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let assessment = null;

    if (toolCall?.function?.arguments) {
      try {
        assessment = JSON.parse(toolCall.function.arguments);
      } catch {
        assessment = { renewal_probability: "medium", churn_risk: "medium", health_score: "healthy", risk_factors: [], recommendations: [], upsell_opportunities: [] };
      }
    }

    return new Response(JSON.stringify({ assessment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI risk assessment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
