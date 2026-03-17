import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * WhatsApp Support Reply - send outbound reply from CRM support staff
 *
 * POST body:
 * {
 *   conversation_id: "uuid",
 *   message_text: "reply text",
 *   ticket_id?: "uuid"
 * }
 *
 * Uses NextWeb global support credentials (not per-client).
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id, full_name")
      .eq("user_id", userId)
      .single();

    if (!profile?.business_id) {
      return new Response(JSON.stringify({ error: "No business context" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { conversation_id, message_text, ticket_id } = body;

    if (!conversation_id || !message_text?.trim()) {
      return new Response(JSON.stringify({ error: "Missing conversation_id or message_text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation details
    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("id", conversation_id)
      .eq("business_id", profile.business_id)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load NextWeb support credentials
    const { data: integration } = await supabase
      .from("global_integrations")
      .select("config")
      .eq("integration_key", "nextweb_whatsapp_support")
      .eq("is_active", true)
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "WhatsApp support integration not active" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = integration.config as Record<string, unknown>;
    const phoneNumberId = config.phone_number_id as string;
    const accessToken = Deno.env.get("NEXTWEB_WHATSAPP_ACCESS_TOKEN") ||
      Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "WhatsApp access token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Meta Graph API
    const recipientPhone = conversation.client_whatsapp_phone.replace("+", "");
    const graphUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const waPayload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: message_text.trim() },
    };

    const waRes = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(waPayload),
    });

    const waData = await waRes.json();
    const waMessageId = waData?.messages?.[0]?.id || null;
    const success = waRes.ok && !!waMessageId;

    const now = new Date().toISOString();

    // Store outbound message
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      client_id: conversation.client_id,
      ticket_id: ticket_id || conversation.ticket_id,
      business_id: profile.business_id,
      whatsapp_message_id: waMessageId,
      direction: "outbound",
      sender_type: "support",
      sender_user_id: userId,
      sender_display_name: profile.full_name || "Support",
      to_phone: conversation.client_whatsapp_phone,
      from_phone: phoneNumberId,
      message_type: "text",
      message_text: message_text.trim(),
      status: success ? "sent" : "failed",
      sent_at: now,
      error_message: success ? null : JSON.stringify(waData),
    });

    // Update conversation
    await supabase.from("whatsapp_conversations").update({
      last_message_at: now,
      last_message_preview: message_text.trim().substring(0, 200),
      direction_last: "outbound",
      unread_for_client_count: (conversation.unread_for_client_count || 0) + 1,
      unread_for_support_count: 0,
    }).eq("id", conversation_id);

    // Update ticket if linked
    const linkedTicketId = ticket_id || conversation.ticket_id;
    if (linkedTicketId) {
      await supabase.from("support_tickets").update({
        updated_at: now,
        support_last_reply_at: now,
      } as Record<string, unknown>).eq("id", linkedTicketId);

      // Add to ticket messages
      await supabase.from("ticket_messages").insert({
        business_id: profile.business_id,
        ticket_id: linkedTicketId,
        sender_type: "agent",
        sender_name: profile.full_name || "Support",
        content: `[WhatsApp Reply] ${message_text.trim()}`,
        is_internal: false,
      });
    }

    // System event
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: success ? "whatsapp_reply_sent_by_support" : "whatsapp_message_failed",
      payload_json: {
        conversation_id,
        ticket_id: linkedTicketId,
        user_id: userId,
        to: conversation.client_whatsapp_phone,
        success,
      },
    });

    return new Response(JSON.stringify({
      success,
      message_id: waMessageId,
      conversation_id,
    }), {
      status: success ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("WhatsApp support reply error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
