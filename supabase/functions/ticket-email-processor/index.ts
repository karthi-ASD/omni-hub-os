import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Junk sender patterns
const JUNK_SENDERS = [
  /^noreply@/i, /^no-reply@/i, /^mailer@/i, /^newsletter@/i,
  /^notifications@/i, /^updates@/i, /^alerts@/i, /^system@/i,
  /^postmaster@/i, /^daemon@/i, /^bounce@/i, /^autorespond/i,
];

// Junk subject keywords
const JUNK_SUBJECTS = [
  "promotion", "discount", "sale", "marketing", "newsletter", "unsubscribe",
  "advertisement", "offer", "otp", "verification code", "password reset",
  "payment confirmation", "subscription renewal", "social media digest",
  "service alert", "weekly update", "out of office", "automatic reply",
  "delivery failure", "bounce", "vacation", "autoresponder",
];

// Department routing by recipient email
const DEPT_BY_EMAIL: Record<string, string> = {
  "seo@nextweb.com.au": "seo",
  "accounts@nextweb.com.au": "accounts",
  "sales@nextweb.com.au": "sales",
  "dev@nextweb.co.in": "development",
  "hr@nextweb.co.in": "hr",
  "support@nextweb.com.au": "support",
  "support@nextweb.co.in": "support",
  "info@nextweb.com.au": "general",
};

// Subject trigger tags
const SUBJECT_TAGS: Record<string, string> = {
  "[TICKET]": "general", "[TASK]": "general", "[SUPPORT]": "support",
  "[URGENT]": "general", "[SEO]": "seo", "[DEV]": "development",
  "[ACCOUNTS]": "accounts", "[HR]": "hr", "[SALES]": "sales",
};

function isJunkEmail(from: string, subject: string, body: string): boolean {
  if (JUNK_SENDERS.some(p => p.test(from))) return true;
  const subjectLower = subject.toLowerCase();
  if (JUNK_SUBJECTS.some(k => subjectLower.includes(k))) return true;
  if (/auto-submitted:\s*auto-(replied|generated)/i.test(body)) return true;
  if (/^(re:\s*)?out of office/i.test(subject)) return true;
  return false;
}

function detectPriority(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();
  if (/(urgent|asap|critical|website down|server down|payment blocked|cannot login)/i.test(text)) return "critical";
  if (/(high priority|important|broken|not working|ad campaign stopped)/i.test(text)) return "high";
  if (/(low priority|when you get a chance|no rush)/i.test(text)) return "low";
  return "medium";
}

function detectDepartment(toEmail: string, subject: string, body: string): string {
  const emailKey = toEmail.toLowerCase().trim();
  if (DEPT_BY_EMAIL[emailKey]) return DEPT_BY_EMAIL[emailKey];
  for (const [tag, dept] of Object.entries(SUBJECT_TAGS)) {
    if (subject.toUpperCase().includes(tag)) return dept;
  }
  const text = `${subject} ${body}`.toLowerCase();
  if (/(seo|keyword|ranking|backlink|google search|organic)/i.test(text)) return "seo";
  if (/(invoice|payment|bill|account|renewal|subscription)/i.test(text)) return "accounts";
  if (/(website|bug|error|code|develop|feature|api|hosting|ssl|domain)/i.test(text)) return "development";
  if (/(hiring|recruitment|leave|salary|payroll|employee)/i.test(text)) return "hr";
  if (/(quote|proposal|pricing|lead|prospect|demo)/i.test(text)) return "sales";
  return "support";
}

