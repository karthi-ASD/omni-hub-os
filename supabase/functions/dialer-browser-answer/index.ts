import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-browser-answer: Plivo answer_url for BROWSER WebRTC dialer.
 * Called when the browser SDK places an outbound call.
 * Returns Plivo XML to dial the destination PSTN number.
 *
 * Flow:
 * 1. Browser SDK calls client.call(destination, extraHeaders)
 * 2. Plivo triggers this answer_url
 * 3. We return XML: <Response><Dial callerId="..."><Number>destination</Number></Dial></Response>
 * 4. Plivo bridges WebRTC leg (browser) to PSTN leg (destination)
 */

async function parsePayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) result[k] = String(v ?? "");
      return result;
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
    const body = await parsePayload(req);

    // Extract call info from Plivo POST
    const to = body.To || "";
    const from = body.From || "";
    const callUuid = body.CallUUID || body.RequestUUID || "";
    const direction = body.Direction || "";

    // Extract session ID from custom SIP header (X-PH- prefix)
    // Plivo passes custom headers with various casing
    const sessionId = body["X-PH-SessionId"] || body["X-Ph-Sessionid"] || body["X-PH-sessionid"] || 
                      body["X-Ph-SessionId"] || body["X-PH-SESSIONID"] || "";

    console.log("[DIALER_XML] Incoming request body", JSON.stringify(body));
    console.log("[DIALER_XML] Parsed fields", { to, from, callUuid, direction, sessionId, allKeys: Object.keys(body) });

    // Clean destination number (remove sip: prefix if present)
    let destination = to;
    if (destination.startsWith("sip:")) {
      destination = destination.replace(/^sip:/, "").split("@")[0];
    }
    // Ensure E.164 format
    if (destination && !destination.startsWith("+")) {
      destination = "+" + destination;
    }

    if (!destination || destination.length < 8) {
      console.error("[dialer-browser-answer] Invalid destination", { to, destination });
      const xml = `<Response><Hangup reason="rejected" /></Response>`;
      return new Response(xml, { status: 200, headers: { "Content-Type": "text/xml" } });
    }

    // Select region-aware caller ID
    const callerId = getCallerIdForNumber(destination);
    console.log("[DIALER_XML] Caller ID selected", { destination, callerId });

    // Update session in DB if we have a session ID
    if (sessionId) {
      supabase
        .from("dialer_sessions")
        .update({
          provider_call_id: callUuid,
          call_status: "ringing",
          call_mode: "browser",
        } as any)
        .eq("id", sessionId)
        .then(() => {}, () => {});

      supabase
        .from("dialer_call_events")
        .insert({
          session_id: sessionId,
          event_type: "browser_call_answered",
          metadata: { call_uuid: callUuid, destination, caller_id: callerId, direction },
        } as any)
        .then(() => {}, () => {});
    }

    // Return XML to dial the destination
    const xml = `<Response>
  <Dial
    callerId="${callerId}"
    answerOnBridge="true"
    timeout="30"
  >
    <Number>${destination}</Number>
  </Dial>
</Response>`;

    console.log("[dialer-browser-answer] XML Response", xml);

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[dialer-browser-answer] Error:", err);

    // Fallback — hangup cleanly
    const xml = `<Response><Hangup reason="rejected" /></Response>`;
    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
});
