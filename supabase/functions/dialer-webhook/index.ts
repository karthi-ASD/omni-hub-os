import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function parseTelephonyPayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) out[k] = String(v ?? "");
      return out;
    } catch {
      return {};
    }
  }
  try {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return {};
  }
}

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
    duration: parseInt(body.Duration || body.CallDuration || body.ConferenceDuration || "0") || 0,
    bill_duration: parseInt(body.BillDuration || body.BilledDuration || "0") || 0,
    total_cost: parseFloat(body.TotalCost || body.Cost || body.TotalAmount || "0") || 0,
    hangup_cause: body.HangupCause || body.hangup_cause || body.Reason || "",
    from_number: body.From || body.from || "",
    to_number: body.To || body.to || "",
    direction: body.Direction || body.direction || "",
    event: body.Event || body.event || "",
  };
}

const TERMINAL_STATES = ["ended", "failed", "busy", "no-answer"];

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
      hangup_cause: p.hangup_cause,
      recording_url: p.recording_url ? "present" : "none",
      duration: p.duration,
    });

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
      console.warn("[dialer-webhook] No session found", { querySessionId, call_uuid: p.call_uuid, leg });
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerCallId = session.provider_call_id || "";
    const strictMatch = !!p.call_uuid && !!providerCallId && p.call_uuid === providerCallId;

    console.log("SESSION_PROVIDER_CORRELATION_STRICT", {
      session_id: session.id,
      incoming_call_uuid: p.call_uuid,
      provider_call_id: providerCallId,
      strict_match: strictMatch,
      leg,
      event: p.event,
      call_status: p.call_status,
    });

    // For recording callbacks, skip strict match — session_id from URL is sufficient
    if (!strictMatch && leg !== "recording") {
      console.warn("PROVIDER_CALL_MISMATCH", {
        session_id: session.id,
        incoming_call_uuid: p.call_uuid,
        provider_call_id: providerCallId,
        leg,
        event: p.event,
        call_status: p.call_status,
      });

      try {
        await supabase.from("dialer_call_events").insert({
          session_id: session.id,
          event_type: "provider_call_mismatch",
          metadata: {
            leg,
            incoming_call_uuid: p.call_uuid || null,
            provider_call_id: providerCallId || null,
            event: p.event || null,
            call_status: p.call_status || null,
            hangup_cause: p.hangup_cause || null,
            strict_match: false,
          },
        });
      } catch {
        // ignore logging failure
      }

      return new Response(JSON.stringify({ status: "ignored_mismatch", session_id: session.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = leg === "recording"
      ? "recording_received"
      : p.call_status.toLowerCase() === "completed"
        ? "call_completed"
        : p.hangup_cause
          ? "hangup"
          : "webhook_received";

    try {
      await supabase.from("dialer_call_events").insert({
        session_id: session.id,
        event_type: eventType,
        metadata: {
          leg,
          call_uuid: p.call_uuid,
          call_status: p.call_status,
          hangup_cause: p.hangup_cause,
          duration: p.duration,
          bill_duration: p.bill_duration,
          cost: p.total_cost,
          recording_url: p.recording_url || null,
          strict_match: true,
        },
      });
    } catch {
      // ignore logging failure
    }

    const updates: Record<string, any> = {};
    const currentIsTerminal = TERMINAL_STATES.includes(session.call_status);

    if (p.recording_url && p.recording_url.startsWith("http")) {
      updates.recording_url = p.recording_url;
      console.log("RECORDING_SAVED", { session_id: session.id, url: p.recording_url });
    }

    if (leg === "recording") {
      if (p.duration > 0 && !session.call_duration) updates.call_duration = p.duration;
      if (p.bill_duration > 0 && !session.bill_duration) updates.bill_duration = p.bill_duration;
      if (p.total_cost > 0 && !session.call_cost) updates.call_cost = p.total_cost;

      if (Object.keys(updates).length > 0) {
        const { error: recErr } = await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
        if (recErr) console.error("RECORDING_SAVE_FAILED", recErr);
      }

      // ── Sync recording to CRM communication ──
      try {
        const { data: crmComm } = await supabase
          .from("crm_call_communications")
          .select("id")
          .eq("dialer_session_id", session.id)
          .maybeSingle();

        if (crmComm?.id) {
          const crmUpdates: Record<string, any> = {};
          if (p.recording_url && p.recording_url.startsWith("http")) crmUpdates.recording_url = p.recording_url;
          if (p.duration > 0) crmUpdates.duration_seconds = p.duration;
          if (Object.keys(crmUpdates).length > 0) {
            await supabase.from("crm_call_communications").update(crmUpdates).eq("id", crmComm.id);
          }
          console.log("RECORDING_MAPPED", { session_id: session.id, communication_id: crmComm.id });
        }
      } catch (e) {
        console.error("CRM_RECORDING_SYNC_FAILED", e);
      }

      try {
        await supabase.from("dialer_call_events").insert({
          session_id: session.id,
          event_type: "recording_callback_received",
          metadata: {
            recording_url: p.recording_url || null,
            duration: p.duration,
            bill_duration: p.bill_duration,
            cost: p.total_cost,
            call_uuid: p.call_uuid,
          },
        });
      } catch { /* ignore */ }

      console.log("RECORDING_CALLBACK_RECEIVED", {
        session_id: session.id,
        has_url: !!p.recording_url,
        duration: p.duration,
      });
      return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cs = p.call_status.toLowerCase();

    // Detect "in-progress" as customer connected (for browser-originated calls)
    if ((cs === "in-progress" || cs === "answered") && !session.customer_connected) {
      updates.customer_connected = true;
      if (!session.call_start_time) {
        updates.call_start_time = new Date().toISOString();
      }
      if (session.call_status !== "connected") {
        updates.call_status = "connected";
      }
      console.log("[dialer-webhook] Customer connected (browser path)", { session_id: session.id, dial_status: p.dial_status });
    }

    const isTerminalEvent = ["completed", "hangup", "busy", "no-answer", "cancel", "failed", "rejected"].includes(cs) ||
      ["NORMAL_CLEARING", "ORIGINATOR_CANCEL", "USER_BUSY", "NO_ANSWER", "CALL_REJECTED"].includes(p.hangup_cause);

    if (isTerminalEvent && !currentIsTerminal) {
      let terminalStatus = "ended";
      if (cs === "busy" || p.hangup_cause === "USER_BUSY") terminalStatus = "busy";
      else if (cs === "no-answer" || cs === "cancel" || p.hangup_cause === "NO_ANSWER" || p.hangup_cause === "ORIGINATOR_CANCEL") terminalStatus = "no-answer";
      else if (cs === "failed" || cs === "rejected" || p.hangup_cause === "CALL_REJECTED") terminalStatus = "failed";

      const wasConnected = !!session.customer_connected || !!updates.customer_connected || !!session.call_start_time;

      if (!wasConnected) {
        updates.call_status = terminalStatus;
        updates.call_end_time = new Date().toISOString();
        console.log("[dialer-webhook] Customer never connected", { session_id: session.id, status: terminalStatus });
      } else {
        updates.call_status = "ended";
        updates.call_end_time = new Date().toISOString();
        const startTime = session.call_start_time || (updates.call_start_time as string);
        if (p.duration > 0) {
          updates.call_duration = p.duration;
        } else if (startTime) {
          const computed = Math.round((Date.now() - new Date(startTime).getTime()) / 1000);
          if (computed > 0) updates.call_duration = computed;
        }
        if (p.bill_duration > 0) updates.bill_duration = p.bill_duration;
        if (p.total_cost > 0) updates.call_cost = p.total_cost;
      }
    } else if (currentIsTerminal) {
      if (p.duration > 0 && !session.call_duration) updates.call_duration = p.duration;
      if (p.bill_duration > 0 && !session.bill_duration) updates.bill_duration = p.bill_duration;
      if (p.total_cost > 0 && !session.call_cost) updates.call_cost = p.total_cost;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
      if (updateErr) {
        console.error("[dialer-webhook] Session update failed", updateErr);
      }
    }

    const finalStatus = updates.call_status || session.call_status;

    // ── CRM communication sync on connected ──
    if (updates.call_status === "connected") {
      try {
        const { data: crmComm } = await supabase
          .from("crm_call_communications")
          .select("id")
          .eq("dialer_session_id", session.id)
          .maybeSingle();

        if (crmComm?.id) {
          await supabase.from("crm_call_communications").update({
            call_status: "connected",
            answer_time: new Date().toISOString(),
            connected: true,
          }).eq("id", crmComm.id);
          console.log("CALL_CONNECTED", { session_id: session.id, communication_id: crmComm.id });
        }
      } catch (e) {
        console.error("CRM_CONNECTED_SYNC_FAILED", e);
      }
    }

    // ── CRM communication sync on call end + transcript pipeline trigger ──
    if (updates.call_status === "ended" || (isTerminalEvent && !currentIsTerminal)) {
      const duration = updates.call_duration || p.duration || 0;
      const hadConnectedState = !!session.customer_connected || !!session.call_start_time || !!updates.customer_connected;
      const shouldProcessAI = hadConnectedState && duration >= 3;

      try {
        const { data: crmComm } = await supabase
          .from("crm_call_communications")
          .select("id")
          .eq("dialer_session_id", session.id)
          .maybeSingle();

        if (crmComm?.id) {
          const endUpdates: Record<string, any> = {
            call_status: updates.call_status || "ended",
            end_time: new Date().toISOString(),
            duration_seconds: duration,
          };
          if (hadConnectedState && session.call_start_time) {
            endUpdates.talk_time_seconds = Math.max(0, Math.round((Date.now() - new Date(session.call_start_time).getTime()) / 1000));
          }
          if (updates.recording_url) endUpdates.recording_url = updates.recording_url;

          // Set transcript_status to processing if AI will run
          if (shouldProcessAI) {
            endUpdates.transcript_status = "processing";
          }

          await supabase.from("crm_call_communications").update(endUpdates).eq("id", crmComm.id);
          console.log("CALL_ENDED", { session_id: session.id, communication_id: crmComm.id, duration, shouldProcessAI });
        }
      } catch (e) {
        console.error("CRM_END_SYNC_FAILED", e);
      }

      try {
        await supabase.from("dialer_call_events").insert({
          session_id: session.id,
          event_type: "postcall_pipeline_guard_result",
          metadata: {
            hadSession: true,
            hadConnectedState,
            connectedDurationMs: duration * 1000,
            hadTranscript: false,
            hadRecording: !!(updates.recording_url || session.recording_url),
            endReason: p.hangup_cause || p.call_status || updates.call_status,
            shouldProcessAI,
          },
        });
      } catch { /* ignore */ }

      if (shouldProcessAI) {
        fetch(`${supabaseUrl}/functions/v1/dialer-ai-analyze`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: session.id }),
        }).catch((e) => console.error("[dialer-webhook] AI trigger failed", e));
      } else {
        try {
          await supabase.from("dialer_call_events").insert({
            session_id: session.id,
            event_type: "early_disconnect",
            metadata: { duration, reason: hadConnectedState ? "call_ended_within_3s" : "call_never_connected" },
          });
        } catch { /* ignore */ }
      }
    }

    if (updates.call_status && TERMINAL_STATES.includes(updates.call_status)) {
      try {
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
        });
      } catch { /* ignore */ }
    }

    console.log("[dialer-webhook] Done", {
      session_id: session.id,
      leg,
      previous_status: session.call_status,
      final_status: finalStatus,
      updated_fields: Object.keys(updates),
      recording_captured: !!updates.recording_url,
      strict_match: true,
    });

    return new Response(JSON.stringify({ status: "ok", session_id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[dialer-webhook] Error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});