import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * WhatsApp Incoming Webhook
 *
 * Meta requires:
 * 1. GET for webhook verification (hub.mode, hub.challenge, hub.verify_token)
 * 2. POST for incoming messages
 *
 * Set your verify_token in communications_providers credentials_json as "webhook_verify_token".
 * Or use an env secret WHATSAPP_VERIFY_TOKEN.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── GET: Webhook Verification ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "nextweb_whatsapp_verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }

    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── POST: Incoming Messages ──
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Meta sends notifications wrapped in entry[].changes[].value
    const entries = payload?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        // Status updates (sent, delivered, read)
        const statuses = value?.statuses || [];
        for (const status of statuses) {
          if (status.id) {
            // Update message status in conversation_messages
            await supabase
              .from("conversation_messages")
              .update({ status: status.status })
              .eq("provider_message_id", status.id);
          }
        }

        // Incoming messages
        const messages = value?.messages || [];
        const metadata = value?.metadata || {};
        const phoneNumberId = metadata?.phone_number_id;
        const contacts = value?.contacts || [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || contacts[0];
          const senderPhone = msg.from; // E.164 format
          const senderName = contact?.profile?.name || senderPhone;
          const messageId = msg.id;
          const timestamp = msg.timestamp
            ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // Extract message text
          let messageText = "";
          if (msg.type === "text") {
            messageText = msg.text?.body || "";
          } else if (msg.type === "image") {
            messageText = `[Image] ${msg.image?.caption || ""}`.trim();
          } else if (msg.type === "document") {
            messageText = `[Document] ${msg.document?.filename || ""}`.trim();
          } else if (msg.type === "audio") {
            messageText = "[Voice message]";
          } else if (msg.type === "video") {
            messageText = `[Video] ${msg.video?.caption || ""}`.trim();
          } else if (msg.type === "location") {
            messageText = `[Location] ${msg.location?.latitude},${msg.location?.longitude}`;
          } else if (msg.type === "reaction") {
            messageText = `[Reaction: ${msg.reaction?.emoji || ""}]`;
          } else {
            messageText = `[${msg.type}]`;
          }

          // Find business by phone_number_id
          let businessId: string | null = null;
          const { data: providers } = await supabase
            .from("communications_providers")
            .select("business_id, credentials_json")
            .eq("channel", "whatsapp")
            .eq("is_active", true);

          if (providers) {
            for (const p of providers) {
              try {
                const creds = typeof p.credentials_json === "string"
                  ? JSON.parse(p.credentials_json)
                  : p.credentials_json;
                if (creds?.phone_number_id === phoneNumberId) {
                  businessId = p.business_id;
                  break;
                }
              } catch { /* skip */ }
            }
          }

          if (!businessId) {
            // Fallback: try first active business
            const { data: biz } = await supabase
              .from("businesses")
              .select("id")
              .eq("status", "active")
              .limit(1)
              .single();
            businessId = biz?.id || null;
          }

          if (!businessId) {
            console.error("No business found for WhatsApp phone_number_id:", phoneNumberId);
            continue;
          }

          // Try to match sender to lead or client
          let leadId: string | null = null;
          let clientId: string | null = null;
          let ticketId: string | null = null;

          const normalizedPhone = senderPhone.replace(/\D/g, "");

          // Check leads
          const { data: leadMatch } = await supabase
            .from("leads")
            .select("id")
            .eq("business_id", businessId)
            .ilike("phone", `%${normalizedPhone.slice(-9)}%`)
            .limit(1)
            .single();
          if (leadMatch) leadId = leadMatch.id;

          // Check clients
          if (!leadId) {
            const { data: clientMatch } = await supabase
              .from("clients")
              .select("id")
              .eq("business_id", businessId)
              .ilike("phone", `%${normalizedPhone.slice(-9)}%`)
              .limit(1)
              .single();
            if (clientMatch) clientId = clientMatch.id;
          }

          // Check for open tickets linked to this lead/client
          if (leadId || clientId) {
            const ticketQuery = supabase
              .from("support_tickets")
              .select("id")
              .eq("business_id", businessId)
              .in("status", ["open", "in_progress"])
              .order("created_at", { ascending: false })
              .limit(1);

            if (clientId) ticketQuery.eq("client_id", clientId);
            const { data: ticketMatch } = await ticketQuery.single();
            if (ticketMatch) ticketId = ticketMatch.id;
          }

          // Find or create conversation thread
          const threadFilter: Record<string, unknown> = {
            business_id: businessId,
            thread_type: "whatsapp",
          };
          if (leadId) threadFilter.lead_id = leadId;
          else if (clientId) threadFilter.client_id = clientId;

          let threadId: string | null = null;

          const { data: existingThread } = await supabase
            .from("conversation_threads")
            .select("id")
            .match(threadFilter)
            .eq("status", "active")
            .limit(1)
            .single();

          if (existingThread) {
            threadId = existingThread.id;
          } else {
            const { data: newThread } = await supabase
              .from("conversation_threads")
              .insert({
                business_id: businessId,
                thread_type: "whatsapp",
                lead_id: leadId,
                client_id: clientId,
                ticket_id: ticketId,
                subject: `WhatsApp – ${senderName}`,
                status: "active",
                last_message_at: timestamp,
              })
              .select("id")
              .single();
            threadId = newThread?.id ?? null;
          }

          if (!threadId) {
            console.error("Failed to create conversation thread");
            continue;
          }

          // Store message
          await supabase.from("conversation_messages").insert({
            business_id: businessId,
            thread_id: threadId,
            direction: "inbound",
            channel: "whatsapp",
            provider_message_id: messageId,
            from_address: senderPhone,
            body_text: messageText,
            status: "received",
            received_at: timestamp,
          });

          // Update thread
          await supabase
            .from("conversation_threads")
            .update({ last_message_at: timestamp })
            .eq("id", threadId);

          // Create notification for business admins
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("business_id", businessId)
            .in("role", ["business_admin", "super_admin"])
            .limit(3);

          if (adminRoles) {
            const notifications = adminRoles.map((r) => ({
              business_id: businessId,
              user_id: r.user_id,
              type: "info" as const,
              title: `WhatsApp from ${senderName}`,
              message: messageText.substring(0, 200),
            }));
            await supabase.from("notifications").insert(notifications);
          }

          // If linked to a ticket, add as comment
          if (ticketId) {
            await supabase.from("ticket_comments").insert({
              ticket_id: ticketId,
              comment: `[WhatsApp] ${messageText}`,
              is_internal: false,
              sender_name: senderName,
              sender_email: null,
              source: "whatsapp",
            });
          }

          console.log(`Processed WhatsApp message from ${senderPhone} (${senderName}), thread: ${threadId}`);
        }
      }
    }

    // Meta expects 200 quickly
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    // Still return 200 to prevent Meta from retrying
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
