import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * WhatsApp Send Message Edge Function
 *
 * Uses Meta WhatsApp Business API via Cloud API.
 * Credentials stored in communications_providers table (channel = 'whatsapp').
 *
 * POST body:
 * {
 *   to: "+61400000000",         // recipient phone (E.164)
 *   message: "Hello!",          // text message
 *   template_name?: "...",      // optional: use a pre-approved template
 *   template_language?: "en",
 *   template_params?: ["..."],  // template variable values
 *   // Linking context (optional)
 *   lead_id?: "uuid",
 *   client_id?: "uuid",
 *   ticket_id?: "uuid",
 *   job_id?: "uuid",
 *   // Automation trigger (optional)
 *   automation_type?: "lead_followup" | "demo_reminder" | "ticket_update" | "job_confirmation"
 * }
 */

interface SendRequest {
  to: string;
  message?: string;
  template_name?: string;
  template_language?: string;
  template_params?: string[];
  lead_id?: string;
  client_id?: string;
  ticket_id?: string;
  job_id?: string;
  automation_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body: SendRequest = await req.json();
    if (!body.to) {
      return new Response(JSON.stringify({ error: "Missing 'to' phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.message && !body.template_name) {
      return new Response(JSON.stringify({ error: "Provide 'message' or 'template_name'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve business_id from auth token
    let businessId: string | null = null;
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("user_id", data.user.id)
          .single();
        businessId = profile?.business_id ?? null;
      }
    }

    // For automated sends without auth, resolve business from linked entity
    if (!businessId && body.lead_id) {
      const { data: lead } = await supabase
        .from("leads").select("business_id").eq("id", body.lead_id).single();
      businessId = lead?.business_id ?? null;
    }
    if (!businessId && body.client_id) {
      const { data: client } = await supabase
        .from("clients").select("business_id").eq("id", body.client_id).single();
      businessId = client?.business_id ?? null;
    }
    if (!businessId && body.ticket_id) {
      const { data: ticket } = await supabase
        .from("support_tickets").select("business_id").eq("id", body.ticket_id).single();
      businessId = ticket?.business_id ?? null;
    }

    if (!businessId) {
      return new Response(JSON.stringify({ error: "Cannot determine business context" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get WhatsApp provider credentials from communications_providers
    const { data: provider } = await supabase
      .from("communications_providers")
      .select("credentials_json")
      .eq("business_id", businessId)
      .eq("channel", "whatsapp")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!provider?.credentials_json) {
      return new Response(JSON.stringify({ error: "WhatsApp provider not configured for this business" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let creds: { access_token: string; phone_number_id: string; waba_id?: string };
    try {
      creds = typeof provider.credentials_json === "string"
        ? JSON.parse(provider.credentials_json)
        : provider.credentials_json;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid WhatsApp credentials format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!creds.access_token || !creds.phone_number_id) {
      return new Response(JSON.stringify({ error: "Missing access_token or phone_number_id in credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Meta WhatsApp Cloud API payload
    const recipientPhone = body.to.replace(/[\s\-()]/g, "");
    let waPayload: Record<string, unknown>;

    if (body.template_name) {
      // Template message
      const components: Record<string, unknown>[] = [];
      if (body.template_params?.length) {
        components.push({
          type: "body",
          parameters: body.template_params.map((p) => ({ type: "text", text: p })),
        });
      }
      waPayload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: body.template_name,
          language: { code: body.template_language || "en" },
          ...(components.length > 0 ? { components } : {}),
        },
      };
    } else {
      // Free-form text message
      waPayload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "text",
        text: { body: body.message },
      };
    }

    // Send via Meta Graph API
    const graphUrl = `https://graph.facebook.com/v21.0/${creds.phone_number_id}/messages`;
    const waRes = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(waPayload),
    });

    const waData = await waRes.json();
    const waMessageId = waData?.messages?.[0]?.id || null;
    const success = waRes.ok && waMessageId;

    console.log("WhatsApp API response:", JSON.stringify(waData));

    // Find or create a conversation thread
    let threadId: string | null = null;
    const threadFilter: Record<string, unknown> = { business_id: businessId };
    if (body.lead_id) threadFilter.lead_id = body.lead_id;
    else if (body.client_id) threadFilter.client_id = body.client_id;
    else if (body.ticket_id) threadFilter.ticket_id = body.ticket_id;

    const { data: existingThread } = await supabase
      .from("conversation_threads")
      .select("id")
      .match(threadFilter)
      .eq("thread_type", "whatsapp")
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
          lead_id: body.lead_id || null,
          client_id: body.client_id || null,
          ticket_id: body.ticket_id || null,
          job_id: body.job_id || null,
          subject: body.automation_type
            ? `WhatsApp – ${body.automation_type.replace(/_/g, " ")}`
            : "WhatsApp Conversation",
          status: "active",
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      threadId = newThread?.id ?? null;
    }

    // Store message in conversation_messages
    if (threadId) {
      await supabase.from("conversation_messages").insert({
        business_id: businessId,
        thread_id: threadId,
        direction: "outbound",
        channel: "whatsapp",
        provider_message_id: waMessageId,
        to_address: recipientPhone,
        body_text: body.message || `[Template: ${body.template_name}]`,
        status: success ? "sent" : "failed",
        error_message: success ? null : JSON.stringify(waData?.error || waData),
        sent_at: new Date().toISOString(),
        created_by: userId,
      });

      // Update thread last_message_at
      await supabase
        .from("conversation_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    }

    // Log in communications_sends
    await supabase.from("communications_sends").insert({
      business_id: businessId,
      channel: "WhatsApp",
      provider_type: "Meta Cloud API",
      to_address: recipientPhone,
      status: success ? "sent" : "failed",
      related_entity_type: body.lead_id ? "lead" : body.client_id ? "client" : body.ticket_id ? "ticket" : body.job_id ? "job" : null,
      related_entity_id: body.lead_id || body.client_id || body.ticket_id || body.job_id || null,
    });

    return new Response(
      JSON.stringify({
        success,
        message_id: waMessageId,
        thread_id: threadId,
        automation_type: body.automation_type || null,
      }),
      { status: success ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
