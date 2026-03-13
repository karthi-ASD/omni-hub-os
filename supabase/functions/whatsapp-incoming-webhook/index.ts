import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Spam patterns to filter out
const SPAM_PATTERNS = [
  /\b(win|won|winner|lottery|prize|congratulations!)\b/i,
  /\b(click here|act now|limited time|exclusive offer)\b/i,
  /\b(free money|earn \$|make \$|easy cash)\b/i,
  /\b(unsubscribe|opt.?out|bulk\s?message)\b/i,
];

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some(p => p.test(text));
}

function detectDepartment(text: string): string {
  const lower = text.toLowerCase();
  if (/(seo|keyword|ranking|backlink|google search|organic|search engine)/i.test(lower)) return "seo";
  if (/(invoice|payment|bill|account|renewal|subscription)/i.test(lower)) return "accounts";
  if (/(website|bug|error|code|develop|feature|api|hosting|ssl|domain|not loading|broken)/i.test(lower)) return "development";
  if (/(hiring|recruitment|leave|salary|payroll|employee|job|vacancy)/i.test(lower)) return "hr";
  if (/(quote|proposal|pricing|lead|prospect|demo|new project|interested)/i.test(lower)) return "sales";
  return "support";
}

function detectPriority(text: string): string {
  const lower = text.toLowerCase();
  if (/(urgent|asap|critical|down|emergency|not working|blocked)/i.test(lower)) return "critical";
  if (/(high priority|important|broken|stopped)/i.test(lower)) return "high";
  if (/(low priority|no rush|when you can)/i.test(lower)) return "low";
  return "medium";
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
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "whatsapp_webhook_token_123";
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const entries = payload?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        // ── Status updates ──
        const statuses = value?.statuses || [];
        for (const status of statuses) {
          if (status.id) {
            await supabase
              .from("conversation_messages")
              .update({ status: status.status })
              .eq("provider_message_id", status.id);
          }
        }

        // ── Incoming messages ──
        const messages = value?.messages || [];
        const metadata = value?.metadata || {};
        const phoneNumberId = metadata?.phone_number_id;
        const contacts = value?.contacts || [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || contacts[0];
          const senderPhone = msg.from;
          const senderName = contact?.profile?.name || senderPhone;
          const messageId = msg.id;
          const timestamp = msg.timestamp
            ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // Extract message text
          let messageText = "";
          let hasAttachment = false;
          let attachmentType = "";
          if (msg.type === "text") {
            messageText = msg.text?.body || "";
          } else if (msg.type === "image") {
            messageText = `[Image] ${msg.image?.caption || ""}`.trim();
            hasAttachment = true;
            attachmentType = "image";
          } else if (msg.type === "document") {
            messageText = `[Document] ${msg.document?.filename || ""}`.trim();
            hasAttachment = true;
            attachmentType = "document";
          } else if (msg.type === "audio") {
            messageText = "[Voice message]";
            hasAttachment = true;
            attachmentType = "audio";
          } else if (msg.type === "video") {
            messageText = `[Video] ${msg.video?.caption || ""}`.trim();
            hasAttachment = true;
            attachmentType = "video";
          } else if (msg.type === "location") {
            messageText = `[Location] ${msg.location?.latitude},${msg.location?.longitude}`;
          } else if (msg.type === "reaction") {
            // Reactions don't create tickets
            continue;
          } else {
            messageText = `[${msg.type}]`;
          }

          // ── Spam filter ──
          if (isSpam(messageText)) {
            console.log(`Spam filtered from ${senderPhone}: ${messageText.substring(0, 50)}`);
            continue;
          }

          // ── Find business by phone_number_id ──
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
                  ? JSON.parse(p.credentials_json) : p.credentials_json;
                if (creds?.phone_number_id === phoneNumberId) {
                  businessId = p.business_id;
                  break;
                }
              } catch { /* skip */ }
            }
          }

          if (!businessId) {
            const { data: biz } = await supabase
              .from("businesses").select("id").eq("status", "active").limit(1).single();
            businessId = biz?.id || null;
          }

          if (!businessId) {
            console.error("No business found for WhatsApp phone_number_id:", phoneNumberId);
            continue;
          }

          // ── Client matching by phone ──
          let leadId: string | null = null;
          let clientId: string | null = null;
          let clientMatchStatus = "unmatched";
          const normalizedPhone = senderPhone.replace(/\D/g, "");
          const phoneSuffix = normalizedPhone.slice(-9);

          // Check clients first (higher priority than leads)
          const { data: clientMatch } = await supabase
            .from("clients")
            .select("id, contact_name")
            .eq("business_id", businessId)
            .ilike("phone", `%${phoneSuffix}%`)
            .limit(1)
            .single();

          if (clientMatch) {
            clientId = clientMatch.id;
            clientMatchStatus = "matched";
          } else {
            // Check alternate contact numbers
            const { data: altPhoneMatch } = await supabase
              .from("client_alternate_emails")
              .select("client_id")
              .eq("business_id", businessId)
              .ilike("email", `%${phoneSuffix}%`)
              .limit(1)
              .maybeSingle();
            if (altPhoneMatch) {
              clientId = altPhoneMatch.client_id;
              clientMatchStatus = "matched";
            }
          }

          // Check leads
          if (!clientId) {
            const { data: leadMatch } = await supabase
              .from("leads")
              .select("id")
              .eq("business_id", businessId)
              .ilike("phone", `%${phoneSuffix}%`)
              .limit(1)
              .single();
            if (leadMatch) leadId = leadMatch.id;
          }

          // ── Check for existing open ticket to append to ──
          let existingTicketId: string | null = null;
          if (clientId || leadId) {
            const ticketQuery = supabase
              .from("support_tickets")
              .select("id")
              .eq("business_id", businessId)
              .in("status", ["open", "assigned", "in_progress", "waiting_for_client"])
              .order("created_at", { ascending: false })
              .limit(1);

            if (clientId) ticketQuery.eq("client_id", clientId);
            const { data: ticketMatch } = await ticketQuery.maybeSingle();
            if (ticketMatch) existingTicketId = ticketMatch.id;
          }

          // Also check by channel + phone for cross-channel merge
          if (!existingTicketId) {
            const { data: phoneTicket } = await supabase
              .from("support_tickets")
              .select("id")
              .eq("business_id", businessId)
              .in("status", ["open", "assigned", "in_progress"])
              .or(`sender_email.ilike.%${phoneSuffix}%,sender_name.ilike.%${senderName}%`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (phoneTicket) existingTicketId = phoneTicket.id;
          }

          // ── Find or create conversation thread ──
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
                ticket_id: existingTicketId,
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

          // ── Store message in conversation ──
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

          await supabase.from("conversation_threads")
            .update({ last_message_at: timestamp })
            .eq("id", threadId);

          // ── If existing ticket, add message and continue ──
          if (existingTicketId) {
            await supabase.from("ticket_messages").insert({
              business_id: businessId,
              ticket_id: existingTicketId,
              sender_type: "customer",
              sender_name: senderName,
              content: `[WhatsApp] ${messageText}`,
              is_internal: false,
            });

            // Update ticket activity
            await supabase.from("support_tickets").update({
              updated_at: new Date().toISOString(),
              status: "open", // Re-open if waiting
            } as any).eq("id", existingTicketId).in("status", ["waiting_for_client", "resolved"]);

            await supabase.from("ticket_audit_log").insert({
              business_id: businessId,
              ticket_id: existingTicketId,
              action_type: "whatsapp_message_added",
              details: `WhatsApp message from ${senderName}: ${messageText.substring(0, 100)}`,
            });

            console.log(`WhatsApp message appended to existing ticket ${existingTicketId}`);
            continue;
          }

          // ── CREATE NEW TICKET FROM WHATSAPP ──
          const department = detectDepartment(messageText);
          const priority = detectPriority(messageText);

          const { data: newTicket } = await supabase.from("support_tickets").insert({
            business_id: businessId,
            created_by_user_id: "00000000-0000-0000-0000-000000000000",
            subject: messageText.length > 80
              ? `WhatsApp: ${messageText.substring(0, 77)}...`
              : `WhatsApp: ${messageText}`,
            description: messageText,
            category: "general",
            priority,
            status: "open",
            channel: "whatsapp",
            department,
            sender_email: senderPhone, // Store phone in sender_email for reference
            sender_name: senderName,
            source_type: "whatsapp",
            client_match_status: clientMatchStatus,
            client_id: clientId,
          } as any).select().single();

          if (!newTicket) {
            console.error("Failed to create ticket from WhatsApp");
            continue;
          }

          const ticket = newTicket as any;

          // Link thread to ticket
          await supabase.from("conversation_threads")
            .update({ ticket_id: ticket.id })
            .eq("id", threadId);

          // Add initial message to ticket thread
          await supabase.from("ticket_messages").insert({
            business_id: businessId,
            ticket_id: ticket.id,
            sender_type: "customer",
            sender_name: senderName,
            content: `[WhatsApp] ${messageText}`,
            is_internal: false,
          });

          // Audit log
          await supabase.from("ticket_audit_log").insert({
            business_id: businessId,
            ticket_id: ticket.id,
            action_type: "ticket_created",
            details: `Ticket created from WhatsApp. Sender: ${senderName} (${senderPhone}). Client match: ${clientMatchStatus}. Department: ${department}.`,
          });

          // ── Trigger auto-reply (confirmation to client) ──
          try {
            const autoReplyUrl = `${supabaseUrl}/functions/v1/ticket-auto-reply`;
            await fetch(autoReplyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                ticket_id: ticket.id,
                ticket_number: ticket.ticket_number,
                recipient_phone: senderPhone,
                recipient_name: senderName,
                channel: "whatsapp",
                business_id: businessId,
                client_id: clientId,
              }),
            });
            console.log(`WhatsApp ticket confirmation triggered for ${ticket.ticket_number}`);
          } catch (replyErr) {
            console.warn("Auto-reply trigger failed:", replyErr);
          }

          // ── AI Classification (async, non-blocking) ──
          try {
            const classifyUrl = `${supabaseUrl}/functions/v1/ticket-ai-classify`;
            fetch(classifyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({ ticket_id: ticket.id }),
            }).catch((e) => console.warn("AI classify trigger:", e));
          } catch { /* non-critical */ }

          // Admin notifications
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("business_id", businessId)
            .in("role", ["business_admin", "super_admin"])
            .limit(3);

          if (adminRoles?.length) {
            await supabase.from("notifications").insert(
              adminRoles.map((r) => ({
                business_id: businessId,
                user_id: r.user_id,
                type: "info" as const,
                title: `WhatsApp Ticket #${ticket.ticket_number}`,
                message: `From: ${senderName}. ${messageText.substring(0, 150)}`,
              }))
            );
          }

          console.log(`Created ticket ${ticket.ticket_number} from WhatsApp message by ${senderName}`);
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
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
