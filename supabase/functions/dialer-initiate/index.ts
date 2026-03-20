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
    const { session_id, action } = body;

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

    // Validate and format phone number
    const formattedPhone = formatToE164(session.phone_number);
    if (!formattedPhone) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Invalid phone number format. Must include country code (e.g. +61412345678)." });
    }

    console.log("Provider Request:", { from: PLIVO_CALLER_ID, to: formattedPhone });

    // Build callback URL
    const callbackBase = `${supabaseUrl}/functions/v1/dialer-webhook`;
    const callbackUrl = `${callbackBase}?session_id=${session_id}&token=${PLIVO_WEBHOOK_SECRET}`;

    // Make Plivo outbound call
    let plivoData: any = {};
    let plivoOk = false;
    try {
      const plivoResp = await fetch(
        `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Call/`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: PLIVO_CALLER_ID,
            to: formattedPhone,
            answer_url: callbackUrl,
            answer_method: "POST",
            hangup_url: callbackUrl,
            hangup_method: "POST",
            fallback_url: callbackUrl,
            fallback_method: "POST",
            record: true,
            recording_callback_url: callbackUrl,
            recording_callback_method: "POST",
            machine_detection: true,
            machine_detection_url: callbackUrl,
            machine_detection_method: "POST",
          }),
        }
      );

      plivoOk = plivoResp.ok;
      const text = await plivoResp.text();
      try { plivoData = JSON.parse(text); } catch { plivoData = { raw: text }; }

      console.log("Plivo response:", { ok: plivoOk, status: plivoResp.status, data: plivoData });
    } catch (fetchErr) {
      console.error("Plivo fetch error:", fetchErr);
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return jsonResponse({ status: "error", error: "Failed to reach call provider", session_id });
    }

    if (!plivoOk) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);

      try {
        await supabase.from("dialer_call_events").insert({
          session_id,
          event_type: "provider_error",
          metadata: { response: plivoData },
        });
      } catch (_) {}

      return jsonResponse({ status: "error", error: plivoData?.error || "Call provider rejected the request", details: plivoData, session_id });
    }

    const providerCallId = plivoData.request_uuid || plivoData.RequestUUID || null;

    await supabase
      .from("dialer_sessions")
      .update({
        provider_call_id: providerCallId,
        call_start_time: new Date().toISOString(),
      })
      .eq("id", session_id);

    await supabase.from("system_events").insert({
      business_id: session.business_id,
      event_type: "DIALER_CALL_INITIATED",
      payload_json: {
        session_id,
        phone_number: formattedPhone,
        provider_call_id: providerCallId,
        user_id: session.user_id,
      },
    });

    return jsonResponse({ status: "ok", provider_call_id: providerCallId, session_id });
  } catch (err) {
    console.error("Dialer initiate error:", err);
    return jsonResponse({ status: "error", error: String(err) });
  }
});
