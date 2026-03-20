import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normalize raw Plivo status to canonical dialer status
function mapPlivoStatus(raw: string): string | null {
  const s = String(raw).toLowerCase();
  const map: Record<string, string> = {
    "ringing": "ringing",
    "early_media": "ringing",
    "answered": "connected",
    "in-progress": "connected",
    "completed": "ended",
    "hangup": "ended",
    "busy": "busy",
    "no-answer": "no-answer",
    "cancel": "no-answer",
    "failed": "failed",
    "rejected": "failed",
  };
  return map[s] || null;
}

const TERMINAL_STATES = ["ended", "failed", "busy", "no-answer"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- WEBHOOK SECURITY ---
  const expectedToken = Deno.env.get("PLIVO_WEBHOOK_SECRET");
  if (expectedToken) {
    const incomingToken =
      req.headers.get("x-plivo-signature") ||
      req.headers.get("authorization");
    if (incomingToken !== expectedToken) {
      console.warn("[dialer-webhook] Unauthorized request rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const querySessionId = url.searchParams.get("session_id");

    let body: Record<string, any>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    }

    const callUuid = body.CallUUID || body.call_uuid || body.RequestUUID;
    const rawStatus = body.CallStatus || body.Event || "unknown";

    // Resolve session — prefer query param, fallback to provider_call_id
    let session: any = null;

    if (querySessionId) {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("id", querySessionId)
        .maybeSingle();
      session = data;
    }

    if (!session && callUuid) {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("provider_call_id", callUuid)
        .maybeSingle();
      session = data;
    }

    if (!session) {
      console.warn("No dialer session found. query_session_id:", querySessionId, "callUuid:", callUuid);
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize status
    const mappedStatus = mapPlivoStatus(rawStatus);

    // Debug log for production troubleshooting
    console.log("[dialer-webhook]", {
      session_id: session.id,
      incoming_status: rawStatus,
      mapped_status: mappedStatus,
      current_status: session.call_status,
    });

    // Store event (duplicate-safe via unique constraint)
    try {
      await supabase.from("dialer_call_events").insert({
        session_id: session.id,
        event_type: rawStatus,
        metadata: body,
      });
    } catch (insertErr) {
      console.log("Event insert skipped (likely duplicate):", rawStatus);
    }

    // Build updates
    const updates: Record<string, any> = {};
    const currentIsTerminal = TERMINAL_STATES.includes(session.call_status);

    // Recording URL — validate and always accept regardless of state
    const recordingUrl = body.RecordUrl || body.RecordingUrl || body.recording_url;
    if (recordingUrl && typeof recordingUrl === "string" && recordingUrl.startsWith("http")) {
      updates.recording_url = recordingUrl;
    }

    // If already terminal, ONLY allow recording_url — skip everything else
    if (currentIsTerminal) {
      if (Object.keys(updates).length > 0) {
        await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
      }
      return new Response(JSON.stringify({ status: "ok", session_id: session.id, skipped: "terminal" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply mapped status if valid and different from current (idempotency)
    if (mappedStatus && mappedStatus !== session.call_status) {
      updates.call_status = mappedStatus;

      if (TERMINAL_STATES.includes(mappedStatus)) {
        updates.call_end_time = new Date().toISOString();
        const duration = parseInt(body.Duration || body.BillDuration || "0");
        if (duration) updates.call_duration = duration;
      }
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
    }

    // System event for terminal states
    if (updates.call_status && TERMINAL_STATES.includes(updates.call_status)) {
      await supabase.from("system_events").insert({
        business_id: session.business_id,
        event_type: `DIALER_CALL_${updates.call_status.toUpperCase().replace("-", "_")}`,
        payload_json: {
          session_id: session.id,
          phone_number: session.phone_number,
          duration: updates.call_duration,
          status: updates.call_status,
        },
      });
    }

    return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Dialer webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