function extractTicketIdFromSubject(subject: string): string | null {
  const match = subject.match(/\[Ticket\s*#?(\w+-\d+)\]/i) || subject.match(/\bTKT-\d+\b/i);
  return match ? match[0].replace(/[\[\]#]/g, "").trim() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const {
      from_email, from_name, to_email, subject, body, body_html,
      message_id, in_reply_to, attachments, business_id,
    } = await req.json();

    // 1. Junk filter
    if (isJunkEmail(from_email, subject, body || "")) {
      return new Response(JSON.stringify({ action: "ignored", reason: "junk" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Thread continuation (reply to existing ticket)
    const ticketRef = extractTicketIdFromSubject(subject);
    if (ticketRef || in_reply_to) {
      let existingTicket = null;
      if (ticketRef) {
        const { data } = await supabase.from("support_tickets")
          .select("id, business_id").ilike("ticket_number", `%${ticketRef}%`).maybeSingle();
        existingTicket = data;
      }
      if (!existingTicket && in_reply_to) {
        const { data } = await supabase.from("ticket_messages")
          .select("ticket_id").eq("message_id", in_reply_to).limit(1).maybeSingle();
        if (data) {
          const { data: t } = await supabase.from("support_tickets")
            .select("id, business_id").eq("id", data.ticket_id).maybeSingle();
          existingTicket = t;
        }
      }
      if (existingTicket) {
        await supabase.from("ticket_messages").insert({
          business_id: existingTicket.business_id,
          ticket_id: existingTicket.id,
          sender_type: "customer",
          sender_name: from_name,
          sender_email: from_email,
          content: body || subject,
          content_html: body_html,
          message_id,
          in_reply_to,
        });
        await supabase.from("support_tickets").update({
          status: "open", updated_at: new Date().toISOString(),
        }).eq("id", existingTicket.id).in("status", ["resolved", "closed"]);

        return new Response(JSON.stringify({
          action: "thread_updated", ticket_id: existingTicket.id,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 3. Client matching
    const bid = business_id;
    let clientId: string | null = null;
    let clientMatchStatus = "unmatched";
    let suggestedClientIds: string[] = [];

    if (bid && from_email) {
      const senderEmail = from_email.toLowerCase().trim();
      const senderDomain = senderEmail.split("@")[1];

      // Primary email match
      const { data: primaryMatch } = await supabase.from("clients")
        .select("id").eq("business_id", bid).ilike("email", senderEmail).limit(1).maybeSingle();
      if (primaryMatch) {
        clientId = primaryMatch.id;
        clientMatchStatus = "matched";
      }

      // Alternate email match
      if (!clientId) {
        const { data: altMatch } = await supabase.from("client_alternate_emails")
          .select("client_id").eq("business_id", bid).ilike("email", senderEmail).limit(1).maybeSingle();
        if (altMatch) {
          clientId = altMatch.client_id;
          clientMatchStatus = "matched";
        }
      }

      // Domain similarity match
      if (!clientId && senderDomain) {
        const { data: domainMatches } = await supabase.from("clients")
          .select("id, contact_name, company, email, website")
          .eq("business_id", bid)
          .or(`website.ilike.%${senderDomain}%,email.ilike.%@${senderDomain}`)
          .limit(5);
        if (domainMatches && domainMatches.length > 0) {
          if (domainMatches.length === 1) {
            clientId = domainMatches[0].id;
            clientMatchStatus = "matched";
          } else {
            suggestedClientIds = domainMatches.map(c => c.id);
            clientMatchStatus = "suggested";
          }
        }
      }

      // Name match
      if (!clientId && from_name) {
        const { data: nameMatch } = await supabase.from("clients")
          .select("id").eq("business_id", bid)
          .or(`contact_name.ilike.%${from_name}%,company.ilike.%${from_name}%`)
          .limit(3);
        if (nameMatch && nameMatch.length > 0) {
          if (nameMatch.length === 1) {
            clientId = nameMatch[0].id;
            clientMatchStatus = "matched";
          } else {
            suggestedClientIds = [...new Set([...suggestedClientIds, ...nameMatch.map(c => c.id)])];
            if (clientMatchStatus !== "matched") clientMatchStatus = "suggested";
          }
        }
      }
    }

    // 4. Detect department and priority
    const department = detectDepartment(to_email || "", subject, body || "");
    const priority = detectPriority(subject, body || "");

    // 5. Create ticket
    const { data: newTicket, error: ticketError } = await supabase.from("support_tickets").insert({
      business_id: bid,
      created_by_user_id: "00000000-0000-0000-0000-000000000000",
      subject,
      description: body || null,
      category: department === "accounts" ? "billing" : "general",
      priority,
      status: "open",
      channel: "email",
      department,
      sender_email: from_email,
      sender_name: from_name,
      source_type: "email",
      client_match_status: clientMatchStatus,
      client_id: clientId,
      message_id,
      in_reply_to,
      email_from: from_email,
      email_to: to_email,
      original_html: body_html,
      suggested_client_ids: suggestedClientIds.length > 0 ? suggestedClientIds : null,
    } as any).select().single();

    if (ticketError) throw ticketError;

    const ticket = newTicket as any;

    // 6. Create initial message in thread
    await supabase.from("ticket_messages").insert({
      business_id: bid,
      ticket_id: ticket.id,
      sender_type: "customer",
      sender_name: from_name,
      sender_email: from_email,
      content: body || subject,
      content_html: body_html,
      message_id,
    });

    // 7. Audit log
    await supabase.from("ticket_audit_log").insert({
      business_id: bid,
      ticket_id: ticket.id,
      action_type: "ticket_created",
      details: `Ticket created from email. Client match: ${clientMatchStatus}. Department: ${department}.`,
    });

    // 8. ── AUTO-NOTIFY CLIENT ──
    // Trigger the ticket-auto-reply function to send omni-channel notifications
    try {
      const autoReplyUrl = `${supabaseUrl}/functions/v1/ticket-auto-reply`;
      await fetch(autoReplyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          recipient_email: from_email,
          recipient_name: from_name,
          channel: "email",
          business_id: bid,
          client_id: clientId,
        }),
      });
      console.log(`Auto-reply triggered for email ticket ${ticket.ticket_number}`);
    } catch (replyErr) {
      console.warn("Auto-reply trigger failed:", replyErr);
    }

    // 9. ── AI Classification (async, non-blocking) ──
    try {
      const classifyUrl = `${supabaseUrl}/functions/v1/ticket-ai-classify`;
      fetch(classifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ ticket_id: ticket.id }),
      }).catch((e) => console.warn("AI classify trigger error:", e));
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({
      action: "ticket_created",
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      client_match_status: clientMatchStatus,
      department,
      priority,
      auto_reply: true,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("ticket-email-processor error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
