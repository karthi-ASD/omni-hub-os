import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Inbound Email-to-Ticket Webhook
 *
 * Accepts POST with JSON body:
 * {
 *   from:       "John Doe <john@example.com>",
 *   to:         "support@yourdomain.com",
 *   subject:    "Need help with ...",
 *   body_text:  "plain text body",
 *   body_html:  "<p>html body</p>",   // optional
 *   message_id: "<msg-id@mail>",       // for threading
 *   in_reply_to: "<original-msg-id>",  // for threading
 *   references:  "<ref1> <ref2>",      // for threading
 * }
 *
 * Also supports multipart/form-data (common with SendGrid, Mailgun, etc.)
 */

interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  message_id?: string;
  in_reply_to?: string;
  references?: string;
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  // "John Doe <john@example.com>" → { name: "John Doe", email: "john@example.com" }
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
  return { name: raw.trim(), email: raw.trim().toLowerCase() };
}

function generateTicketNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `EMAIL-${num}`;
}

function extractThreadId(email: InboundEmail): string | null {
  // Use in_reply_to or first reference as thread identifier
  if (email.in_reply_to) return email.in_reply_to.replace(/[<>]/g, "").trim();
  if (email.references) {
    const refs = email.references.split(/\s+/).filter(Boolean);
    if (refs.length > 0) return refs[0].replace(/[<>]/g, "").trim();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Parse the inbound email payload
    let emailData: InboundEmail;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      emailData = {
        from: formData.get("from")?.toString() || "",
        to: formData.get("to")?.toString() || "",
        subject: formData.get("subject")?.toString() || "(No Subject)",
        body_text: formData.get("text")?.toString() || formData.get("body_text")?.toString() || "",
        body_html: formData.get("html")?.toString() || formData.get("body_html")?.toString() || "",
        message_id: formData.get("Message-ID")?.toString() || formData.get("message_id")?.toString() || "",
        in_reply_to: formData.get("In-Reply-To")?.toString() || formData.get("in_reply_to")?.toString() || "",
        references: formData.get("References")?.toString() || formData.get("references")?.toString() || "",
      };
    } else {
      emailData = await req.json();
    }

    if (!emailData.from || !emailData.to) {
      return new Response(JSON.stringify({ error: "Missing from/to fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sender = parseEmailAddress(emailData.from);
    const recipient = parseEmailAddress(emailData.to);
    const body = emailData.body_text || emailData.body_html || "";
    const subject = emailData.subject || "(No Subject)";
    const threadId = extractThreadId(emailData);
    const messageId = emailData.message_id?.replace(/[<>]/g, "").trim() || crypto.randomUUID();

    // Determine business from recipient email
    // Look up which business owns this support email address
    // First try matching via settings, then fall back to first active business
    let businessId: string | null = null;
    let clientId: string | null = null;

    // Try to find client by sender email
    const { data: clientMatch } = await supabase
      .from("clients")
      .select("id, business_id")
      .eq("email", sender.email)
      .limit(1)
      .single();

    if (clientMatch) {
      businessId = clientMatch.business_id;
      clientId = clientMatch.id;
    } else {
      // Try contact_name email match
      const { data: clientByContact } = await supabase
        .from("clients")
        .select("id, business_id")
        .ilike("email", sender.email)
        .limit(1)
        .single();

      if (clientByContact) {
        businessId = clientByContact.business_id;
        clientId = clientByContact.id;
      } else {
        // Fallback: use first active business
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("status", "active")
          .limit(1)
          .single();
        businessId = biz?.id || null;
      }
    }

    if (!businessId) {
      return new Response(JSON.stringify({ error: "No business found to route this email" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this is a reply to an existing ticket
    let ticketId: string | null = null;
    let isReply = false;

    if (threadId) {
      const { data: existingTicket } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("email_thread_id", threadId)
        .limit(1)
        .single();

      if (existingTicket) {
        ticketId = existingTicket.id;
        isReply = true;
      }
    }

    // Also check subject for ticket number pattern (e.g., [EMAIL-123456])
    if (!ticketId) {
      const ticketNumMatch = subject.match(/\[([A-Z]+-\d+)\]/);
      if (ticketNumMatch) {
        const { data: ticketByNum } = await supabase
          .from("support_tickets")
          .select("id")
          .eq("ticket_number", ticketNumMatch[1])
          .limit(1)
          .single();
        if (ticketByNum) {
          ticketId = ticketByNum.id;
          isReply = true;
        }
      }
    }

    if (isReply && ticketId) {
      // ── REPLY: Append comment to existing ticket ──
      await supabase.from("ticket_comments").insert({
        ticket_id: ticketId,
        comment: body.substring(0, 10000),
        is_internal: false,
        sender_name: sender.name,
        sender_email: sender.email,
        source: "email",
      });

      // Reopen ticket if it was resolved/closed
      await supabase
        .from("support_tickets")
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", ticketId)
        .in("status", ["resolved", "closed"]);

      // Log the inbound email
      await supabase.from("ticket_email_logs").insert({
        business_id: businessId,
        ticket_id: ticketId,
        email_type: "reply_inbound",
        sender_email: sender.email,
        recipient_email: recipient.email,
        subject: subject,
        body_snapshot: body.substring(0, 5000),
        message_id: messageId,
        direction: "inbound",
        sent_at: new Date().toISOString(),
        status: "received",
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "reply_appended",
          ticket_id: ticketId,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── NEW TICKET: Create from email ──
    const ticketNumber = generateTicketNumber();
    const newThreadId = messageId;

    // Get a system user for created_by (first business_admin)
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("business_id", businessId)
      .eq("role", "business_admin")
      .limit(1)
      .single();

    const createdByUserId = adminRole?.user_id;
    if (!createdByUserId) {
      return new Response(JSON.stringify({ error: "No admin user found for this business" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newTicket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        business_id: businessId,
        created_by_user_id: createdByUserId,
        client_id: clientId,
        ticket_number: ticketNumber,
        category: "email_inquiry",
        priority: "medium",
        status: "open",
        subject: subject.substring(0, 500),
        description: body.substring(0, 10000),
        channel: "email",
        sender_email: sender.email,
        email_thread_id: newThreadId,
      })
      .select("id")
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      return new Response(JSON.stringify({ error: "Failed to create ticket", details: ticketError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    ticketId = newTicket.id;

    // Log inbound email
    await supabase.from("ticket_email_logs").insert({
      business_id: businessId,
      ticket_id: ticketId,
      email_type: "inbound",
      sender_email: sender.email,
      recipient_email: recipient.email,
      subject: subject,
      body_snapshot: body.substring(0, 5000),
      message_id: messageId,
      direction: "inbound",
      sent_at: new Date().toISOString(),
      status: "received",
    });

    // Log confirmation email (outbound) — will be sent by email provider
    await supabase.from("ticket_email_logs").insert({
      business_id: businessId,
      ticket_id: ticketId,
      email_type: "confirmation",
      sender_email: recipient.email,
      recipient_email: sender.email,
      subject: `Re: ${subject} [${ticketNumber}]`,
      body_snapshot: `Thank you for contacting us, ${sender.name}.\n\nYour support ticket has been created with reference number ${ticketNumber}.\n\nWe will get back to you shortly. You can reply to this email to add more details to your ticket.\n\nRegards,\nSupport Team`,
      message_id: `confirmation-${ticketId}`,
      direction: "outbound",
      sent_at: new Date().toISOString(),
      status: "queued",
    });

    // Create notification for assigned team
    await supabase.from("notifications").insert({
      business_id: businessId,
      user_id: createdByUserId,
      type: "info",
      title: `New email ticket: ${ticketNumber}`,
      message: `From ${sender.name} (${sender.email}): ${subject.substring(0, 100)}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        action: "ticket_created",
        ticket_id: ticketId,
        ticket_number: ticketNumber,
        thread_id: newThreadId,
        confirmation_subject: `Re: ${subject} [${ticketNumber}]`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Inbound email processing error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error processing email", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
