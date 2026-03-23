import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
}

function formatToE164(phone: string): string | null {
  let p = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") && p.length >= 8) return "+" + p;
  if (p.startsWith("0") && p.length === 10) return "+61" + p.slice(1);
  if (p.startsWith("61") && p.length >= 9 && p.length <= 11) return "+" + p;
  if (p.startsWith("91") && p.length >= 10 && p.length <= 12) return "+" + p;
  if (p.length === 10 && /^[6-9]/.test(p)) return "+91" + p;
  if (p.startsWith("1") && p.length === 11) return "+" + p;
  if (p.startsWith("44") && p.length >= 10 && p.length <= 12) return "+" + p;
  if (p.startsWith("64") && p.length >= 9 && p.length <= 11) return "+" + p;
  if (p.length >= 8) return "+" + p;
  return null;
}

// Region-aware caller ID selection (fallback only)
function getCallerIdForNumber(number: string): string {
  if (number.startsWith("+91")) {
    return Deno.env.get("PLIVO_CALLER_ID_IN") || Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  if (number.startsWith("+61")) {
    return Deno.env.get("PLIVO_CALLER_ID_AU") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  if (number.startsWith("+1")) {
    return Deno.env.get("PLIVO_CALLER_ID_US") || Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  return Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
}

// Fetch agent-specific caller ID from DB
async function getAgentCallerId(supabase: any, userId: string, businessId: string): Promise<string | null> {
  const { data } = await supabase
    .from("agent_caller_ids")
    .select("plivo_number, is_default")
    .eq("agent_user_id", userId)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .limit(1);
  
  if (data && data.length > 0) {
    return data[0].plivo_number;
  }
  return null;
}

async function createPlivoCall(params: {
  authId: string;
  authToken: string;
  payload: Record<string, unknown>;
}) {
  const resp = await fetch(
    `https://api.plivo.com/v1/Account/${params.authId}/Call/`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${params.authId}:${params.authToken}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.payload),
    }
  );
  const text = await resp.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: resp.ok, status: resp.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ status: "error", error: "Unauthorized" });
  }

  try {
    const body = await req.json();
    const { session_id, action, agent_phone, agentPhone, caller_id_override } = body;

    if (!session_id) {
      return jsonResponse({ status: "error", error: "Missing session_id" });
    }

    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return jsonResponse({ status: "error", error: "Session not found" });
    }

    // HANGUP action
    if (action === "hangup") {
      const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
      const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");

      if (PLIVO_AUTH_ID && PLIVO_AUTH_TOKEN) {
        // Hang up agent leg
        if (session.provider_call_id) {
          try {
            await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${session.provider_call_id}/`, {
              method: "DELETE",
              headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
            });
          } catch (e) { console.error("Plivo hangup agent error:", e); }
        }
        // Hang up customer leg
        if (session.customer_call_id) {
          try {
            await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${session.customer_call_id}/`, {
              method: "DELETE",
              headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
            });
          } catch (e) { console.error("Plivo hangup customer error:", e); }
        }
      }

      await supabase.from("dialer_sessions").update({ call_status: "ended", call_end_time: new Date().toISOString() }).eq("id", session_id);
      return jsonResponse({ status: "ok", action: "hangup_sent", session_id });
    }

    // --- RATE LIMITING (3 calls per user per 30s) ---
    const userId = session.user_id;
    const thirtySecsAgo = new Date(Date.now() - 30_000).toISOString();
    const { count: recentCount } = await supabase
      .from("dialer_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("provider_call_id", "is", null)
      .gt("created_at", thirtySecsAgo);

    if ((recentCount ?? 0) > 3) {
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "rate_limit_blocked",
        metadata: { user_id: userId, reason: "too_many_calls_30s" },
      }).catch(() => {});
      return jsonResponse({ status: "error", error: "Rate limit exceeded. Please wait before making another call." });
    }

    // INITIATE CONFERENCE CALL
    const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
    const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");
    const PLIVO_CALLER_ID = Deno.env.get("PLIVO_CALLER_ID");
    const PLIVO_WEBHOOK_SECRET = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN || !PLIVO_CALLER_ID) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Plivo credentials not configured. Please contact admin." });
    }

    const { data: agentProfile } = await supabase
      .from("hr_employees")
      .select("mobile_number, full_name, email")
      .eq("user_id", session.user_id)
      .eq("business_id", session.business_id)
      .maybeSingle();

    const agentPhoneRaw = agent_phone || agentPhone || agentProfile?.mobile_number || "";
    if (!agentPhoneRaw) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Agent phone number is missing. Please add a mobile number to the employee profile." });
    }

    const formattedCustomerPhone = formatToE164(session.phone_number);
    const formattedAgentPhone = formatToE164(agentPhoneRaw);

    if (!formattedCustomerPhone) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Invalid customer phone number format." });
    }

    if (!formattedAgentPhone) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Invalid agent phone number format." });
    }

    // Generate unique conference ID
    const conferenceId = `dialer-${session_id}`;

    // Region-aware caller IDs
    const agentCallerId = getCallerIdForNumber(formattedAgentPhone);
    const customerCallerId = getCallerIdForNumber(formattedCustomerPhone);

    console.log("[dialer-initiate] CONFERENCE FLOW", {
      session_id,
      conference_id: conferenceId,
      agent_phone: formattedAgentPhone,
      customer_phone: formattedCustomerPhone,
      agent_caller_id: agentCallerId,
      customer_caller_id: customerCallerId,
    });

    // Build answer URLs for both legs
    const agentAnswerParams = new URLSearchParams({
      session_id,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "agent",
      conference_id: conferenceId,
    });
    const customerAnswerParams = new URLSearchParams({
      session_id,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "customer",
      conference_id: conferenceId,
    });

    const agentAnswerUrl = `${supabaseUrl}/functions/v1/dialer-answer?${agentAnswerParams.toString()}`;
    const customerAnswerUrl = `${supabaseUrl}/functions/v1/dialer-answer?${customerAnswerParams.toString()}`;

    // Webhook URLs for hangup events
    const agentWebhookParams = new URLSearchParams({ session_id, token: PLIVO_WEBHOOK_SECRET, leg: "agent" });
    const customerWebhookParams = new URLSearchParams({ session_id, token: PLIVO_WEBHOOK_SECRET, leg: "customer" });

    const agentWebhookUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${agentWebhookParams.toString()}`;
    const customerWebhookUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${customerWebhookParams.toString()}`;

    // CALL 1: Agent
    const agentPayload = {
      from: agentCallerId || PLIVO_CALLER_ID,
      to: formattedAgentPhone,
      answer_url: agentAnswerUrl,
      answer_method: "POST",
      hangup_url: agentWebhookUrl,
      hangup_method: "POST",
      ring_timeout: 25,
    };

    // CALL 2: Customer
    const customerPayload = {
      from: customerCallerId || PLIVO_CALLER_ID,
      to: formattedCustomerPhone,
      answer_url: customerAnswerUrl,
      answer_method: "POST",
      hangup_url: customerWebhookUrl,
      hangup_method: "POST",
      ring_timeout: 25,
    };

    // Region caller ID warnings
    if (formattedCustomerPhone.startsWith("+91") && !Deno.env.get("PLIVO_CALLER_ID_IN")) {
      console.warn("[dialer-initiate] WARNING: Calling India (+91) but no PLIVO_CALLER_ID_IN configured. Using fallback — may cause slow connection or failure.");
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "region_caller_id_warning",
        metadata: { customer_number: formattedCustomerPhone, fallback_caller_id: customerCallerId },
      }).catch(() => {});
    }

    console.log("[dialer-initiate] Creating agent leg", agentPayload);

    // Create agent call first
    let agentResponse: { ok: boolean; status: number; data: any };
    try {
      agentResponse = await createPlivoCall({ authId: PLIVO_AUTH_ID, authToken: PLIVO_AUTH_TOKEN, payload: agentPayload });
      console.log("[PLIVO RESPONSE] Agent leg:", JSON.stringify(agentResponse.data));
    } catch (fetchErr) {
      console.error("[dialer-initiate] Agent call fetch error:", fetchErr);
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Failed to reach call provider for agent leg", session_id });
    }

    if (!agentResponse.ok) {
      console.error("[PLIVO RESPONSE] Agent leg REJECTED:", JSON.stringify(agentResponse.data));
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "provider_error",
        metadata: { leg: "agent", http_status: agentResponse.status, response: agentResponse.data },
      }).catch(() => {});
      return jsonResponse({ status: "error", error: agentResponse.data?.error || "Call provider rejected the agent leg", session_id });
    }

    const agentCallId = agentResponse.data.request_uuid || agentResponse.data.RequestUUID || null;
    if (!agentCallId) {
      console.error("[PLIVO RESPONSE] Agent leg missing request_uuid:", JSON.stringify(agentResponse.data));
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "provider_error",
        metadata: { leg: "agent", reason: "missing_request_uuid", response: agentResponse.data },
      }).catch(() => {});
      return jsonResponse({ status: "error", error: "Call provider did not return a valid call ID for agent leg", session_id });
    }

    // 1-second delay before customer leg
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[dialer-initiate] Creating customer leg", customerPayload);
    let customerResponse: { ok: boolean; status: number; data: any };
    try {
      customerResponse = await createPlivoCall({ authId: PLIVO_AUTH_ID, authToken: PLIVO_AUTH_TOKEN, payload: customerPayload });
      console.log("[PLIVO RESPONSE] Customer leg:", JSON.stringify(customerResponse.data));
    } catch (fetchErr) {
      console.error("[dialer-initiate] Customer call fetch error:", fetchErr);
      // Hangup the agent leg since customer failed
      try {
        await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${agentCallId}/`, {
          method: "DELETE",
          headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
        });
      } catch (_) {}
      await supabase.from("dialer_sessions").update({ call_status: "failed", provider_call_id: agentCallId }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Failed to reach call provider for customer leg", session_id });
    }

    if (!customerResponse.ok) {
      console.error("[PLIVO RESPONSE] Customer leg REJECTED:", JSON.stringify(customerResponse.data));
      // Hangup agent leg
      try {
        await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${agentCallId}/`, {
          method: "DELETE",
          headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
        });
      } catch (_) {}
      await supabase.from("dialer_sessions").update({ call_status: "failed", provider_call_id: agentCallId }).eq("id", session_id);
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "provider_error",
        metadata: { leg: "customer", http_status: customerResponse.status, response: customerResponse.data },
      }).catch(() => {});
      return jsonResponse({ status: "error", error: customerResponse.data?.error || "Call provider rejected the customer leg", session_id });
    }

    const customerCallId = customerResponse.data.request_uuid || customerResponse.data.RequestUUID || null;
    if (!customerCallId) {
      console.error("[PLIVO RESPONSE] Customer leg missing request_uuid:", JSON.stringify(customerResponse.data));
      try {
        await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${agentCallId}/`, {
          method: "DELETE",
          headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
        });
      } catch (_) {}
      await supabase.from("dialer_sessions").update({ call_status: "failed", provider_call_id: agentCallId }).eq("id", session_id);
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "provider_error",
        metadata: { leg: "customer", reason: "missing_request_uuid", response: customerResponse.data },
      }).catch(() => {});
      return jsonResponse({ status: "error", error: "Call provider did not return a valid call ID for customer leg", session_id });
    }

    console.log("[dialer-initiate] Both legs confirmed by Plivo", {
      session_id,
      conference_id: conferenceId,
      agent_call_id: agentCallId,
      customer_call_id: customerCallId,
    });

    // Only NOW mark as ringing — both legs confirmed by Plivo
    await supabase.from("dialer_sessions").update({
      provider_call_id: agentCallId,
      customer_call_id: customerCallId,
      conference_id: conferenceId,
      call_status: "ringing",
    }).eq("id", session_id);

    await supabase.from("dialer_call_events").insert({
      session_id,
      event_type: "conference_initiated",
      metadata: {
        conference_id: conferenceId,
        agent_call_id: agentCallId,
        customer_call_id: customerCallId,
        agent_phone: formattedAgentPhone,
        customer_phone: formattedCustomerPhone,
        agent_caller_id: agentCallerId,
        customer_caller_id: customerCallerId,
      },
    }).catch(() => {});

    await supabase.from("system_events").insert({
      business_id: session.business_id,
      event_type: "DIALER_CALL_INITIATED",
      payload_json: {
        session_id,
        conference_id: conferenceId,
        phone_number: formattedCustomerPhone,
        agent_call_id: agentCallId,
        customer_call_id: customerCallId,
        user_id: session.user_id,
      },
    });

    return jsonResponse({
      status: "ok",
      provider_call_id: agentCallId,
      customer_call_id: customerCallId,
      conference_id: conferenceId,
      session_id,
    });
  } catch (err) {
    console.error("[dialer-initiate] Error:", err);
    return jsonResponse({ status: "error", error: String(err) });
  }
});
