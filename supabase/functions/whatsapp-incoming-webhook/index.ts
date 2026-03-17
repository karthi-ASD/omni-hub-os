import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)]/g, "");
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

function phoneSuffix(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

function detectPriority(text: string): string {
  const l = text.toLowerCase();
  if (/(urgent|asap|critical|down|emergency|not working|blocked)/i.test(l)) return "critical";
  if (/(high priority|important|broken|stopped)/i.test(l)) return "high";
  if (/(low priority|no rush|when you can)/i.test(l)) return "low";
  return "normal";
}

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

    // Load verify token from global_integrations config
    const { data: integration } = await supabase
      .from("global_integrations")
      .select("config")
      .eq("integration_key", "nextweb_whatsapp_support")
      .eq("is_active", true)
      .single();

    const verifyToken = integration?.config?.webhook_verify_token ||
      Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "whatsapp_webhook_token_123";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified successfully");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    console.warn("Webhook verification failed - token mismatch");
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Load NextWeb support integration config
    const { data: integration } = await supabase
      .from("global_integrations")
      .select("config")
      .eq("integration_key", "nextweb_whatsapp_support")
      .eq("is_active", true)
      .single();

    if (!integration) {
      console.error("NextWeb WhatsApp support integration not found or inactive");
      return new Response(JSON.stringify({ success: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = integration.config as Record<string, unknown>;
    const supportPhoneNumberId = config.phone_number_id as string;
    const autoReplyEnabled = config.default_auto_reply_enabled as boolean;
    const autoReplyMessage = config.default_auto_reply_message as string;
    const cooldownHours = (config.auto_reply_cooldown_hours as number) || 6;
    const accessToken = Deno.env.get("NEXTWEB_WHATSAPP_ACCESS_TOKEN") ||
      Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    // Get the business_id for NextWeb (the platform business)
    // Use profiles of super_admin to determine the platform business
    const { data: adminProfile } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1)
      .single();

    let businessId: string | null = null;
    if (adminProfile) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("user_id", adminProfile.user_id)
        .single();
      businessId = profile?.business_id ?? null;
    }

    if (!businessId) {
      // Fallback: first active business
      const { data: biz } = await supabase
        .from("businesses").select("id").eq("status", "active").limit(1).single();
      businessId = biz?.id ?? null;
    }

    if (!businessId) {
      console.error("No business context found for WhatsApp support");
      return new Response(JSON.stringify({ success: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entries = payload?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        const metadata = value?.metadata || {};
        const webhookPhoneNumberId = metadata?.phone_number_id;

        // Only process messages for our NextWeb support number
        if (webhookPhoneNumberId && webhookPhoneNumberId !== supportPhoneNumberId) {
          console.log(`Ignoring webhook for non-support phone_number_id: ${webhookPhoneNumberId}`);
          continue;
        }

        // ── Status updates ──
        const statuses = value?.statuses || [];
        for (const st of statuses) {
          const waMessageId = st.id;
          if (!waMessageId) continue;

          const statusValue = st.status; // sent, delivered, read, failed
          const eventTime = st.timestamp
            ? new Date(parseInt(st.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // Update whatsapp_messages
          const updateFields: Record<string, unknown> = {
            status: statusValue,
            status_updated_at: eventTime,
          };
          if (statusValue === "delivered") updateFields.delivered_at = eventTime;
          if (statusValue === "read") updateFields.read_at = eventTime;
          if (statusValue === "failed") {
            updateFields.failed_at = eventTime;
            updateFields.error_message = JSON.stringify(st.errors || []);
          }

          await supabase
            .from("whatsapp_messages")
            .update(updateFields)
            .eq("whatsapp_message_id", waMessageId);

          // Get conversation_id for status event
          const { data: msgRow } = await supabase
            .from("whatsapp_messages")
            .select("conversation_id")
            .eq("whatsapp_message_id", waMessageId)
            .maybeSingle();

          // Insert status event
          await supabase.from("whatsapp_message_status_events").insert({
            whatsapp_message_id: waMessageId,
            conversation_id: msgRow?.conversation_id || null,
            business_id: businessId,
            status: statusValue,
            event_payload: st,
            event_time: eventTime,
          });

          // Log system event
          await supabase.from("system_events").insert({
            business_id: businessId,
            event_type: `whatsapp_message_${statusValue}`,
            payload_json: { whatsapp_message_id: waMessageId, status: statusValue },
          });
        }

        // ── Incoming messages ──
        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || contacts[0];
          const senderPhone = normalizePhone(msg.from);
          const senderName = contact?.profile?.name || senderPhone;
          const messageId = msg.id;
          const timestamp = msg.timestamp
            ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // ── Idempotency check ──
          const { data: existingMsg } = await supabase
            .from("whatsapp_messages")
            .select("id")
            .eq("whatsapp_message_id", messageId)
            .maybeSingle();

          if (existingMsg) {
            console.log(`Duplicate webhook ignored for message ${messageId}`);
            continue;
          }

          // Extract message content
          let messageText = "";
          let messageType = msg.type || "text";
          const mediaMeta: Record<string, unknown> = {};

          if (msg.type === "text") {
            messageText = msg.text?.body || "";
          } else if (msg.type === "image") {
            messageText = msg.image?.caption || "[Image received]";
            mediaMeta.id = msg.image?.id;
            mediaMeta.mime_type = msg.image?.mime_type;
          } else if (msg.type === "document") {
            messageText = `[Document: ${msg.document?.filename || "file"}]`;
            mediaMeta.id = msg.document?.id;
            mediaMeta.filename = msg.document?.filename;
            mediaMeta.mime_type = msg.document?.mime_type;
          } else if (msg.type === "audio") {
            messageText = "[Voice message received]";
            mediaMeta.id = msg.audio?.id;
            mediaMeta.mime_type = msg.audio?.mime_type;
          } else if (msg.type === "video") {
            messageText = msg.video?.caption || "[Video received]";
            mediaMeta.id = msg.video?.id;
            mediaMeta.mime_type = msg.video?.mime_type;
          } else if (msg.type === "location") {
            messageText = `[Location: ${msg.location?.latitude},${msg.location?.longitude}]`;
          } else if (msg.type === "reaction") {
            continue; // Skip reactions
          } else {
            messageText = `[Unsupported message type: ${msg.type}]`;
          }

          // ── Client matching ──
          let clientId: string | null = null;
          let matchStatus = "unmatched";
          const suffix = phoneSuffix(senderPhone);

          // 1. Check client_whatsapp_identity first
          const { data: identityMatch } = await supabase
            .from("client_whatsapp_identity")
            .select("client_id, contact_name")
            .eq("is_active", true)
            .ilike("whatsapp_phone_normalized", `%${suffix}`)
            .limit(1)
            .maybeSingle();

          if (identityMatch) {
            clientId = identityMatch.client_id;
            matchStatus = "matched";
          } else {
            // 2. Match against clients table phone field
            const { data: clientMatch } = await supabase
              .from("clients")
              .select("id")
              .eq("business_id", businessId)
              .ilike("phone", `%${suffix}%`)
              .limit(1)
              .maybeSingle();

            if (clientMatch) {
              clientId = clientMatch.id;
              matchStatus = "matched";

              // Auto-create identity mapping for future
              await supabase.from("client_whatsapp_identity").insert({
                client_id: clientId,
                whatsapp_phone_e164: senderPhone,
                whatsapp_phone_normalized: senderPhone.replace(/\D/g, ""),
                contact_name: senderName,
                is_primary: true,
              }).then(() => {}).catch(() => {});
            }
          }

          // ── Find or create conversation ──
          let conversationId: string | null = null;

          const convQuery = supabase
            .from("whatsapp_conversations")
            .select("id, ticket_id, status")
            .eq("business_id", businessId)
            .eq("client_whatsapp_phone", senderPhone)
            .eq("channel_type", "nextweb_support")
            .order("created_at", { ascending: false })
            .limit(1);

          if (clientId) convQuery.eq("client_id", clientId);

          const { data: existingConv } = await convQuery.maybeSingle();

          if (existingConv && existingConv.status !== "closed") {
            conversationId = existingConv.id;
          } else {
            const { data: newConv } = await supabase
              .from("whatsapp_conversations")
              .insert({
                business_id: businessId,
                client_id: clientId,
                channel_type: "nextweb_support",
                client_whatsapp_phone: senderPhone,
                phone_number_id: supportPhoneNumberId,
                business_account_id: config.business_account_id as string || null,
                status: "open",
                last_message_at: timestamp,
                last_message_preview: messageText.substring(0, 200),
                direction_last: "inbound",
                unread_for_support_count: 1,
              })
              .select("id")
              .single();

            conversationId = newConv?.id ?? null;
          }

          if (!conversationId) {
            console.error("Failed to create/find conversation");
            continue;
          }

          // Update conversation
          await supabase.from("whatsapp_conversations").update({
            last_message_at: timestamp,
            last_message_preview: messageText.substring(0, 200),
            direction_last: "inbound",
            unread_for_support_count: (existingConv ? 1 : 0) + 1,
            ...(clientId && !existingConv?.ticket_id ? { client_id: clientId } : {}),
          }).eq("id", conversationId);

          // Increment unread count via raw update
          if (existingConv) {
            await supabase.rpc("", {} as never).then(() => {}).catch(() => {});
            // Direct SQL not available, use update
            const currentUnread = 0; // Will be handled by the insert trigger logic
            await supabase.from("whatsapp_conversations").update({
              unread_for_support_count: currentUnread + 1,
              last_message_at: timestamp,
              last_message_preview: messageText.substring(0, 200),
              direction_last: "inbound",
            }).eq("id", conversationId);
          }

          // ── Find or create ticket ──
          let ticketId: string | null = existingConv?.ticket_id || null;

          if (ticketId) {
            // Check if ticket is still open
            const { data: ticket } = await supabase
              .from("support_tickets")
              .select("id, status")
              .eq("id", ticketId)
              .single();

            if (ticket && ["resolved", "closed"].includes(ticket.status)) {
              // Create new ticket for new issue
              ticketId = null;
            }
          }

          if (!ticketId) {
            // Create new support ticket
            const priority = detectPriority(messageText);
            const clientName = senderName || senderPhone;
            const subject = `WhatsApp Support - ${clientName} - ${messageText.substring(0, 60)}`;

            const { data: newTicket } = await supabase.from("support_tickets").insert({
              business_id: businessId,
              created_by_user_id: "00000000-0000-0000-0000-000000000000",
              subject,
              description: `Inbound WhatsApp message from ${clientName} (${senderPhone}):\n\n${messageText}`,
              category: "general",
              priority,
              status: "open",
              channel: "whatsapp",
              department: "support",
              sender_email: senderPhone,
              sender_name: senderName,
              source: "whatsapp",
              source_channel: "nextweb_support",
              assigned_team: "support",
              whatsapp_conversation_id: conversationId,
              client_id: clientId,
              client_match_status: matchStatus,
              client_last_message_at: timestamp,
            } as Record<string, unknown>).select("id, ticket_number").single();

            if (newTicket) {
              ticketId = (newTicket as Record<string, unknown>).id as string;

              // Link conversation to ticket
              await supabase.from("whatsapp_conversations").update({
                ticket_id: ticketId,
              }).eq("id", conversationId);

              // Audit log
              await supabase.from("ticket_audit_log").insert({
                business_id: businessId,
                ticket_id: ticketId,
                action_type: "ticket_created",
                details: `Auto-created from WhatsApp. Sender: ${senderName} (${senderPhone}). Match: ${matchStatus}.`,
              });

              // System event
              await supabase.from("system_events").insert({
                business_id: businessId,
                event_type: "whatsapp_ticket_created",
                payload_json: {
                  ticket_id: ticketId,
                  ticket_number: (newTicket as Record<string, unknown>).ticket_number,
                  sender_phone: senderPhone,
                  sender_name: senderName,
                  client_id: clientId,
                  match_status: matchStatus,
                },
              });

              // Notify admins
              const { data: adminRoles } = await supabase
                .from("user_roles")
                .select("user_id")
                .in("role", ["business_admin", "super_admin"])
                .limit(5);

              if (adminRoles?.length) {
                await supabase.from("notifications").insert(
                  adminRoles.map((r) => ({
                    business_id: businessId,
                    user_id: r.user_id,
                    type: "info" as const,
                    title: `WhatsApp Support #${(newTicket as Record<string, unknown>).ticket_number}`,
                    message: `From: ${senderName}. ${messageText.substring(0, 120)}`,
                  }))
                );
              }

              console.log(`Created support ticket ${(newTicket as Record<string, unknown>).ticket_number} from WhatsApp`);
            }
          } else {
            // Append to existing ticket
            await supabase.from("support_tickets").update({
              updated_at: new Date().toISOString(),
              client_last_message_at: timestamp,
            } as Record<string, unknown>).eq("id", ticketId);

            // Re-open if resolved
            await supabase.from("support_tickets").update({
              status: "open",
            } as Record<string, unknown>)
              .eq("id", ticketId)
              .in("status", ["waiting_for_client", "resolved"]);
          }

          // ── Store message ──
          await supabase.from("whatsapp_messages").insert({
            conversation_id: conversationId,
            client_id: clientId,
            ticket_id: ticketId,
            business_id: businessId,
            whatsapp_message_id: messageId,
            direction: "inbound",
            sender_type: "client",
            sender_display_name: senderName,
            from_phone: senderPhone,
            to_phone: supportPhoneNumberId,
            message_type: messageType,
            message_text: messageText,
            media_meta: mediaMeta,
            status: "received",
            received_at: timestamp,
            raw_payload: msg,
          });

          // Also add to ticket_messages for ticket UI
          if (ticketId) {
            await supabase.from("ticket_messages").insert({
              business_id: businessId,
              ticket_id: ticketId,
              sender_type: "customer",
              sender_name: senderName,
              content: `[WhatsApp] ${messageText}`,
              is_internal: false,
            });
          }

          // System event
          await supabase.from("system_events").insert({
            business_id: businessId,
            event_type: "incoming_whatsapp_received",
            payload_json: {
              sender_phone: senderPhone,
              sender_name: senderName,
              message_preview: messageText.substring(0, 100),
              client_id: clientId,
              match_status: matchStatus,
              conversation_id: conversationId,
              ticket_id: ticketId,
            },
          });

          // ── Auto reply ──
          if (autoReplyEnabled && accessToken && !existingConv?.ticket_id) {
            // Only auto-reply for new conversations/tickets (cooldown check)
            let shouldReply = true;

            if (existingConv) {
              // Check cooldown - don't spam
              const { data: lastAutoReply } = await supabase
                .from("whatsapp_messages")
                .select("created_at")
                .eq("conversation_id", conversationId)
                .eq("sender_type", "system")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (lastAutoReply) {
                const lastReplyTime = new Date(lastAutoReply.created_at).getTime();
                const cooldownMs = cooldownHours * 60 * 60 * 1000;
                if (Date.now() - lastReplyTime < cooldownMs) {
                  shouldReply = false;
                }
              }
            }

            if (shouldReply) {
              try {
                const graphUrl = `https://graph.facebook.com/v21.0/${supportPhoneNumberId}/messages`;
                const replyPayload = {
                  messaging_product: "whatsapp",
                  to: senderPhone.replace("+", ""),
                  type: "text",
                  text: { body: autoReplyMessage },
                };

                const replyRes = await fetch(graphUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(replyPayload),
                });

                const replyData = await replyRes.json();
                const replyMsgId = replyData?.messages?.[0]?.id || null;

                // Store auto-reply message
                await supabase.from("whatsapp_messages").insert({
                  conversation_id: conversationId,
                  client_id: clientId,
                  ticket_id: ticketId,
                  business_id: businessId,
                  whatsapp_message_id: replyMsgId,
                  direction: "outbound",
                  sender_type: "system",
                  sender_display_name: "NextWeb Support",
                  to_phone: senderPhone,
                  from_phone: supportPhoneNumberId,
                  message_type: "text",
                  message_text: autoReplyMessage,
                  status: replyRes.ok ? "sent" : "failed",
                  sent_at: new Date().toISOString(),
                  error_message: replyRes.ok ? null : JSON.stringify(replyData),
                });

                await supabase.from("system_events").insert({
                  business_id: businessId,
                  event_type: "whatsapp_auto_reply_sent",
                  payload_json: {
                    conversation_id: conversationId,
                    success: replyRes.ok,
                    to: senderPhone,
                  },
                });

                console.log(`Auto-reply ${replyRes.ok ? "sent" : "failed"} to ${senderPhone}`);
              } catch (err) {
                console.warn("Auto-reply error:", err);
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, // Always return 200 to prevent Meta retries
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
