import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Helper: always return 200 with status in body
function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
}

// E.164 phone number formatter — supports AU, IN, US/CA, UK, NZ and passthrough for +prefixed
function formatToE164(phone: string): string | null {
  let p = phone.replace(/\D/g, "");

  // Already has + prefix — trust it
  if (phone.trim().startsWith("+") && p.length >= 8) {
    return "+" + p;
  }

  // AU: leading 0 → 61
  if (p.startsWith("0") && p.length === 10) {
    return "+61" + p.slice(1);
  }

  // Already starts with country code
  if (p.startsWith("61") && p.length >= 9 && p.length <= 11) return "+" + p;
  if (p.startsWith("91") && p.length >= 10 && p.length <= 12) return "+" + p;
  if (p.startsWith("1") && p.length === 11) return "+" + p;
  if (p.startsWith("44") && p.length >= 10 && p.length <= 12) return "+" + p;
  if (p.startsWith("64") && p.length >= 9 && p.length <= 11) return "+" + p;

  if (p.length >= 8) return "+" + p;

  return null;
}

async function createPlivoCall(params: {
  authId: string;
  authToken: string;
  payload: Record<string, unknown>;
}) {
  const plivoResp = await fetch(
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

  const text = await plivoResp.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return {
    ok: plivoResp.ok,
    status: plivoResp.status,
    data,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Validate auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ status: "error", error: "Unauthorized" });
  }

  try {
    const body = await req.json();
    const { session_id, action, agent_phone, agentPhone } = body;

    console.log("Dialer Initiate Start", { session_id, action });

    if (!session_id) {
      return jsonResponse({ status: "error", error: "Missing session_id" });
    }

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      console.log("Session not found", { session_id, sessErr });
      return jsonResponse({ status: "error", error: "Session not found" });
    }

    console.log("Session:", { id: session.id, phone: session.phone_number, user: session.user_id });

    // HANGUP action
    if (action === "hangup") {
      if (session.provider_call_id) {
        const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
        const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");

        if (PLIVO_AUTH_ID && PLIVO_AUTH_TOKEN) {
          try {
            await fetch(
              `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${session.provider_call_id}/`,
              {
                method: "DELETE",
                headers: {
                  Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`),
                },
              }
            );
          } catch (e) {
            console.error("Plivo hangup error:", e);
          }
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
      try {
        await supabase.from("dialer_call_events").insert({
          session_id,
          event_type: "rate_limit_blocked",
          metadata: { user_id: userId, reason: "too_many_calls_30s" },
        });
      } catch (_) {}

      return jsonResponse({ status: "error", error: "Rate limit exceeded. Please wait before making another call." });
    }

    // INITIATE CALL
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
      return jsonResponse({ status: "error", error: "Invalid phone number format. Must include country code (e.g. +61412345678)." });
    }

    if (!formattedAgentPhone) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Invalid agent phone number format. Must include country code (e.g. +61412345678)." });
    }

    const conferenceId = `dialer-${session_id}`;

    console.log("CALL FLOW DEBUG", {
      session_id,
      conference_id: conferenceId,
      agent_phone: formattedAgentPhone,
      customer_phone: formattedCustomerPhone,
      status: session.call_status,
    });

    // Build callback URLs — answer_url must return XML, webhook returns JSON
    const queryBase = new URLSearchParams({
      session_id,
      token: PLIVO_WEBHOOK_SECRET,
      conference: conferenceId,
    });

    const agentAnswerUrl = `${supabaseUrl}/functions/v1/dialer-answer?${queryBase.toString()}&leg=agent`;
    const customerAnswerUrl = `${supabaseUrl}/functions/v1/dialer-answer?${queryBase.toString()}&leg=customer`;
    const agentWebhookUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${queryBase.toString()}&leg=agent`;
    const customerWebhookUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${queryBase.toString()}&leg=customer`;

    console.log("Callback URLs:", { agentAnswerUrl, customerAnswerUrl, agentWebhookUrl, customerWebhookUrl });

    const agentPayload = {
      from: PLIVO_CALLER_ID,
      to: formattedAgentPhone,
      answer_url: agentAnswerUrl,
      answer_method: "POST",
      hangup_url: agentWebhookUrl,
      hangup_method: "POST",
      fallback_url: agentAnswerUrl,
      fallback_method: "POST",
      ring_timeout: 45,
      record: true,
      recording_callback_url: agentWebhookUrl,
      recording_callback_method: "POST",
    };

    console.log("Dial request payload", { leg: "agent", payload: agentPayload });

    let agentResponse: { ok: boolean; status: number; data: any };
    try {
      agentResponse = await createPlivoCall({
        authId: PLIVO_AUTH_ID,
        authToken: PLIVO_AUTH_TOKEN,
        payload: agentPayload,
      });
      console.log("Provider response", { leg: "agent", ...agentResponse });
    } catch (fetchErr) {
      console.error("Plivo fetch error:", fetchErr);
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Failed to reach call provider", session_id });
    }

    if (!agentResponse.ok) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);

      try {
        await supabase.from("dialer_call_events").insert({
          session_id,
          event_type: "provider_error",
          metadata: { leg: "agent", response: agentResponse.data },
        });
      } catch (_) {}

      return jsonResponse({ status: "error", error: agentResponse.data?.error || "Call provider rejected the agent leg", details: agentResponse.data, session_id });
    }

    const providerCallId = agentResponse.data.request_uuid || agentResponse.data.RequestUUID || null;

    console.log("Agent leg created", { session_id, provider_call_id: providerCallId });

    const customerPayload = {
      from: PLIVO_CALLER_ID,
      to: formattedCustomerPhone,
      answer_url: customerAnswerUrl,
      answer_method: "POST",
      hangup_url: customerWebhookUrl,
      hangup_method: "POST",
      fallback_url: customerAnswerUrl,
      fallback_method: "POST",
      ring_timeout: 45,
      machine_detection: true,
      machine_detection_url: customerWebhookUrl,
      machine_detection_method: "POST",
    };

    console.log("Dial request payload", { leg: "customer", payload: customerPayload });

    let customerResponse: { ok: boolean; status: number; data: any };
    try {
      customerResponse = await createPlivoCall({
        authId: PLIVO_AUTH_ID,
        authToken: PLIVO_AUTH_TOKEN,
        payload: customerPayload,
      });
      console.log("Provider response", { leg: "customer", ...customerResponse });
    } catch (fetchErr) {
      console.error("Plivo customer fetch error:", fetchErr);
      if (providerCallId) {
        try {
          await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${providerCallId}/`, {
            method: "DELETE",
            headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
          });
        } catch (_) {}
      }
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Failed to create customer leg", session_id });
    }

    if (!customerResponse.ok) {
      if (providerCallId) {
        try {
          await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/${providerCallId}/`, {
            method: "DELETE",
            headers: { Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`) },
          });
        } catch (_) {}
      }
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);

      try {
        await supabase.from("dialer_call_events").insert({
          session_id,
          event_type: "provider_error",
          metadata: { leg: "customer", response: customerResponse.data },
        });
      } catch (_) {}

      return jsonResponse({ status: "error", error: customerResponse.data?.error || "Call provider rejected the customer leg", details: customerResponse.data, session_id });
    }

    const customerProviderCallId = customerResponse.data.request_uuid || customerResponse.data.RequestUUID || null;

    console.log("Customer leg created", { session_id, provider_call_id: customerProviderCallId });

    await supabase
      .from("dialer_sessions")
      .update({
        provider_call_id: providerCallId,
        call_status: "ringing",
      })
      .eq("id", session_id);

    try {
      await supabase.from("dialer_call_events").insert({
        session_id,
        event_type: "conference_calls_created",
        metadata: {
          conference_id: conferenceId,
          agent_provider_call_id: providerCallId,
          customer_provider_call_id: customerProviderCallId,
          agent_phone: formattedAgentPhone,
          customer_phone: formattedCustomerPhone,
        },
      });
    } catch (_) {}

    await supabase.from("system_events").insert({
      business_id: session.business_id,
      event_type: "DIALER_CALL_INITIATED",
      payload_json: {
        session_id,
        conference_id: conferenceId,
        phone_number: formattedCustomerPhone,
        provider_call_id: providerCallId,
        customer_provider_call_id: customerProviderCallId,
        user_id: session.user_id,
      },
    });

    return jsonResponse({ status: "ok", provider_call_id: providerCallId, customer_provider_call_id: customerProviderCallId, session_id, conference_id: conferenceId });
  } catch (err) {
    console.error("Dialer initiate error:", err);
    return jsonResponse({ status: "error", error: String(err) });
  }
});
