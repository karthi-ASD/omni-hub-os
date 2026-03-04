import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const callUuid = body.CallUUID || body.call_uuid || body.RequestUUID;
    const eventType = body.Event || body.CallStatus || "UNKNOWN";

    if (!callUuid) {
      return new Response(JSON.stringify({ error: "Missing CallUUID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find session by plivo_call_uuid
    const { data: session } = await supabase
      .from("voice_agent_sessions")
      .select("*")
      .eq("plivo_call_uuid", callUuid)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found for UUID" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store event
    await supabase.from("voice_agent_events").insert({
      business_id: session.business_id,
      session_id: session.id,
      event_source: "PLIVO",
      event_type: eventType,
      payload_json: body,
    });

    // Route based on event
    const updates: Record<string, any> = {};

    switch (eventType) {
      case "StartApp":
      case "answered":
      case "in-progress":
        updates.status = "IN_PROGRESS";
        break;

      case "completed":
      case "hangup": {
        updates.status = "COMPLETED";
        updates.ended_at = new Date().toISOString();
        updates.call_duration_seconds = body.Duration || body.BillDuration || null;

        if (body.RecordUrl || body.RecordingUrl) {
          updates.recording_url = body.RecordUrl || body.RecordingUrl;
        }

        // System event
        await supabase.from("system_events").insert({
          business_id: session.business_id,
          event_type: "VOICE_CALL_SUMMARY_READY",
          payload_json: { session_id: session.id, duration: updates.call_duration_seconds },
        });
        break;
      }

      case "busy":
      case "no-answer":
      case "cancel": {
        updates.status = "NO_ANSWER";

        // Check if retry is possible
        const { data: policies } = await supabase
          .from("voice_agent_policies")
          .select("max_attempts, retry_minutes")
          .eq("business_id", session.business_id)
          .limit(1);

        const policy = policies?.[0];
        if (policy && session.attempt_number < policy.max_attempts) {
          // Schedule retry
          const retryAt = new Date(Date.now() + (policy.retry_minutes || 15) * 60000);
          updates.status = "RESCHEDULED";
          updates.scheduled_call_at = retryAt.toISOString();

          await supabase.from("system_events").insert({
            business_id: session.business_id,
            event_type: "VOICE_CALL_RETRY_SCHEDULED",
            payload_json: { session_id: session.id, retry_at: retryAt.toISOString(), attempt: session.attempt_number + 1 },
          });
        }
        break;
      }

      case "failed":
        updates.status = "FAILED";
        updates.error_message = body.HangupCause || body.Error || "Call failed";

        await supabase.from("system_events").insert({
          business_id: session.business_id,
          event_type: "VOICE_CALL_FAILED",
          payload_json: { session_id: session.id, reason: updates.error_message },
        });
        break;

      case "MachineDetection":
        // Machine detected — mark and potentially skip
        await supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "PLIVO",
          event_type: "MACHINE_DETECTED",
          payload_json: body,
        });
        break;

      default:
        // Unknown event, just store it (already done above)
        break;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("voice_agent_sessions").update(updates).eq("id", session.id);
    }

    return new Response(JSON.stringify({ status: "ok", session_id: session.id, event: eventType }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Plivo callback error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
