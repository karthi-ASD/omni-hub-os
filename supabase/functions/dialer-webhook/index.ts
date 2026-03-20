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
    let body: Record<string, any>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Plivo may send form-urlencoded
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    }

    const callUuid = body.CallUUID || body.call_uuid || body.RequestUUID;
    const callStatus = body.CallStatus || body.Event || "unknown";

    if (!callUuid) {
      return new Response(JSON.stringify({ error: "Missing CallUUID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find session by provider_call_id
    const { data: session } = await supabase
      .from("dialer_sessions")
      .select("*")
      .eq("provider_call_id", callUuid)
      .maybeSingle();

    if (!session) {
      console.warn("No dialer session found for call UUID:", callUuid);
      return new Response(JSON.stringify({ status: "no_session" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store event
    await supabase.from("dialer_call_events").insert({
      session_id: session.id,
      event_type: callStatus,
      metadata: body,
    });

    // Map status
    const updates: Record<string, any> = {};
    const statusLower = String(callStatus).toLowerCase();

    if (["ringing"].includes(statusLower)) {
      updates.call_status = "ringing";
    } else if (["answered", "in-progress"].includes(statusLower)) {
      updates.call_status = "connected";
    } else if (["completed", "hangup"].includes(statusLower)) {
      updates.call_status = "ended";
      updates.call_end_time = new Date().toISOString();
      const duration = parseInt(body.Duration || body.BillDuration || "0");
      if (duration) updates.call_duration = duration;
    } else if (["busy"].includes(statusLower)) {
      updates.call_status = "busy";
      updates.call_end_time = new Date().toISOString();
    } else if (["no-answer", "cancel"].includes(statusLower)) {
      updates.call_status = "no-answer";
      updates.call_end_time = new Date().toISOString();
    } else if (["failed"].includes(statusLower)) {
      updates.call_status = "failed";
      updates.call_end_time = new Date().toISOString();
    }

    // Recording URL
    const recordingUrl = body.RecordUrl || body.RecordingUrl || body.recording_url;
    if (recordingUrl) {
      updates.recording_url = recordingUrl;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("dialer_sessions").update(updates).eq("id", session.id);
    }

    // System event for terminal states
    if (["ended", "failed", "busy", "no-answer"].includes(updates.call_status)) {
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
