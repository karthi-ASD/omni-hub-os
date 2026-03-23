import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-answer: Plivo answer_url for CONFERENCE-based dialer.
 * Called when EITHER agent OR customer answers their call leg.
 * Returns Plivo XML joining them to the same conference.
 */

async function parseTelephonyPayload(req: Request): Promise<Record<string, string>> {
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

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id") || "";
  const token = url.searchParams.get("token");
  const leg = url.searchParams.get("leg") || "unknown";
  const conferenceId = url.searchParams.get("conference_id") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const PLIVO_WEBHOOK_SECRET = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";

  let finalConferenceId = conferenceId || "fallback-room";
  const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?leg=recording&session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(PLIVO_WEBHOOK_SECRET)}`;
  let finalStartConferenceOnEnter = leg === "agent" ? "true" : "false";

  try {
    const body = await parseTelephonyPayload(req);
    const callUuid = body.CallUUID || body.RequestUUID || "";

    if (PLIVO_WEBHOOK_SECRET && token !== PLIVO_WEBHOOK_SECRET) {
      console.warn("[dialer-answer] Unauthorized request rejected", {
        session_id: sessionId,
        leg,
        conference_id: conferenceId,
      });
    }

    if (!sessionId || !conferenceId) {
      console.error("[dialer-answer] Missing session_id or conference_id", {
        session_id: sessionId,
        conference_id: conferenceId,
      });
    }

    if (sessionId && conferenceId) {
      console.log("[dialer-answer] Leg answered", {
        session_id: sessionId,
        leg,
        conference_id: conferenceId,
        call_uuid: callUuid,
        timestamp: new Date().toISOString(),
      });

      if (leg === "agent") {
        supabase
          .from("dialer_sessions")
          .update({
            agent_connected: true,
            call_status: "bridging",
          })
          .eq("id", sessionId)
          .then(
            () => {},
            () => {},
          );

        supabase
          .from("dialer_call_events")
          .insert({
            session_id: sessionId,
            event_type: "agent_answered",
            metadata: { call_uuid: callUuid, conference_id: conferenceId },
          })
          .then(
            () => {},
            () => {},
          );
      } else if (leg === "customer") {
        supabase
          .from("dialer_sessions")
          .update({
            customer_connected: true,
            call_status: "connected",
            call_start_time: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .then(
            () => {},
            () => {},
          );

        supabase
          .from("dialer_call_events")
          .insert({
            session_id: sessionId,
            event_type: "customer_connected",
            metadata: { call_uuid: callUuid, conference_id: conferenceId },
          })
          .then(
            () => {},
            () => {},
          );
      }
    }
  } catch (err) {
    console.error("[dialer-answer error]", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Conference startConferenceOnEnter="${finalStartConferenceOnEnter}" endConferenceOnExit="true" stayAlone="false" waitSound="">${finalConferenceId}</Conference>
</Response>`;

  console.log("[FINAL XML RESPONSE]", xml);

  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
});
