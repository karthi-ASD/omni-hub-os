import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { subject, body, from_email, to_email } = await req.json();

    const prompt = `You are an email classification AI for a digital agency (NextWeb). Analyze this email and respond with a JSON object.

Email:
From: ${from_email}
To: ${to_email}
Subject: ${subject}
Body: ${(body || "").slice(0, 2000)}

Classify into exactly one category:
- client_support: Client asking for help or reporting an issue
- work_request: Client requesting work to be done
- internal_task: Internal staff communication about tasks
- billing_query: Invoice, payment, or account queries
- seo_request: SEO-related requests or reports
- dev_request: Website/development related requests
- hr_request: HR, staffing, or employee matters
- sales_request: Sales, quotes, proposals, new leads
- notification: System notifications (should not create ticket)
- promotion: Marketing/promotional (should not create ticket)
- spam: Spam/junk (should not create ticket)

Also detect:
- department: which department should handle this (seo, accounts, development, hr, sales, support, general)
- priority: critical, high, medium, low
- sentiment: positive, neutral, negative, urgent
- summary: one-sentence summary
- tags: array of relevant tags
- should_create_ticket: boolean

Respond ONLY with valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an email classification engine. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      // Fallback classification
      return new Response(JSON.stringify({
        category: "client_support",
        department: "support",
        priority: "medium",
        sentiment: "neutral",
        summary: subject,
        tags: [],
        should_create_ticket: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const classification = JSON.parse(content);
      return new Response(JSON.stringify(classification), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({
        category: "client_support",
        department: "support",
        priority: "medium",
        sentiment: "neutral",
        summary: subject,
        tags: [],
        should_create_ticket: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("ticket-ai-classify error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
