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
    // Expected: /webhook-router/:endpoint_id
    const endpointId = pathParts[pathParts.length - 1] || url.searchParams.get("endpoint_id");

    if (!endpointId) {
      return new Response(JSON.stringify({ error: "Missing endpoint_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate endpoint
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
      // Create inquiry + lead
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
        // Create conversation thread
        await supabase.from("conversation_threads").insert({
          business_id: endpoint.business_id,
          thread_type: "LEAD",
          subject: `New Lead: ${body.name || "Unknown"}`,
          status: "OPEN",
        });

        // Log inbound message
        await supabase.from("conversation_messages").insert({
          business_id: endpoint.business_id,
          thread_id: inquiry.id, // Will be linked properly
          direction: "INBOUND",
          channel: "WEBCHAT",
          body_text: body.message || `Form submission from ${body.name}`,
          status: "DELIVERED",
          from_address: body.email || body.phone || "unknown",
          received_at: new Date().toISOString(),
        });

        processed = true;
      }
    }

    // Update event status
    await supabase.from("webhook_events").update({
      status: processed ? "PROCESSED" : "RECEIVED",
      processed_at: processed ? new Date().toISOString() : null,
    }).eq("id", event.id);

    return new Response(JSON.stringify({
      status: "ok",
      event_id: event.id,
      processed,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook router error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
