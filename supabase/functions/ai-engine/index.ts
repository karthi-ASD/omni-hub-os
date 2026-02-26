import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_type, payload } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] | undefined;
    let toolChoice: any | undefined;

    if (task_type === "lead_score") {
      systemPrompt = `You are an expert B2B lead scoring engine for a digital agency CRM. Score leads based on their attributes. Consider: source quality, budget size, service type demand, response urgency, and industry fit.`;
      userPrompt = `Score this lead and provide recommendations:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "score_lead",
          description: "Return a lead score with priority and recommended action",
          parameters: {
            type: "object",
            properties: {
              score: { type: "number", description: "Score 0-100" },
              priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
              recommended_action: { type: "string", description: "Next best action for this lead" },
              reasoning: { type: "string", description: "Brief explanation of the score" },
            },
            required: ["score", "priority", "recommended_action", "reasoning"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "score_lead" } };
    } else if (task_type === "seo_analysis") {
      systemPrompt = `You are an expert SEO analyst for a digital agency. Analyze the provided campaign data and give actionable recommendations.`;
      userPrompt = `Analyze this SEO campaign and provide recommendations:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "seo_recommendations",
          description: "Return SEO analysis with actionable recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: ["on_page", "off_page", "technical", "content", "local"] },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["category", "priority", "title", "description"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["recommendations", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "seo_recommendations" } };
    } else if (task_type === "sales_forecast") {
      systemPrompt = `You are a sales analytics AI for a digital agency. Based on the pipeline data, forecast monthly revenue.`;
      userPrompt = `Forecast revenue based on this pipeline data:\n${JSON.stringify(payload)}`;
      tools = [{
        type: "function",
        function: {
          name: "forecast_revenue",
          description: "Return revenue forecast with confidence",
          parameters: {
            type: "object",
            properties: {
              projected_revenue: { type: "number" },
              confidence: { type: "number", description: "0-100 confidence percentage" },
              factors: {
                type: "array",
                items: { type: "string" },
              },
              summary: { type: "string" },
            },
            required: ["projected_revenue", "confidence", "factors", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "forecast_revenue" } };
    } else {
      return new Response(JSON.stringify({ error: "Unknown task_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      throw new Error(`AI gateway error [${aiResp.status}]: ${errText}`);
    }

    const aiData = await aiResp.json();

    // Extract tool call result
    let result: any = null;
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    if (toolCalls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(toolCalls[0].function.arguments);
      } catch {
        result = { raw: toolCalls[0].function.arguments };
      }
    } else {
      result = { raw: aiData.choices?.[0]?.message?.content || "" };
    }

    return new Response(JSON.stringify({ task_type, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
