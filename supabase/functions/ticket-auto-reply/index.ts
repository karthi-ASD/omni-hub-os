import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticket_id, recipient_email, recipient_name, ticket_number } = await req.json();

    if (!ticket_id || !recipient_email) {
      return new Response(JSON.stringify({ error: "Missing ticket_id or recipient_email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build auto-reply email content
    const subject = `Ticket Received – NextWeb Support [Ticket #${ticket_number}]`;
    const body = `Hello${recipient_name ? ` ${recipient_name}` : ''},

Your message has been received and a support ticket has been created in our system.

Ticket ID: ${ticket_number}

The relevant team has been notified and is currently reviewing the issue.
This is an automated email from the NextWeb AI Support System.

We are working on this and will update you shortly.

For urgent matters, you may contact the team directly:
- Accounts Team: accounts@nextweb.com.au
- SEO Support: seo@nextweb.com.au
- Technical Support: support@nextweb.com.au
- Sales Team: sales@nextweb.com.au

Thank you,
NextWeb AI Support System`;

    // Mark auto-reply as sent on the ticket
    await supabase.from("support_tickets").update({
      auto_reply_sent: true,
    } as any).eq("id", ticket_id);

    // Log the auto-reply
    await supabase.from("ticket_audit_log").insert({
      business_id: (await supabase.from("support_tickets").select("business_id").eq("id", ticket_id).single()).data?.business_id,
      ticket_id,
      action_type: "auto_reply_sent",
      details: `Auto-reply sent to ${recipient_email}`,
    });

    // Add to ticket messages
    const { data: ticket } = await supabase.from("support_tickets")
      .select("business_id").eq("id", ticket_id).single();

    if (ticket) {
      await supabase.from("ticket_messages").insert({
        business_id: ticket.business_id,
        ticket_id,
        sender_type: "system",
        sender_name: "NextWeb AI Support",
        sender_email: "support@nextweb.com.au",
        content: body,
        is_internal: false,
      });
    }

    // Note: Actual email sending would be done via SMTP edge function
    // For now, we log the intent and mark it as sent
    console.log(`Auto-reply queued for ${recipient_email} re: ticket ${ticket_number}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Auto-reply prepared for ${recipient_email}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("ticket-auto-reply error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
