import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Failsafe: mark sessions stuck in non-terminal states for >5 minutes as "failed"
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Find stuck sessions
    const { data: stale, error } = await supabase
      .from("dialer_sessions")
      .select("id, call_status, business_id, phone_number")
      .in("call_status", ["idle", "initiating", "ringing", "connected"])
      .lt("created_at", cutoff);

    if (error) {
      console.error("Stale session query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = stale?.length || 0;
    console.log(`[dialer-stale-cleanup] Found ${count} stale sessions`);

    for (const session of stale || []) {
      await supabase
        .from("dialer_sessions")
        .update({
          call_status: "failed",
          call_end_time: new Date().toISOString(),
        })
        .eq("id", session.id);

      await supabase.from("dialer_call_events").insert({
        session_id: session.id,
        event_type: "stale_cleanup",
        metadata: { previous_status: session.call_status, reason: "stuck_timeout" },
      });

      await supabase.from("system_events").insert({
        business_id: session.business_id,
        event_type: "DIALER_STALE_CLEANUP",
        payload_json: {
          session_id: session.id,
          phone_number: session.phone_number,
          stuck_status: session.call_status,
        },
      });
    }

    return new Response(JSON.stringify({ status: "ok", cleaned: count }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Dialer stale cleanup error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
