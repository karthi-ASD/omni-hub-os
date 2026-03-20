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

  // --- WEBHOOK SECURITY (token-based via query param) ---
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = Deno.env.get("PLIVO_WEBHOOK_SECRET");

  if (expected && token !== expected) {
    console.warn("[dialer-webhook] Unauthorized request rejected");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const querySessionId = url.searchParams.get("session_id");

    let body: Record<string, any>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    }

    const callUuid = body.CallUUID || body.call_uuid || body.RequestUUID || "";
    const rawStatus = body.CallStatus || body.Event || "unknown";

    // Enhanced webhook logging
    console.log("[dialer-webhook] Received", {
      session_id: querySessionId,
      call_uuid: callUuid,
      raw_status: rawStatus,
      content_type: contentType,
    });

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
      console.warn("[dialer-webhook] No session found", { querySessionId, callUuid });
      // Log orphan webhook to system_logs
      try {
        await supabase.from("system_logs").insert({
          type: "DIALER_WEBHOOK_ORPHAN",
          message: `Webhook received with no matching session`,
          metadata: { session_id: querySessionId, call_uuid: callUuid, raw_status: rawStatus },
        });
      } catch (_) {}
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize status
    const mappedStatus = mapPlivoStatus(rawStatus);

    // Debug log
    console.log("[dialer-webhook] Processing", {
      session_id: session.id,
      incoming_status: rawStatus,
      mapped_status: mappedStatus,
      current_status: session.call_status,
    });

    // Build dedupe key for event insert
    const dedupeKey = `${session.id}_${rawStatus}_${callUuid}_${body.Event || ""}_${body.CallStatus || ""}_${body.Duration || ""}`;

    // Store event with dedupe
    try {
      await supabase.from("dialer_call_events").upsert(
        {
          session_id: session.id,
          event_type: rawStatus,
          metadata: body,
          dedupe_key: dedupeKey,
        },
        { onConflict: "dedupe_key", ignoreDuplicates: true }
      );
    } catch (insertErr) {
      console.log("[dialer-webhook] Event insert skipped (likely duplicate):", rawStatus);
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
      console.log("[dialer-webhook] Skipped (terminal)", { session_id: session.id, current: session.call_status });
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

        // Extract cost tracking fields
        const billDuration = parseInt(body.BillDuration || "0");
        if (billDuration) updates.bill_duration = billDuration;
        const cost = parseFloat(body.TotalCost || body.Cost || "0");
        if (cost > 0) updates.call_cost = cost;
      }
    }

    // Trigger AI analysis for ended calls (fire-and-forget)
    // Skip AI for early disconnects (< 3 seconds)
    if (updates.call_status && updates.call_status === "ended") {
      const duration = updates.call_duration || 0;
      const isEarlyDisconnect = duration > 0 && duration < 3;

      if (isEarlyDisconnect) {
        console.log("[dialer-webhook] Early disconnect detected", { session_id: session.id, duration });
        try {
          await supabase.from("dialer_call_events").insert({
            session_id: session.id,
            event_type: "early_disconnect",
            metadata: { duration, reason: "call_ended_within_3s" },
          });
        } catch (_) {}
      } else {
        try {
          fetch(`${supabaseUrl}/functions/v1/dialer-ai-analyze`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id: session.id }),
          }).catch((e) => console.error("[dialer-webhook] AI trigger failed:", e));
        } catch (_) {}
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
      if (updateErr) {
        console.error("[dialer-webhook] Session update failed:", updateErr);
        try {
          await supabase.from("system_logs").insert({
            type: "DIALER_WEBHOOK_ERROR",
            message: `Failed to update session ${session.id}`,
            metadata: { error: updateErr.message, updates },
            business_id: session.business_id,
          });
        } catch (_) {}
      }
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

    console.log("[dialer-webhook] Done", { session_id: session.id, updates: Object.keys(updates) });

    return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[dialer-webhook] Error:", err);
    // Log to system_logs
    try {
      await supabase.from("system_logs").insert({
        type: "DIALER_WEBHOOK_CRASH",
        message: String(err),
        metadata: { stack: err instanceof Error ? err.stack : null },
      });
    } catch (_) {}
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
