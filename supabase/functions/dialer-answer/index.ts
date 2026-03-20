import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-answer: Plivo answer_url for the human sales dialer.
 * Returns Plivo XML that BRIDGES the agent to the customer via <Dial>.
 * Uses record-from-answer to capture full conversation.
 */

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
  const PLIVO_CALLER_ID = Deno.env.get("PLIVO_CALLER_ID") || "";
  const PLIVO_WEBHOOK_SECRET = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const token = url.searchParams.get("token");
    const expected = Deno.env.get("PLIVO_WEBHOOK_SECRET");

    // Token validation
    if (expected && token !== expected) {
      console.warn("[dialer-answer] Unauthorized request rejected");
      return xmlResponse("<Hangup />");
    }

    // Parse body (Plivo sends form-urlencoded)
    let callUuid = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      callUuid = body.CallUUID || body.RequestUUID || "";
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      callUuid = params.get("CallUUID") || params.get("RequestUUID") || "";
    }

    console.log("[dialer-answer] Call answered", { session_id: sessionId, call_uuid: callUuid });

    if (!sessionId) {
      console.error("[dialer-answer] No session_id — cannot bridge");
      return xmlResponse("<Hangup />");
    }

    // Fetch customer number from session
    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("phone_number, call_start_time, business_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr || !session || !session.phone_number) {
      console.error("[dialer-answer] Session not found or no phone", { sessionId, sessErr });
      return xmlResponse("<Hangup />");
    }

    const customerNumber = session.phone_number;
    console.log("[dialer-answer] Answer XML triggered", {
      session_id: sessionId,
      customer_number: customerNumber,
      caller_id: PLIVO_CALLER_ID,
    });

    // Update session: agent connected, call starting
    const updates: Record<string, any> = {
      call_status: "connected",
      agent_connected: true,
    };
    if (!session.call_start_time) {
      updates.call_start_time = new Date().toISOString();
    }
    await supabase.from("dialer_sessions").update(updates).eq("id", sessionId);

    // Log event
    if (session.business_id) {
      await supabase.from("dialer_call_events").insert({
        session_id: sessionId,
        event_type: "call_answered",
        metadata: { call_uuid: callUuid, customer_number: customerNumber },
      }).then(() => {}, () => {});
    }

    // Build recording callback URL
    const webhookQuery = new URLSearchParams({
      session_id: sessionId,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "recording",
    });
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${webhookQuery.toString()}`;

    // Build action URL (called when Dial completes — customer hangs up or timeout)
    const actionQuery = new URLSearchParams({
      session_id: sessionId,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "customer",
    });
    const actionUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${actionQuery.toString()}`;

    console.log("[dialer-answer] Returning Dial XML", {
      session_id: sessionId,
      customer_number: customerNumber,
      recording_callback: recordingCallbackUrl,
    });

    // Full Dial XML with recording and callbacks
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial
    callerId="${PLIVO_CALLER_ID}"
    timeout="30"
    record="true"
    recordingCallbackUrl="${recordingCallbackUrl}"
    recordingCallbackMethod="POST"
    action="${actionUrl}"
    method="POST"
    hangupOnStar="false"
  >
    <Number>${customerNumber}</Number>
  </Dial>
</Response>`;

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[dialer-answer] Error:", err);
    return xmlResponse("<Hangup />");
  }
});

function xmlResponse(inner: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${inner}\n</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
