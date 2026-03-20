import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Reusable payload parser ──
async function parseTelephonyPayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) out[k] = String(v ?? "");
      return out;
    } catch { return {}; }
  }
  try {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text));
  } catch { return {}; }
}

// ── Normalized payload from raw Plivo fields ──
interface NormalizedPayload {
  call_uuid: string;
  request_uuid: string;
  call_status: string;
  dial_status: string;
  recording_url: string;
  duration: number;
  bill_duration: number;
  total_cost: number;
  hangup_cause: string;
  from_number: string;
  to_number: string;
  direction: string;
  event: string;
}

function normalizePayload(body: Record<string, string>): NormalizedPayload {
  return {
    call_uuid: body.CallUUID || body.call_uuid || body.RequestUUID || "",
    request_uuid: body.RequestUUID || body.request_uuid || "",
    call_status: body.CallStatus || body.Status || "",
    dial_status: body.DialStatus || body.DialBLegStatus || "",
    recording_url: body.RecordUrl || body.RecordingUrl || body.recording_url || "",
    duration: parseInt(body.Duration || body.CallDuration || "0") || 0,
    bill_duration: parseInt(body.BillDuration || body.BilledDuration || "0") || 0,
    total_cost: parseFloat(body.TotalCost || body.Cost || body.TotalAmount || "0") || 0,
    hangup_cause: body.HangupCause || body.hangup_cause || body.Reason || "",
    from_number: body.From || body.from || "",
    to_number: body.To || body.to || "",
    direction: body.Direction || body.direction || "",
    event: body.Event || body.event || "",
  };
}

