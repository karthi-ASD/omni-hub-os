import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Ticket Auto-Reply — Omni-Channel Client Notification
 *
 * Sends automatic confirmation to clients when a ticket is created.
 * Supports: Email reply, WhatsApp confirmation, Client Portal notification.
 *
 * POST body:
 * {
 *   ticket_id: string,
 *   ticket_number: string,
 *   recipient_email?: string,
 *   recipient_name?: string,
 *   recipient_phone?: string,
 *   channel: "email" | "whatsapp" | "portal" | "manual" | "website_form",
 *   business_id: string,
 *   client_id?: string,
 * }
 */

const EMAIL_TEMPLATE = (name: string, ticketNumber: string) => ({
  subject: `Ticket Received – NextWeb Support [Ticket #${ticketNumber}]`,
  body: `Hello${name ? ` ${name}` : ''},

We have received your message and a support ticket has been created in our system.

Ticket ID: ${ticketNumber}

Our team has been notified and is currently reviewing your request.

This is an automated response from the NextWeb AI Support System.

We are working on your request and will update you shortly.

For urgent assistance, you may contact our team using the numbers below:

Accounts Support: 1300 855 706
SEO Support: 1300 855 706
Technical Support: 1300 855 706
Sales Team: 1300 855 706

You may also log in to the client portal to track the status of your ticket:

https://nextweb.com.au

Thank you for contacting NextWeb.

Regards
NextWeb AI Support System`,
});

const SHORT_NOTIFICATION = (ticketNumber: string) =>
  `Hello,

Your request has been received and a support ticket has been created in the NextWeb system.

Ticket ID: ${ticketNumber}

You can log in to the client portal to check the ticket status:

https://nextweb.com.au

Our team will update you shortly.

Thank you,
NextWeb Support`;

const WHATSAPP_CONFIRMATION = (ticketNumber: string) =>
  `Hello 👋

Your request has been received and a support ticket has been created.

Ticket ID: ${ticketNumber}

Our team has been notified and is currently reviewing your request.

You can track the progress through the NextWeb client portal:
https://nextweb.com.au

Thank you,
NextWeb Support`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const {
      ticket_id, ticket_number, recipient_email, recipient_name,
      recipient_phone, channel, business_id, client_id,
    } = await req.json();

    if (!ticket_id || !ticket_number) {
      return new Response(JSON.stringify({ error: "Missing ticket_id or ticket_number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bid = business_id;
    const actions: string[] = [];

    // ── 1. Email Confirmation (for email-originated tickets) ──
    if (channel === "email" && recipient_email) {
      const tmpl = EMAIL_TEMPLATE(recipient_name || "", ticket_number);

      // Store auto-reply as ticket message
      await supabase.from("ticket_messages").insert({
        business_id: bid,
        ticket_id,
        sender_type: "system",
        sender_name: "NextWeb AI Support",
        sender_email: "support@nextweb.com.au",
        content: tmpl.body,
        is_internal: false,
      });

      actions.push("email_reply_queued");
      console.log(`Email auto-reply queued for ${recipient_email} re: ticket ${ticket_number}`);
    }

    // ── 2. WhatsApp Confirmation ──
    if ((channel === "whatsapp" || recipient_phone) && recipient_phone) {
      const waMessage = WHATSAPP_CONFIRMATION(ticket_number);

      // Call whatsapp-send-message function
      try {
        const sendUrl = `${supabaseUrl}/functions/v1/whatsapp-send-message`;
        const sendPayload: Record<string, unknown> = {
          to: recipient_phone,
          message: waMessage,
          automation_type: "ticket_confirmation",
        };
        if (client_id) sendPayload.client_id = client_id;
        if (ticket_id) sendPayload.ticket_id = ticket_id;

        const sendRes = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify(sendPayload),
        });

        if (sendRes.ok) {
          actions.push("whatsapp_confirmation_sent");
          console.log(`WhatsApp confirmation sent to ${recipient_phone} for ticket ${ticket_number}`);
        } else {
          const errData = await sendRes.json().catch(() => ({}));
          console.warn("WhatsApp send failed:", errData);
          actions.push("whatsapp_confirmation_failed");
        }
      } catch (waErr) {
        console.warn("WhatsApp send error:", waErr);
        actions.push("whatsapp_confirmation_error");
      }
    }

    // ── 3. Short notification for non-email channels ──
    if (channel !== "email" && channel !== "whatsapp") {
      const shortMsg = SHORT_NOTIFICATION(ticket_number);

      // Store as ticket message
      await supabase.from("ticket_messages").insert({
        business_id: bid,
        ticket_id,
        sender_type: "system",
        sender_name: "NextWeb Support",
        content: shortMsg,
        is_internal: false,
      });

      actions.push("short_notification_stored");
    }

    // ── 4. Client Portal Notification (always, if client matched) ──
    if (client_id && bid) {
      // Find user_id for this client
      const { data: clientProfile } = await supabase
        .from("clients")
        .select("user_id, contact_name")
        .eq("id", client_id)
        .single();

      if (clientProfile?.user_id) {
        await supabase.from("notifications").insert({
          business_id: bid,
          user_id: clientProfile.user_id,
          type: "info",
          title: `Ticket Created: #${ticket_number}`,
          message: `Your support ticket #${ticket_number} has been created. Our team is reviewing your request.`,
          client_id,
        });
        actions.push("portal_notification_sent");
      }
    }

    // ── 5. Notify business admins ──
    if (bid) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("business_id", bid)
        .in("role", ["business_admin", "super_admin"])
        .limit(5);

      if (adminRoles?.length) {
        const notifications = adminRoles.map((r) => ({
          business_id: bid,
          user_id: r.user_id,
          type: "info" as const,
          title: `New Ticket #${ticket_number}`,
          message: `From: ${recipient_name || recipient_email || recipient_phone || "Unknown"}. Channel: ${channel}.`,
        }));
        await supabase.from("notifications").insert(notifications);
        actions.push("admin_notifications_sent");
      }
    }

    // ── 6. Mark auto-reply sent on ticket ──
    await supabase.from("support_tickets").update({
      auto_reply_sent: true,
    } as any).eq("id", ticket_id);

    // ── 7. Audit log ──
    await supabase.from("ticket_audit_log").insert({
      business_id: bid,
      ticket_id,
      action_type: "auto_reply_sent",
      details: `Client notified via: ${actions.join(", ")}`,
    });

    return new Response(JSON.stringify({
      success: true,
      ticket_number,
      actions,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("ticket-auto-reply error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
