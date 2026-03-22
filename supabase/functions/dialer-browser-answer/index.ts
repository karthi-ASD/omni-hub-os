import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-browser-answer: Plivo answer_url for BROWSER WebRTC dialer.
 * Called when the browser SDK places an outbound call.
 * Returns Plivo XML to dial the destination PSTN number.
 */

// Region-aware caller ID selection
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getCallerIdForNumber(number: string): string {
  if (number.startsWith("+91")) {
    return Deno.env.get("PLIVO_CALLER_ID_IN") || Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  if (number.startsWith("+61")) {
    return Deno.env.get("PLIVO_CALLER_ID_AU") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  if (number.startsWith("+1")) {
    return Deno.env.get("PLIVO_CALLER_ID_US") || Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
  }
  return Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
}

function normalizeDestination(raw: string): string {
  let destination = raw || "";
  if (destination.startsWith("sip:")) {
    destination = destination.replace(/^sip:/, "").split("@")[0];
  }
  if (destination && !destination.startsWith("+")) {
    destination = "+" + destination;
  }
  return destination.replace(/[^\d+]/g, "");
}

function buildXml(destination: string, callerId: string, sessionId: string) {
  const webhookSecret = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  // Recording callback — fires when recording is ready
  const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?leg=recording&session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(webhookSecret)}`;
  // Hangup callback — fires when call ends
  const hangupUrl = `${supabaseUrl}/functions/v1/dialer-webhook?leg=customer&session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(webhookSecret)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" callerId="${callerId}" record="true" recordingCallbackUrl="${recordingCallbackUrl}" recordingCallbackMethod="POST" action="${hangupUrl}" method="POST" ringTone="us">
    <Number>${destination}</Number>
  </Dial>
</Response>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const requestUrl = new URL(req.url);

    // Parse body — Plivo sends form-encoded or JSON
    let body: Record<string, string> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const json = await req.json();
        for (const [k, v] of Object.entries(json)) body[k] = String(v ?? "");
      } catch { /* ignore */ }
    } else {
      try {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
      } catch { /* ignore */ }
    }

    console.log("[DIALER_XML] Raw body keys:", Object.keys(body));
    console.log("[DIALER_XML] Raw body:", JSON.stringify(body));

    // Extract destination — Plivo WebRTC sends the dialed number in "To"
    // It may come as "sip:+61xxx@..." so we clean it
    let destination = requestUrl.searchParams.get("number") || body.To || body.to || body.ForwardTo || "";
    const callUuid = body.CallUUID || body.RequestUUID || "";
    const from = body.From || "";
    const direction = body.Direction || "";

    // Extract session ID from custom SIP headers
    const sessionId = body["X-PH-SessionId"] || body["X-Ph-Sessionid"] || 
                      body["X-PH-sessionid"] || body["X-Ph-SessionId"] || 
                      body["X-PH-SESSIONID"] || "";

    // Clean destination: strip sip: prefix and @domain
    destination = normalizeDestination(destination);

    console.log("[DIALER_XML] Parsed:", { destination, callUuid, from, direction, sessionId });
    console.log("PLIVO_ANSWER_HIT", destination);

    if (!destination || destination.length < 8) {
      console.error("[DIALER_XML] INVALID/MISSING destination:", { raw_to: body.To, destination });
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Speak>Unable to connect your call. Invalid destination.</Speak><Hangup reason="rejected" /></Response>`,
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" } }
      );
    }

    // Select region-aware caller ID
    const callerId = getCallerIdForNumber(destination);
    console.log("[DIALER_XML] CallerId:", callerId, "Destination:", destination);

    // Update session in DB if we have a session ID
    if (sessionId) {
      const { data: session } = await supabase
        .from("dialer_sessions")
        .select("provider_call_id, call_status")
        .eq("id", sessionId)
        .maybeSingle();

      const updates: Record<string, unknown> = {
        call_mode: "browser",
      };

      if (!session?.provider_call_id) {
        updates.provider_call_id = callUuid;
      }

      if (!session?.call_status || session.call_status === "initiating") {
        updates.call_status = "dialing";
      }

      supabase
        .from("dialer_sessions")
        .update(updates as never)
        .eq("id", sessionId)
        .then(() => {}, () => {});

      supabase
        .from("dialer_call_events")
        .insert({
          session_id: sessionId,
          event_type: session?.provider_call_id && session.provider_call_id !== callUuid ? "browser_answer_reinvoked" : "browser_answer_xml_served",
          metadata: {
            call_uuid: callUuid,
            destination,
            caller_id: callerId,
            direction,
            previous_provider_call_id: session?.provider_call_id || null,
            repeated_attempt: !!session?.provider_call_id && session.provider_call_id !== callUuid,
          },
        } as never)
        .then(() => {}, () => {});
    }

    // Return XML — bridge WebRTC to PSTN with recording enabled
    const xml = buildXml(destination, callerId, sessionId);

    console.log("[DIALER_XML] Returning XML:", xml);

    return new Response(xml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error("[DIALER_XML] Error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Speak>An error occurred connecting your call.</Speak><Hangup reason="rejected" /></Response>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" } }
    );
  }
});
