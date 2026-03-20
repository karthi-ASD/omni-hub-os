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

  // Validate auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { session_id, action } = body;

    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HANGUP action — only sends hangup request to Plivo, webhook handles status update
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

      // Fallback: if Plivo doesn't send a webhook for hangup (e.g. call never connected),
      // mark ended only if still in a non-terminal state
      const terminalStates = ["ended", "failed", "busy", "no-answer"];
      if (!terminalStates.includes(session.call_status)) {
        await supabase
          .from("dialer_sessions")
          .update({
            call_status: "ended",
            call_end_time: new Date().toISOString(),
          })
          .eq("id", session_id);
      }

      return new Response(JSON.stringify({ status: "hangup_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // INITIATE CALL
    const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
    const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");
    const PLIVO_CALLER_ID = Deno.env.get("PLIVO_CALLER_ID");

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN || !PLIVO_CALLER_ID) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return new Response(
        JSON.stringify({ error: "Plivo credentials not configured. Please contact admin." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL FIX: Pass session_id in all callback URLs to avoid race condition
    const callbackBase = `${supabaseUrl}/functions/v1/dialer-webhook`;
    const callbackUrl = `${callbackBase}?session_id=${session_id}`;

    // Make Plivo outbound call
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
          to: session.phone_number,
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

    const plivoData = await plivoResp.json();

    if (!plivoResp.ok) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return new Response(
        JSON.stringify({ error: "Plivo call failed", details: plivoData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerCallId = plivoData.request_uuid || plivoData.RequestUUID || null;

    // Only set provider_call_id and call_start_time — status updates come from webhook
    await supabase
      .from("dialer_sessions")
      .update({
        call_status: "ringing",
        provider_call_id: providerCallId,
        call_start_time: new Date().toISOString(),
      })
      .eq("id", session_id);

    // Log system event
    await supabase.from("system_events").insert({
      business_id: session.business_id,
      event_type: "DIALER_CALL_INITIATED",
      payload_json: {
        session_id,
        phone_number: session.phone_number,
        provider_call_id: providerCallId,
        user_id: session.user_id,
      },
    });

    return new Response(
      JSON.stringify({ status: "ok", provider_call_id: providerCallId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Dialer initiate error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
