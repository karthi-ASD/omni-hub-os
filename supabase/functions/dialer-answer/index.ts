import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-answer: Plivo answer_url for CONFERENCE-based dialer.
 * Called when EITHER agent OR customer answers their call leg.
 * Returns Plivo XML joining them to the same conference.
 *
 * Conference architecture:
 * - dialer-initiate creates TWO separate calls (agent + customer)
 * - Both calls point answer_url to this function with leg=agent|customer
 * - Both get XML to join the same conference room
 * - Plivo handles audio bridging internally via conference
 * - Recording is handled by conference record attribute
 */

function hangupResponse(): Response {
  const hangupXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Hangup />\n</Response>`;
  return new Response(hangupXml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

async function parseTelephonyPayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) result[k] = String(v ?? "");
      return result;
    } catch { return {}; }
  }
  try {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text));
  } catch { return {}; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const PLIVO_WEBHOOK_SECRET = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const token = url.searchParams.get("token");
    const leg = url.searchParams.get("leg") || "unknown";
    const conferenceId = url.searchParams.get("conference_id") || "";

    // Token validation
    if (PLIVO_WEBHOOK_SECRET && token !== PLIVO_WEBHOOK_SECRET) {
      console.warn("[dialer-answer] Unauthorized request rejected");
      return hangupResponse();
    }

    const body = await parseTelephonyPayload(req);
    const callUuid = body.CallUUID || body.RequestUUID || "";

    if (!sessionId || !conferenceId) {
      console.error("[dialer-answer] Missing session_id or conference_id", { sessionId, conferenceId });
      return hangupResponse();
    }

    console.log("[dialer-answer] Leg answered", {
      session_id: sessionId,
      leg,
      conference_id: conferenceId,
      call_uuid: callUuid,
      timestamp: new Date().toISOString(),
    });

    // Build recording callback URL for conference
    const recordingParams = new URLSearchParams({
      session_id: sessionId,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "recording",
    });
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${recordingParams.toString()}`;

    // Update session state based on which leg answered — fire-and-forget to not delay XML
    if (leg === "agent") {
      supabase.from("dialer_sessions").update({
        agent_connected: true,
        call_status: "bridging",
      }).eq("id", sessionId).then(() => {}, () => {});

      supabase.from("dialer_call_events").insert({
        session_id: sessionId,
        event_type: "agent_answered",
        metadata: { call_uuid: callUuid, conference_id: conferenceId },
      }).then(() => {}, () => {});
    } else if (leg === "customer") {
      supabase.from("dialer_sessions").update({
        customer_connected: true,
        call_status: "connected",
        call_start_time: new Date().toISOString(),
      }).eq("id", sessionId).then(() => {}, () => {});

      supabase.from("dialer_call_events").insert({
        session_id: sessionId,
        event_type: "customer_connected",
        metadata: { call_uuid: callUuid, conference_id: conferenceId },
      }).then(() => {}, () => {});
    }

    // Return Conference XML — SAME for both legs
    const xml = `<Response>
  <Dial>
    <Conference startConferenceOnEnter="${leg === 'agent' ? 'true' : 'false'}" endConferenceOnExit="true" waitSound="" enterSound="" record="record-from-start" >
      ${conferenceId}
    </Conference>
  </Dial>
</Response>`;

    console.log("[FINAL XML RESPONSE]", xml);

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[dialer-answer] Error:", err);
    return xmlResponse("<Hangup />");
  }
});
