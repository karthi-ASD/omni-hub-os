import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * dialer-answer: Plivo answer_url for the human sales dialer.
 * Returns Plivo XML that keeps the call alive (recording + wait).
 * This is NOT the AI voice agent — this is for human-to-human calls.
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

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const token = url.searchParams.get("token");
    const expected = Deno.env.get("PLIVO_WEBHOOK_SECRET");

    // Token validation
    if (expected && token !== expected) {
      console.warn("[dialer-answer] Unauthorized request rejected");
      // Still return valid XML to avoid Plivo errors
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

    // Update session status to connected
    if (sessionId) {
      const updates: Record<string, any> = {
        call_status: "connected",
      };
      // Only set call_start_time if not already set
      const { data: session } = await supabase
        .from("dialer_sessions")
        .select("call_start_time, business_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (session && !session.call_start_time) {
        updates.call_start_time = new Date().toISOString();
      }

      await supabase.from("dialer_sessions").update(updates).eq("id", sessionId);

      // Log event
      if (session?.business_id) {
        await supabase.from("dialer_call_events").insert({
          session_id: sessionId,
          event_type: "call_answered",
          metadata: { call_uuid: callUuid },
        }).catch(() => {});
      }
    }

    // Build the hangup callback URL for when the call ends
    const webhookBase = `${supabaseUrl}/functions/v1/dialer-webhook`;
    const webhookUrl = `${webhookBase}?session_id=${sessionId}&token=${token || ""}`;

    // Return Plivo XML that:
    // 1. Keeps the call alive with a long Wait (up to 1 hour)
    // 2. The call ends when either party hangs up
    // 3. Recording is handled by the call creation params (record=true in dialer-initiate)
    return xmlResponse(
      `<Wait length="3600" silence="true" minSilence="30" />`
    );
  } catch (err) {
    console.error("[dialer-answer] Error:", err);
    // On error, still return valid XML to not crash the call
    return xmlResponse(`<Wait length="3600" silence="true" />`);
  }
});

function xmlResponse(inner: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${inner}\n</Response>`;
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
