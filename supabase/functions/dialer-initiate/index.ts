import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// E.164 phone number formatter (AU default)
function formatToE164(phone: string): string | null {
  const digits = phone.replace(/[^0-9+]/g, "");
  // Already E.164
  if (/^\+[1-9]\d{6,14}$/.test(digits)) return digits;
  // Australian local (0X XXXX XXXX)
  if (/^0[2-9]\d{8}$/.test(digits)) return "+61" + digits.slice(1);
  // Raw digits that look like AU without leading 0
  if (/^[2-9]\d{8}$/.test(digits)) return "+61" + digits;
  // 10+ digits starting with country code without +
  if (/^[1-9]\d{9,14}$/.test(digits)) return "+" + digits;
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

    // HANGUP action — ONLY sends hangup request to Plivo, webhook handles all status updates
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

      // NO fallback status write — webhook is the single source of truth
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

    // Validate and format phone number to E.164
    const formattedPhone = formatToE164(session.phone_number);
    if (!formattedPhone) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Must be E.164 (e.g. +61412345678)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const plivoData = await plivoResp.json();

    if (!plivoResp.ok) {
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", session_id);
      return new Response(
        JSON.stringify({ error: "Plivo call failed", details: plivoData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerCallId = plivoData.request_uuid || plivoData.RequestUUID || null;

    // ONLY set provider_call_id and call_start_time — NO status write, webhook handles it
    await supabase
      .from("dialer_sessions")
      .update({
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
        phone_number: formattedPhone,
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