// ── Status mapper: Plivo → canonical dialer status ──
// Considers both CallStatus and DialStatus (B-leg result from Dial action URL)
function mapToDialerStatus(p: NormalizedPayload, leg: string): string | null {
  // DialStatus is sent to the action URL after <Dial> completes — tells us what happened to the B-leg (customer)
  const ds = p.dial_status.toLowerCase();
  if (leg === "customer" && ds) {
    const dialMap: Record<string, string> = {
      "answer": "connected",
      "completed": "ended",
      "hangup": "ended",
      "busy": "busy",
      "no-answer": "no-answer",
      "cancel": "no-answer",
      "failed": "failed",
      "rejected": "failed",
      "timeout": "no-answer",
    };
    if (dialMap[ds]) return dialMap[ds];
  }

  // CallStatus from hangup_url or other webhooks
  const cs = p.call_status.toLowerCase();
  const statusMap: Record<string, string> = {
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
  return statusMap[cs] || null;
}

const TERMINAL_STATES = ["ended", "failed", "busy", "no-answer"];

function getStatusRank(status: string | null | undefined): number {
  const ranks: Record<string, number> = {
    idle: 0, initiating: 1, ringing: 2, bridging: 3, connected: 4,
    ended: 5, busy: 5, "no-answer": 5, failed: 5,
  };
  return ranks[status || ""] ?? -1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const leg = url.searchParams.get("leg") || "unknown";

    const body = await parseTelephonyPayload(req);
    const p = normalizePayload(body);

    console.log("[dialer-webhook] Received", {
      session_id: querySessionId,
      leg,
      call_uuid: p.call_uuid,
      call_status: p.call_status,
      dial_status: p.dial_status,
      hangup_cause: p.hangup_cause,
      recording_url: p.recording_url ? "present" : "none",
      duration: p.duration,
    });

    // ── Resolve session ──
    let session: any = null;
    if (querySessionId) {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("id", querySessionId)
        .maybeSingle();
      session = data;
    }
    if (!session && p.call_uuid) {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("provider_call_id", p.call_uuid)
        .maybeSingle();
      session = data;
    }

    if (!session) {
      console.warn("[dialer-webhook] No session found", { querySessionId, call_uuid: p.call_uuid });
      try {
        await supabase.from("system_logs").insert({
          type: "DIALER_WEBHOOK_ORPHAN",
          message: "Webhook with no matching session",
          metadata: { session_id: querySessionId, call_uuid: p.call_uuid, raw_status: p.call_status },
        });
      } catch (_) {}
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Map status ──
    const mappedStatus = mapToDialerStatus(p, leg);

    console.log("[dialer-webhook] Processing", {
      session_id: session.id,
      leg,
      incoming_call_status: p.call_status,
      incoming_dial_status: p.dial_status,
      mapped_status: mappedStatus,
      current_status: session.call_status,
      hangup_cause: p.hangup_cause,
    });

    // ── Log event (best-effort) ──
    const eventType = leg === "recording" ? "recording_received"
      : mappedStatus || p.call_status || p.event || "webhook_received";
    try {
      await supabase.from("dialer_call_events").insert({
        session_id: session.id,
        event_type: eventType,
        metadata: {
          leg,
          call_uuid: p.call_uuid,
          call_status: p.call_status,
          dial_status: p.dial_status,
          hangup_cause: p.hangup_cause,
          duration: p.duration,
          bill_duration: p.bill_duration,
          cost: p.total_cost,
          recording_url: p.recording_url || null,
        },
      });
    } catch (_) {}

    // ── Build updates ──
    const updates: Record<string, any> = {};
    const currentIsTerminal = TERMINAL_STATES.includes(session.call_status);

    // Recording URL — ALWAYS accept if valid, even after terminal state
    if (p.recording_url && p.recording_url.startsWith("http")) {
      updates.recording_url = p.recording_url;
      console.log("[dialer-webhook] Recording URL captured", { session_id: session.id, url: p.recording_url });
    }

    // ── Recording-only webhooks: save recording and return ──
    if (leg === "recording") {
      if (Object.keys(updates).length > 0) {
        await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
      }
      console.log("[dialer-webhook] Recording leg processed", { session_id: session.id });
      return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Customer leg: handle Dial action completion ──
    if (leg === "customer") {
      // DialStatus tells us what happened with the customer
      const ds = p.dial_status.toLowerCase();

      if (ds === "answer" || mappedStatus === "connected") {
        // Customer answered — NOW we set connected
        updates.customer_connected = true;
        updates.call_status = "connected";
        if (!session.call_start_time) {
          updates.call_start_time = new Date().toISOString();
        }
        console.log("[dialer-webhook] Customer connected", { session_id: session.id });
      } else if (["busy", "no-answer", "cancel", "timeout", "failed", "rejected"].includes(ds)) {
        // Customer did not answer
        const failStatus = ds === "busy" ? "busy"
          : ["no-answer", "cancel", "timeout"].includes(ds) ? "no-answer"
          : "failed";
        updates.call_status = failStatus;
        updates.call_end_time = new Date().toISOString();
        if (p.duration > 0) updates.call_duration = p.duration;
        console.log("[dialer-webhook] Customer leg failed", { session_id: session.id, dial_status: ds, mapped: failStatus });
      }
      // If Dial completed (call ended naturally after connection)
      if (ds === "completed" || ds === "hangup") {
        updates.call_status = "ended";
        updates.call_end_time = new Date().toISOString();
        if (p.duration > 0) updates.call_duration = p.duration;
        if (p.bill_duration > 0) updates.bill_duration = p.bill_duration;
        if (p.total_cost > 0) updates.call_cost = p.total_cost;
      }
    }

    // ── Agent leg (hangup_url): terminal state from agent call ──
    if (leg === "agent" && mappedStatus) {
      if (currentIsTerminal) {
        // Already terminal — only allow recording URL updates (handled above)
        if (Object.keys(updates).length > 0) {
          await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
        }
        console.log("[dialer-webhook] Agent leg skipped (already terminal)", { session_id: session.id });
        return new Response(JSON.stringify({ status: "ok", session_id: session.id, skipped: "terminal" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Only apply if it's a progression
      const currentRank = getStatusRank(session.call_status);
      const nextRank = getStatusRank(mappedStatus);

      if (nextRank > currentRank || TERMINAL_STATES.includes(mappedStatus)) {
        if (TERMINAL_STATES.includes(mappedStatus)) {
          updates.call_status = mappedStatus;
          updates.call_end_time = new Date().toISOString();
          if (p.duration > 0) updates.call_duration = p.duration;
          if (p.bill_duration > 0) updates.bill_duration = p.bill_duration;
          if (p.total_cost > 0) updates.call_cost = p.total_cost;
        }
      } else {
        console.log("[dialer-webhook] Ignored agent status regression", {
          session_id: session.id, current: session.call_status, incoming: mappedStatus,
        });
      }
    }

    // ── Apply updates ──
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

    const finalStatus = updates.call_status || session.call_status;

    // ── Trigger AI analysis on terminal ended state ──
    if (updates.call_status === "ended") {
      const duration = updates.call_duration || p.duration || 0;
      if (duration >= 3) {
        // Fire-and-forget AI analysis
        fetch(`${supabaseUrl}/functions/v1/dialer-ai-analyze`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: session.id }),
        }).catch((e) => console.error("[dialer-webhook] AI trigger failed:", e));
      } else {
        try {
          await supabase.from("dialer_call_events").insert({
            session_id: session.id,
            event_type: "early_disconnect",
            metadata: { duration, reason: "call_ended_within_3s" },
          });
        } catch (_) {}
      }
    }

    // ── System event for terminal states ──
    if (updates.call_status && TERMINAL_STATES.includes(updates.call_status)) {
      await supabase.from("system_events").insert({
        business_id: session.business_id,
        event_type: `DIALER_CALL_${updates.call_status.toUpperCase().replace("-", "_")}`,
        payload_json: {
          session_id: session.id,
          phone_number: session.phone_number,
          duration: updates.call_duration || p.duration,
          status: updates.call_status,
          hangup_cause: p.hangup_cause,
        },
      }).catch(() => {});
    }

    console.log("[dialer-webhook] Done", {
      session_id: session.id,
      leg,
      previous_status: session.call_status,
      final_status: finalStatus,
      updated_fields: Object.keys(updates),
      recording_captured: !!updates.recording_url,
      terminal_applied: TERMINAL_STATES.includes(finalStatus),
    });

    return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[dialer-webhook] Error:", err);
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
