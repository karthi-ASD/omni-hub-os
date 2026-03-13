import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * AI Ticket Classification
 *
 * Accepts either:
 *   { ticket_id: string }  — fetches ticket data from DB
 *   { subject, body, from_email, to_email } — direct classification
 *
 * Updates the ticket with AI-generated: ai_summary, ai_tags, sentiment, department, priority
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const input = await req.json();
    let subject = input.subject || "";
    let body = input.body || "";
    let fromEmail = input.from_email || "";
    let toEmail = input.to_email || "";
    let ticketId = input.ticket_id || null;

    // If ticket_id provided, fetch data from DB
    if (ticketId && !subject) {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("subject, description, sender_email, email_to, channel, source_type")
        .eq("id", ticketId)
        .single();

      if (ticket) {
        subject = (ticket as any).subject || "";
        body = (ticket as any).description || "";
        fromEmail = (ticket as any).sender_email || "";
        toEmail = (ticket as any).email_to || "";
      } else {
        return new Response(JSON.stringify({ error: "Ticket not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!subject && !body) {
      return new Response(JSON.stringify({
        category: "client_support", department: "support", priority: "medium",
        sentiment: "neutral", summary: "Empty content", tags: [], should_create_ticket: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `You are an email/message classification AI for a digital agency (NextWeb). Analyze this message and respond with a JSON object.

Message:
From: ${fromEmail}
To: ${toEmail}
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
      return new Response(JSON.stringify({
        category: "client_support", department: "support", priority: "medium",
        sentiment: "neutral", summary: subject, tags: [], should_create_ticket: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let classification;
    try {
      classification = JSON.parse(content);
    } catch {
      classification = {
        category: "client_support", department: "support", priority: "medium",
        sentiment: "neutral", summary: subject, tags: [], should_create_ticket: true,
      };
    }

    // Update the ticket with AI results if ticket_id provided
    if (ticketId) {
      await supabase.from("support_tickets").update({
        ai_summary: classification.summary || null,
        ai_tags: classification.tags || null,
        sentiment: classification.sentiment || null,
      } as any).eq("id", ticketId);

      // Audit log
      const { data: ticket } = await supabase
        .from("support_tickets").select("business_id").eq("id", ticketId).single();
      if (ticket) {
        await supabase.from("ticket_audit_log").insert({
          business_id: (ticket as any).business_id,
          ticket_id: ticketId,
          action_type: "ai_classified",
          details: `AI: ${classification.category} | ${classification.department} | ${classification.priority} | ${classification.sentiment}`,
        });
      }
    }

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ticket-ai-classify error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
