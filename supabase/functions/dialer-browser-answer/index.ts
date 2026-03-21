import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-browser-answer: Plivo answer_url for BROWSER WebRTC dialer.
 * Called when the browser SDK places an outbound call.
 * Returns Plivo XML to dial the destination PSTN number.
 */

// Region-aware caller ID selection
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

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
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
    let destination = body.To || body.to || body.ForwardTo || "";
    const callUuid = body.CallUUID || body.RequestUUID || "";
    const from = body.From || "";
    const direction = body.Direction || "";

    // Extract session ID from custom SIP headers
    const sessionId = body["X-PH-SessionId"] || body["X-Ph-Sessionid"] || 
                      body["X-PH-sessionid"] || body["X-Ph-SessionId"] || 
                      body["X-PH-SESSIONID"] || "";

    // Clean destination: strip sip: prefix and @domain
    if (destination.startsWith("sip:")) {
      destination = destination.replace(/^sip:/, "").split("@")[0];
    }
    // Ensure E.164
    if (destination && !destination.startsWith("+")) {
      destination = "+" + destination;
    }
    // Strip any non-phone characters except +
    destination = destination.replace(/[^\d+]/g, "");

    console.log("[DIALER_XML] Parsed:", { destination, callUuid, from, direction, sessionId });

    if (!destination || destination.length < 8) {
      console.error("[DIALER_XML] INVALID/MISSING destination:", { raw_to: body.To, destination });
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Speak>Unable to connect your call. Invalid destination.</Speak><Hangup reason="rejected" /></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // Select region-aware caller ID
    const callerId = getCallerIdForNumber(destination);
    console.log("[DIALER_XML] CallerId:", callerId, "Destination:", destination);

    // Update session in DB if we have a session ID
    if (sessionId) {
      supabase
        .from("dialer_sessions")
        .update({
          provider_call_id: callUuid,
          call_status: "ringing",
          call_mode: "browser",
        } as never)
        .eq("id", sessionId)
        .then(() => {}, () => {});

      supabase
        .from("dialer_call_events")
        .insert({
          session_id: sessionId,
          event_type: "browser_call_answered",
          metadata: { call_uuid: callUuid, destination, caller_id: callerId, direction },
        } as never)
        .then(() => {}, () => {});
    }

    // Return XML — bridge WebRTC to PSTN
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}" answerOnBridge="true" ringTone="us" timeout="30">
    <Number>${destination}</Number>
  </Dial>
</Response>`;

    console.log("[DIALER_XML] Returning XML:", xml);

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[DIALER_XML] Error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Speak>An error occurred connecting your call.</Speak><Hangup reason="rejected" /></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
});
