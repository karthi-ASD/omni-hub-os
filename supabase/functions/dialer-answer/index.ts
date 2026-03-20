import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-answer: Plivo answer_url for the human sales dialer.
 * Called when AGENT answers the outbound call.
 * Returns Plivo XML with <Dial> to bridge agent → customer.
 * Uses record-from-answer for full conversation recording.
 *
 * CRITICAL: Does NOT set call_status=connected here.
 * Only sets agent_connected=true and call_status=bridging.
 * Connected state is set by dialer-webhook when customer answers.
 */

// Reusable safe XML response helper
function xmlResponse(innerXml: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${innerXml}\n</Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

// E.164 normalizer focused on validating outbound dial targets
function normalizeToE164(phone: string): { valid: boolean; normalized: string; reason?: string } {
  if (!phone || typeof phone !== "string") {
    return { valid: false, normalized: "", reason: "empty_input" };
  }

  // Strip all non-digit characters except leading +
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 8) {
    return { valid: false, normalized: "", reason: "too_short" };
  }

  // Already E.164 with +
  if (hasPlus && digits.length >= 10 && digits.length <= 15) {
    return { valid: true, normalized: "+" + digits };
  }

  // India: 10 digits starting with 6-9 → +91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { valid: true, normalized: "+91" + digits };
  }

  // India: already has 91 prefix
  if (digits.startsWith("91") && digits.length >= 12 && digits.length <= 13) {
    return { valid: true, normalized: "+" + digits };
  }

  // AU: 0X → +61X
  if (digits.startsWith("0") && digits.length === 10) {
    return { valid: true, normalized: "+61" + digits.slice(1) };
  }

  // AU: already 61
  if (digits.startsWith("61") && digits.length >= 9 && digits.length <= 11) {
    return { valid: true, normalized: "+" + digits };
  }

  // US/CA: 1 + 10 digits
  if (digits.startsWith("1") && digits.length === 11) {
    return { valid: true, normalized: "+" + digits };
  }

  // UK
  if (digits.startsWith("44") && digits.length >= 10 && digits.length <= 12) {
    return { valid: true, normalized: "+" + digits };
  }

  // NZ
  if (digits.startsWith("64") && digits.length >= 9 && digits.length <= 11) {
    return { valid: true, normalized: "+" + digits };
  }

  // Fallback: if enough digits, trust it
  if (digits.length >= 10 && digits.length <= 15) {
    return { valid: true, normalized: "+" + digits };
  }

  return { valid: false, normalized: "", reason: "unrecognized_format" };
}

// Parse Plivo request body (supports JSON and form-urlencoded)
async function parseTelephonyPayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = await req.json();
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) {
        result[k] = String(v ?? "");
      }
      return result;
    } catch {
      return {};
    }
  }
  // Default: form-urlencoded
  try {
    const text = await req.text();
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return {};
  }
}

// Region-aware caller ID selection
function getCallerIdForNumber(number: string): { callerId: string; region: string; fallback: boolean } {
  if (number.startsWith("+91")) {
    const id = Deno.env.get("PLIVO_CALLER_ID_IN") || "";
    if (id) return { callerId: id, region: "IN", fallback: false };
    const fb = Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
    return { callerId: fb, region: "IN", fallback: true };
  }
  if (number.startsWith("+61")) {
    const id = Deno.env.get("PLIVO_CALLER_ID_AU") || Deno.env.get("PLIVO_CALLER_ID") || "";
    return { callerId: id, region: "AU", fallback: false };
  }
  if (number.startsWith("+1")) {
    const id = Deno.env.get("PLIVO_CALLER_ID_US") || "";
    if (id) return { callerId: id, region: "US", fallback: false };
    const fb = Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
    return { callerId: fb, region: "US", fallback: true };
  }
  if (number.startsWith("+44")) {
    const id = Deno.env.get("PLIVO_CALLER_ID_UK") || "";
    if (id) return { callerId: id, region: "UK", fallback: false };
  }
  if (number.startsWith("+64")) {
    const id = Deno.env.get("PLIVO_CALLER_ID_NZ") || "";
    if (id) return { callerId: id, region: "NZ", fallback: false };
  }
  const fb = Deno.env.get("PLIVO_CALLER_ID_DEFAULT") || Deno.env.get("PLIVO_CALLER_ID") || "";
  return { callerId: fb, region: "OTHER", fallback: true };
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

    // Token validation
    if (PLIVO_WEBHOOK_SECRET && token !== PLIVO_WEBHOOK_SECRET) {
      console.warn("[dialer-answer] Unauthorized request rejected");
      return xmlResponse("<Hangup />");
    }

    // Parse Plivo body
    const body = await parseTelephonyPayload(req);
    const callUuid = body.CallUUID || body.RequestUUID || "";

    if (!sessionId) {
      console.error("[dialer-answer] No session_id — returning hangup");
      return xmlResponse("<Hangup />");
    }

    // Fetch session for customer number
    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("phone_number, business_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr || !session || !session.phone_number) {
      console.error("[dialer-answer] Session not found or no phone", { sessionId, sessErr });
      return xmlResponse("<Hangup />");
    }

    // Normalize and validate customer number
    const phoneResult = normalizeToE164(session.phone_number);

    console.log("[dialer-answer] Phone normalization", {
      original: session.phone_number,
      normalized: phoneResult.normalized,
      valid: phoneResult.valid,
      reason: phoneResult.reason,
    });

    if (!phoneResult.valid) {
      console.error("[dialer-answer] Invalid customer number — aborting dial", {
        session_id: sessionId,
        original: session.phone_number,
        reason: phoneResult.reason,
      });
      // Mark session failed and log event
      await supabase.from("dialer_sessions").update({ call_status: "failed" }).eq("id", sessionId);
      await supabase.from("dialer_call_events").insert({
        session_id: sessionId,
        event_type: "invalid_number",
        metadata: { original: session.phone_number, reason: phoneResult.reason },
      }).catch(() => {});
      // Return empty valid XML (no dial attempt)
      return xmlResponse("");
    }

    const customerNumber = phoneResult.normalized;

    // Update session: agent connected, status = bridging (NOT connected)
    await supabase.from("dialer_sessions").update({
      agent_connected: true,
      call_status: "bridging",
    }).eq("id", sessionId);

    // Log agent_answered event (fire-and-forget)
    supabase.from("dialer_call_events").insert({
      session_id: sessionId,
      event_type: "agent_answered",
      metadata: { call_uuid: callUuid, customer_number: customerNumber },
    }).then(() => {}, () => {});

    // Build callback URLs
    const recordingParams = new URLSearchParams({
      session_id: sessionId,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "recording",
    });
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${recordingParams.toString()}`;

    const actionParams = new URLSearchParams({
      session_id: sessionId,
      token: PLIVO_WEBHOOK_SECRET,
      leg: "customer",
    });
    const actionUrl = `${supabaseUrl}/functions/v1/dialer-webhook?${actionParams.toString()}`;

    console.log("[dialer-answer] Returning Dial XML", {
      session_id: sessionId,
      customer_number: customerNumber,
      caller_id: PLIVO_CALLER_ID,
      action_url: actionUrl,
      recording_callback_url: recordingCallbackUrl,
    });

    // Return strict valid Plivo XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial
    callerId="${PLIVO_CALLER_ID}"
    timeout="20"
    action="${actionUrl}"
    method="POST"
    redirect="false"
    record="record-from-answer"
    recordingCallbackUrl="${recordingCallbackUrl}"
    recordingCallbackMethod="POST"
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
