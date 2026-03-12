import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "research":
        systemPrompt = `You are an expert sales research assistant for a digital marketing agency (NextWeb). 
Given a business name and optional website/industry, provide a concise sales research brief.

Return your response in this exact format:
## Company Overview
Brief description of the business.

## Website Assessment
Key observations about their online presence.

## SEO Opportunities
Top 3-5 SEO weaknesses or opportunities.

## Competitor Landscape
Brief competitive analysis.

## Recommended Pitch Points
3-4 talking points for the sales call.

## Opportunity Score
Rate 1-100 based on likelihood of needing SEO services.

Keep it concise and actionable for a cold call.`;
        userPrompt = `Research this business for a sales call:
Business: ${context.businessName}
${context.website ? `Website: ${context.website}` : ""}
${context.industry ? `Industry: ${context.industry}` : ""}
${context.location ? `Location: ${context.location}` : ""}`;
        break;

      case "script":
        systemPrompt = `You are an expert sales script writer for a digital marketing agency (NextWeb).
Generate a concise cold calling script. Keep it natural, conversational, and under 300 words.

Structure:
## Opening (10 seconds)
## Problem Statement (15 seconds)
## Value Proposition (20 seconds)
## Key Questions to Ask
## Handling Objections
## Closing & Next Steps`;
        userPrompt = `Generate a cold call script for:
Business: ${context.businessName}
${context.industry ? `Industry: ${context.industry}` : ""}
${context.seoIssues ? `Known SEO Issues: ${context.seoIssues}` : ""}
${context.notes ? `Sales Notes: ${context.notes}` : ""}`;
        break;

      case "email":
        systemPrompt = `You are an expert sales email writer for a digital marketing agency (NextWeb).
Write a professional, personalized follow-up email. Keep it under 200 words.
Be warm but professional. Include a clear call-to-action.`;
        userPrompt = `Write a follow-up email for:
Business: ${context.businessName}
Contact: ${context.contactName || "the business owner"}
${context.previousInteraction ? `Previous Interaction: ${context.previousInteraction}` : ""}
${context.seoIssues ? `SEO Issues Found: ${context.seoIssues}` : ""}
${context.notes ? `Notes: ${context.notes}` : ""}
Purpose: ${context.purpose || "Follow up after initial cold call"}`;
        break;

      case "lead_score":
        systemPrompt = `You are a lead scoring AI for a digital marketing agency. 
Analyze the provided business information and return a JSON object with ONLY these fields:
- score: number 0-100
- factors: array of {factor: string, impact: "positive"|"negative"|"neutral", detail: string}
- recommendation: string (one sentence)
- priority: "high"|"medium"|"low"

Return ONLY valid JSON, no markdown, no explanation.`;
        userPrompt = `Score this lead:
Business: ${context.businessName}
${context.website ? `Website: ${context.website}` : "No website provided"}
${context.industry ? `Industry: ${context.industry}` : ""}
${context.location ? `Location: ${context.location}` : ""}
${context.hasLocalCompetition ? `Has local competition: yes` : ""}
${context.currentSeoStatus ? `Current SEO status: ${context.currentSeoStatus}` : ""}`;
        break;

      case "deal_suggestion":
        systemPrompt = `You are a service package recommendation AI for a digital marketing agency.
Based on the business details, recommend the best service package and estimated monthly value.

Return your response in this format:
## Recommended Package
Package name and brief description.

## Services Included
Bullet list of recommended services.

## Estimated Monthly Value
Dollar amount with justification.

## Upsell Opportunities
Future services that could be added.`;
        userPrompt = `Suggest a deal for:
Business: ${context.businessName}
${context.industry ? `Industry: ${context.industry}` : ""}
${context.location ? `Location: ${context.location}` : ""}
${context.website ? `Website: ${context.website}` : ""}
${context.seoScore ? `SEO Score: ${context.seoScore}/100` : ""}
${context.notes ? `Notes: ${context.notes}` : ""}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

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
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway returned ${status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // For lead_score, try to parse JSON
    if (type === "lead_score") {
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: { score: 50, factors: [], recommendation: content, priority: "medium" } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-sales-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
