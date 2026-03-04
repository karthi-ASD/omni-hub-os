import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const endpointId = pathParts[pathParts.length - 1] || url.searchParams.get("endpoint_id");

    // --- Plivo SMS Webhook ---
    if (endpointId === "plivo-sms") {
      const body = await req.json();
      return await handlePlivoSms(supabase, body);
    }

    // --- Plivo Call Status Webhook ---
    if (endpointId === "plivo-call") {
      const body = await req.json();
      return await handlePlivoCall(supabase, body);
    }

    // --- WhatsApp Meta Webhook ---
    if (endpointId === "whatsapp-meta") {
      // GET = verification challenge
      if (req.method === "GET") {
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        // For now accept any token; in production compare against stored verify_token
        if (mode === "subscribe" && challenge) {
          return new Response(challenge, { status: 200, headers: corsHeaders });
        }
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
      const body = await req.json();
      return await handleWhatsAppMeta(supabase, body);
    }

    // --- Standard webhook endpoint routing ---
    if (!endpointId) {
      return new Response(JSON.stringify({ error: "Missing endpoint_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: endpoint, error: epErr } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("id", endpointId)
      .eq("is_active", true)
      .single();

    if (epErr || !endpoint) {
      return new Response(JSON.stringify({ error: "Endpoint not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const externalEventId = body.external_event_id || body.id || null;

    // Idempotency check
    if (externalEventId) {
      const { data: existing } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("external_event_id", externalEventId)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ status: "duplicate", event_id: existing.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Store event
    const { data: event, error: evErr } = await supabase
      .from("webhook_events")
      .insert({
        business_id: endpoint.business_id,
        endpoint_id: endpoint.id,
        external_event_id: externalEventId,
        event_type: endpoint.endpoint_type,
        payload_json: body,
        status: "RECEIVED",
      })
      .select()
      .single();

    if (evErr) {
      console.error("Failed to store webhook event:", evErr);
      return new Response(JSON.stringify({ error: "Failed to store event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Emit system_event
    await supabase.from("system_events").insert({
      business_id: endpoint.business_id,
      event_type: "WEBHOOK_RECEIVED",
      payload_json: {
        endpoint_id: endpoint.id,
        endpoint_type: endpoint.endpoint_type,
        event_id: event.id,
      },
    });

    // Route by type
    let processed = false;
    if (endpoint.endpoint_type === "FORM_LEAD") {
      const leadData = {
        business_id: endpoint.business_id,
        name: body.name || "Unknown",
        email: body.email || null,
        phone: body.phone || null,
        source: body.website_url || "webhook",
        message: body.message || "",
        status: "new",
      };

      const { data: inquiry } = await supabase
        .from("inquiries")
        .insert(leadData)
        .select()
        .single();

      if (inquiry) {
        await supabase.from("conversation_threads").insert({
          business_id: endpoint.business_id,
          thread_type: "LEAD",
          subject: `New Lead: ${body.name || "Unknown"}`,
          status: "OPEN",
        });

        await supabase.from("conversation_messages").insert({
          business_id: endpoint.business_id,
          thread_id: inquiry.id,
          direction: "INBOUND",
          channel: "WEBCHAT",
          body_text: body.message || `Form submission from ${body.name}`,
          status: "DELIVERED",
          from_address: body.email || body.phone || "unknown",
          received_at: new Date().toISOString(),
        });

        // Also create lead_conversation for autopilot
        await supabase.from("lead_conversations").insert({
          business_id: endpoint.business_id,
          lead_id: inquiry.id,
          inquiry_id: inquiry.id,
          status: "OPEN",
          mode: "AUTOPILOT",
          last_message_at: new Date().toISOString(),
        });

        processed = true;
      }
    }

    await supabase.from("webhook_events").update({
      status: processed ? "PROCESSED" : "RECEIVED",
      processed_at: processed ? new Date().toISOString() : null,
    }).eq("id", event.id);

    return jsonResponse({ status: "ok", event_id: event.id, processed });
  } catch (err) {
    console.error("Webhook router error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---- Plivo SMS Handler ----
async function handlePlivoSms(supabase: any, body: any) {
  const from = body.From;
  const to = body.To;
  const text = body.Text;
  const messageUuid = body.MessageUUID;

  // Find tenant by Plivo number (To number)
  const { data: conn } = await supabase
    .from("provider_connections")
    .select("business_id")
    .eq("provider_type", "SMS")
    .eq("provider_name", "Plivo")
    .eq("status", "CONNECTED")
    .limit(10);

  const businessId = conn?.[0]?.business_id;

  if (!businessId) {
    console.warn("No tenant found for Plivo number:", to);
    return jsonResponse({ status: "no_tenant", from, to });
  }

  // Check opt-out
  const { data: optOut } = await supabase
    .from("opt_out_registry")
    .select("id")
    .eq("business_id", businessId)
    .eq("phone", from)
    .eq("channel", "SMS")
    .maybeSingle();

  // Handle STOP keyword
  if (text && ["STOP", "UNSUBSCRIBE", "DO NOT CALL"].includes(text.trim().toUpperCase())) {
    if (!optOut) {
      await supabase.from("opt_out_registry").insert({
        business_id: businessId,
        channel: "SMS",
        phone: from,
        reason: "STOP",
      });
    }
    await supabase.from("system_events").insert({
      business_id: businessId,
      event_type: "OPT_OUT_RECEIVED",
      payload_json: { phone: from, channel: "SMS", keyword: text.trim() },
    });
    return jsonResponse({ status: "opt_out_recorded" });
  }

  // Find or create lead conversation
  let { data: conv } = await supabase
    .from("lead_conversations")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "OPEN")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conv) {
    const { data: newConv } = await supabase
      .from("lead_conversations")
      .insert({
        business_id: businessId,
        status: "OPEN",
        mode: "AUTOPILOT",
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();
    conv = newConv;
  }

  // Store message
  await supabase.from("conversation_messages").insert({
    business_id: businessId,
    thread_id: conv?.id,
    direction: "INBOUND",
    channel: "SMS",
    body_text: text,
    provider_message_id: messageUuid,
    status: "DELIVERED",
    from_address: from,
    to_address: to,
    received_at: new Date().toISOString(),
  });

  // Update conversation
  if (conv) {
    await supabase.from("lead_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);
  }

  await supabase.from("system_events").insert({
    business_id: businessId,
    event_type: "MESSAGE_RECEIVED",
    payload_json: { channel: "SMS", from, provider: "Plivo", message_uuid: messageUuid },
  });

  return jsonResponse({ status: "ok", channel: "sms" });
}

// ---- Plivo Call Status Handler ----
async function handlePlivoCall(supabase: any, body: any) {
  const callUuid = body.CallUUID;
  const callStatus = body.CallStatus;
  const recordingUrl = body.RecordingURL || null;
  const billDuration = body.BillDuration ? parseInt(body.BillDuration) : null;

  // Update voice_agent_session if exists
  if (callUuid) {
    const statusMap: Record<string, string> = {
      ringing: "CALLING",
      "in-progress": "IN_PROGRESS",
      completed: "COMPLETED",
      busy: "NO_ANSWER",
      "no-answer": "NO_ANSWER",
      failed: "FAILED",
      cancel: "FAILED",
    };

    const newStatus = statusMap[callStatus] || "FAILED";
    const updateData: any = { status: newStatus };
    if (newStatus === "COMPLETED") updateData.ended_at = new Date().toISOString();
    if (recordingUrl) updateData.recording_url = recordingUrl;

    await supabase
      .from("voice_agent_sessions")
      .update(updateData)
      .eq("plivo_call_uuid", callUuid);

    // Get session for business_id
    const { data: session } = await supabase
      .from("voice_agent_sessions")
      .select("business_id, id")
      .eq("plivo_call_uuid", callUuid)
      .maybeSingle();

    if (session) {
      // Store voice agent event
      await supabase.from("voice_agent_events").insert({
        business_id: session.business_id,
        session_id: session.id,
        event_source: "PLIVO",
        event_type: `CALL_${callStatus.toUpperCase().replace("-", "_")}`,
        payload_json: body,
      });

      await supabase.from("system_events").insert({
        business_id: session.business_id,
        event_type: newStatus === "COMPLETED" ? "VOICE_CALL_COMPLETED" : "VOICE_CALL_STATUS_CHANGE",
        payload_json: {
          call_uuid: callUuid,
          status: callStatus,
          duration: billDuration,
          recording_url: recordingUrl,
        },
      });
    }
  }

  return jsonResponse({ status: "ok", call_uuid: callUuid });
}

// ---- WhatsApp Meta Handler ----
async function handleWhatsAppMeta(supabase: any, body: any) {
  const entries = body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;
      const value = change.value || {};

      // Handle incoming messages
      const messages = value.messages || [];
      for (const msg of messages) {
        const from = msg.from;
        const messageId = msg.id;
        const timestamp = msg.timestamp;
        const textBody = msg.text?.body || msg.caption || "";

        // Find tenant by WhatsApp connection
        const { data: conn } = await supabase
          .from("provider_connections")
          .select("business_id")
          .eq("provider_type", "WHATSAPP")
          .eq("status", "CONNECTED")
          .limit(10);

        const businessId = conn?.[0]?.business_id;
        if (!businessId) {
          console.warn("No tenant for WhatsApp message from:", from);
          continue;
        }

        // Check opt-out keywords
        if (textBody && ["STOP", "UNSUBSCRIBE"].includes(textBody.trim().toUpperCase())) {
          await supabase.from("opt_out_registry").insert({
            business_id: businessId,
            channel: "WHATSAPP",
            phone: from,
            reason: "STOP",
          });
          await supabase.from("system_events").insert({
            business_id: businessId,
            event_type: "OPT_OUT_RECEIVED",
            payload_json: { phone: from, channel: "WHATSAPP" },
          });
          continue;
        }

        // Find/create conversation
        let { data: conv } = await supabase
          .from("lead_conversations")
          .select("*")
          .eq("business_id", businessId)
          .eq("status", "OPEN")
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conv) {
          const { data: newConv } = await supabase
            .from("lead_conversations")
            .insert({
              business_id: businessId,
              status: "OPEN",
              mode: "AUTOPILOT",
              last_message_at: new Date().toISOString(),
            })
            .select()
            .single();
          conv = newConv;
        }

        await supabase.from("conversation_messages").insert({
          business_id: businessId,
          thread_id: conv?.id,
          direction: "INBOUND",
          channel: "WHATSAPP",
          body_text: textBody,
          provider_message_id: messageId,
          status: "DELIVERED",
          from_address: from,
          received_at: timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString(),
        });

        if (conv) {
          await supabase.from("lead_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conv.id);
        }

        await supabase.from("system_events").insert({
          business_id: businessId,
          event_type: "MESSAGE_RECEIVED",
          payload_json: { channel: "WHATSAPP", from, message_id: messageId },
        });
      }

      // Handle status updates
      const statuses = value.statuses || [];
      for (const st of statuses) {
        await supabase
          .from("conversation_messages")
          .update({ status: st.status?.toUpperCase() || "DELIVERED" })
          .eq("provider_message_id", st.id);
      }
    }
  }

  return jsonResponse({ status: "ok" });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
