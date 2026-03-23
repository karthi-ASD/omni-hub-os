import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-browser-answer: Plivo answer_url for BROWSER WebRTC dialer.
 * Called when the browser SDK places an outbound call.
 * Returns Plivo XML to dial the destination PSTN number.
 */

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

// STATIC_XML_TEST: Set to true to bypass all dynamic logic and return hardcoded XML
// This isolates whether the issue is in our logic vs Plivo app config
const STATIC_XML_TEST = false;

/** Escape a string for use inside an XML attribute value */
function escapeXmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape a string for use as XML text content */
function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildXml(destination: string, callerId: string, sessionId: string) {
  const webhookSecret = Deno.env.get("PLIVO_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?leg=recording&session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(webhookSecret)}`;
  const hangupUrl = `${supabaseUrl}/functions/v1/dialer-webhook?leg=customer&session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(webhookSecret)}`;

  // SELF-CALL DETECTION: If caller ID equals destination, Plivo will return BUSY instantly
  if (callerId === destination) {
    console.warn("SELF_CALL_DETECTED", { callerId, destination, sessionId, warning: "Caller ID equals destination — carrier will likely return BUSY" });
  }

  // Log exact XML inputs for debugging
  console.log("XML_DIAL_CALLER_ID", { callerId, callerIdLength: callerId.length });
  console.log("XML_DIAL_DESTINATION", { destination, destinationLength: destination.length });
  console.log("XML_ACTION_URL", hangupUrl);
  console.log("XML_RECORDING_CALLBACK_URL", recordingCallbackUrl);

  // XML-escape ALL dynamic values to prevent invalid XML (& must be &amp; in attributes)
  const safeCallerId = escapeXmlAttr(callerId);
  const safeRecordingUrl = escapeXmlAttr(recordingCallbackUrl);
  const safeHangupUrl = escapeXmlAttr(hangupUrl);
  const safeDestination = escapeXmlText(destination);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${safeCallerId}" answerOnBridge="true" record="true" recordFileFormat="mp3" recordingCallbackUrl="${safeRecordingUrl}" recordingCallbackMethod="POST" action="${safeHangupUrl}" method="POST">
    <Number>${safeDestination}</Number>
  </Dial>
</Response>`;

  // Basic XML well-formedness check
  if (xml.includes('&session_id=') || xml.includes('&token=')) {
    console.error("XML_VALIDATION_FAILED", { reason: "Unescaped & found in XML output" });
  } else {
    console.log("XML_VALIDATION_PASSED");
  }

  return xml;
}

function buildStaticTestXml(destination: string, callerId: string) {
  // Minimal Plivo XML — no webhooks, no recording, no extras
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escapeXmlAttr(callerId)}">
    <Number>${escapeXmlText(destination)}</Number>
  </Dial>
</Response>`;
}

function buildSafeExitXml(message = "This call attempt is no longer valid.") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>${escapeXmlText(message)}</Speak>
  <Hangup reason="rejected" />
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

    let body: Record<string, string> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const json = await req.json();
        for (const [k, v] of Object.entries(json)) body[k] = String(v ?? "");
      } catch {
        // ignore malformed JSON
      }
    } else {
      try {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
      } catch {
        // ignore malformed form body
      }
    }

    let destination = requestUrl.searchParams.get("number") || body.To || body.to || body.ForwardTo || "";
    const callUuid = body.CallUUID || body.RequestUUID || "";
    const from = body.From || "";
    const direction = body.Direction || "";
    const sessionId = body["X-PH-SessionId"] || body["X-Ph-Sessionid"] || body["X-PH-sessionid"] || body["X-Ph-SessionId"] || body["X-PH-SESSIONID"] || "";

    destination = normalizeDestination(destination);

    console.log("ANSWER_FUNCTION_INVOKED", { sessionId, destination, from, direction });
    console.log("CALL_UUID_RECEIVED", { sessionId, callUuid });

    if (!destination || destination.length < 8) {
      console.error("[DIALER_XML] INVALID/MISSING destination", { raw_to: body.To, destination, sessionId, callUuid });
      return new Response(buildSafeExitXml("Unable to connect your call. Invalid destination."), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const callerId = getCallerIdForNumber(destination);
    console.log("[DIALER_XML] CallerId", { callerId, callerIdEmpty: !callerId, destination, sessionId, callUuid });

    if (!callerId) {
      console.error("CALLER_ID_MISSING", { destination, sessionId, callUuid, envKeys: {
        PLIVO_CALLER_ID_AU: !!Deno.env.get("PLIVO_CALLER_ID_AU"),
        PLIVO_CALLER_ID_IN: !!Deno.env.get("PLIVO_CALLER_ID_IN"),
        PLIVO_CALLER_ID_DEFAULT: !!Deno.env.get("PLIVO_CALLER_ID_DEFAULT"),
        PLIVO_CALLER_ID: !!Deno.env.get("PLIVO_CALLER_ID"),
      }});
      return new Response(buildSafeExitXml("No caller ID configured for this destination."), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    let session: { provider_call_id: string | null; call_status: string | null } | null = null;
    if (sessionId) {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("provider_call_id, call_status")
        .eq("id", sessionId)
        .maybeSingle();
      session = data;
    }

    const providerCallIdBefore = session?.provider_call_id || null;
    const isDuplicateCall = !!providerCallIdBefore && !!callUuid && providerCallIdBefore !== callUuid;
    const isReentry = isDuplicateCall;

    console.log("SESSION_PROVIDER_CALL_ID_BEFORE", { sessionId, provider_call_id: providerCallIdBefore });
    console.log("IS_DUPLICATE_CALL", { sessionId, callUuid, isDuplicateCall });
    console.log("IS_REENTRY", { sessionId, callUuid, isReentry });

    if (isDuplicateCall) {
      console.warn("DUPLICATE_PROVIDER_CALL_IGNORED", {
        sessionId,
        callUuid,
        existingProviderCallId: providerCallIdBefore,
      });
      console.warn("ANSWER_REENTRY_DETECTED", {
        sessionId,
        callUuid,
        existingProviderCallId: providerCallIdBefore,
      });

      try {
        await supabase.from("dialer_call_events").insert({
          session_id: sessionId,
          event_type: "duplicate_provider_call_ignored",
          metadata: {
            call_uuid: callUuid,
            existing_provider_call_id: providerCallIdBefore,
            destination,
            caller_id: callerId,
            direction,
            is_duplicate_call: true,
            is_reentry: true,
          },
        } as never);
      } catch {
        // ignore logging failure
      }

      return new Response(buildSafeExitXml("Duplicate call attempt ignored."), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const updates: Record<string, unknown> = {
      call_mode: "browser",
    };

    if (!providerCallIdBefore && callUuid) {
      updates.provider_call_id = callUuid;
    }

    if (!session?.call_status || session.call_status === "initiating") {
      updates.call_status = "dialing";
    }

    if (sessionId && Object.keys(updates).length > 0) {
      await supabase
        .from("dialer_sessions")
        .update(updates as never)
        .eq("id", sessionId);
    }

    const providerCallIdAfter = (updates.provider_call_id as string | undefined) || providerCallIdBefore;
    console.log("SESSION_PROVIDER_CALL_ID_AFTER", { sessionId, provider_call_id: providerCallIdAfter || null });

    if (sessionId) {
      try {
        await supabase.from("dialer_call_events").insert({
          session_id: sessionId,
          event_type: "browser_answer_xml_served",
          metadata: {
            call_uuid: callUuid,
            destination,
            caller_id: callerId,
            direction,
            previous_provider_call_id: providerCallIdBefore,
            current_provider_call_id: providerCallIdAfter || null,
            is_duplicate_call: false,
            is_reentry: false,
          },
        } as never);
      } catch {
        // ignore logging failure
      }
    }

    // Choose between static test XML or full dynamic XML
    const xml = STATIC_XML_TEST
      ? buildStaticTestXml(destination, callerId)
      : buildXml(destination, callerId, sessionId);

    // CRITICAL: Log the EXACT XML being returned to Plivo
    console.log("FINAL_XML_OUTPUT", xml);
    console.log("FINAL_XML_META", {
      sessionId,
      callUuid,
      destination,
      callerId,
      callerIdEmpty: !callerId,
      callerIdLength: callerId.length,
      destinationLength: destination.length,
      staticTestMode: STATIC_XML_TEST,
      provider_call_id: providerCallIdAfter || null,
    });

    return new Response(xml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[DIALER_XML] Error", err);
    return new Response(buildSafeExitXml("An error occurred connecting your call."), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml; charset=utf-8" },
    });
  }
});