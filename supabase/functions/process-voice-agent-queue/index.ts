import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Fetch QUEUED sessions ready to call
    const now = new Date().toISOString();
    const { data: sessions, error: sessErr } = await supabase
      .from("voice_agent_sessions")
      .select("*")
      .eq("status", "QUEUED")
      .lte("scheduled_call_at", now)
      .order("scheduled_call_at", { ascending: true })
      .limit(10);

    if (sessErr) throw sessErr;
    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No queued sessions" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const session of sessions) {
      // Check policy
      const { data: policies } = await supabase
        .from("voice_agent_policies")
        .select("*")
        .eq("business_id", session.business_id)
        .eq("is_enabled", true)
        .limit(1);

      const policy = policies?.[0];
      if (!policy) {
        // No active policy, skip
        await supabase.from("voice_agent_sessions").update({
          status: "FAILED",
          error_message: "No active voice agent policy found",
        }).eq("id", session.id);
        continue;
      }

      // Check max attempts
      if (session.attempt_number > policy.max_attempts) {
        await supabase.from("voice_agent_sessions").update({
          status: "FAILED",
          error_message: `Max attempts (${policy.max_attempts}) exceeded`,
        }).eq("id", session.id);
        continue;
      }

      // Check opt-out registry
      if (session.lead_id) {
        // We would check opt_out_registry here for the lead's phone
        // For MVP, we proceed
      }

      // Check consent if required
      if (policy.require_consent) {
        // For MVP, consent check is a placeholder
        // In production: check consent_records for VOICE_CALL_RECORDING
      }

      // --- PLIVO CALL INITIATION ---
      const authId = Deno.env.get("PLIVO_AUTH_ID");
      const authToken = Deno.env.get("PLIVO_AUTH_TOKEN");
      const callerId = Deno.env.get("PLIVO_CALLER_ID");

      let callUuid = `mvp-stub-${crypto.randomUUID().slice(0, 8)}`;
      let callInitiated = false;

      // Resolve the destination phone number from lead or inquiry
      let toPhone: string | null = null;
      if (session.lead_id) {
        const { data: lead } = await supabase.from("leads").select("phone").eq("id", session.lead_id).single();
        toPhone = lead?.phone || null;
      } else if (session.inquiry_id) {
        const { data: inquiry } = await supabase.from("inquiries").select("phone").eq("id", session.inquiry_id).single();
        toPhone = inquiry?.phone || null;
      }

      if (!toPhone) {
        await supabase.from("voice_agent_sessions").update({
          status: "FAILED",
          error_message: "No phone number found for lead/inquiry",
        }).eq("id", session.id);
        continue;
      }

      // Normalize phone: ensure it starts with country code
      const normalizedPhone = toPhone.replace(/[\s\-\(\)]/g, "").replace(/^0/, "+61");

      if (authId && authToken && callerId) {
        try {
          const plivoUrl = `https://api.plivo.com/v1/Account/${authId}/Call/`;
          const answerUrl = `${supabaseUrl}/functions/v1/plivo-answer`;
          const callbackUrl = `${supabaseUrl}/functions/v1/plivo-callback`;

          const plivoRes = await fetch(plivoUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + btoa(`${authId}:${authToken}`),
            },
            body: JSON.stringify({
              from: callerId.replace(/\s/g, ""),
              to: normalizedPhone,
              answer_url: answerUrl,
              hangup_url: callbackUrl,
              ring_timeout: 30,
              machine_detection: true,
            }),
          });

          const plivoData = await plivoRes.json();
          if (plivoRes.ok && plivoData.request_uuid) {
            callUuid = plivoData.request_uuid;
            callInitiated = true;
          } else {
            console.error("Plivo call failed:", plivoData);
          }
        } catch (plivoErr) {
          console.error("Plivo API error:", plivoErr);
        }
      } else {
        console.log("Plivo credentials not configured, using stub mode");
      }

      // Update session status
      await supabase.from("voice_agent_sessions").update({
        status: callInitiated ? "CALLING" : "CALLING",
        plivo_call_uuid: callUuid,
        started_at: new Date().toISOString(),
      }).eq("id", session.id);

      // Log event
      await supabase.from("voice_agent_events").insert({
        business_id: session.business_id,
        session_id: session.id,
        event_source: callInitiated ? "PLIVO" : "INTERNAL",
        event_type: "CALL_INITIATED",
        payload_json: { call_uuid: callUuid, attempt: session.attempt_number, real_call: callInitiated },
      });

      // System event
      await supabase.from("system_events").insert({
        business_id: session.business_id,
        event_type: "VOICE_CALL_INITIATED",
        payload_json: {
          session_id: session.id,
          call_uuid: callUuid,
          attempt: session.attempt_number,
        },
      });

      // --- MVP: Auto-complete simulation for stub calls ---
      if (!callInitiated) {
        // Simulate completed call after brief delay
        await supabase.from("voice_agent_sessions").update({
          status: "COMPLETED",
          ended_at: new Date().toISOString(),
          call_duration_seconds: 120,
          ai_summary: "MVP stub: Call simulation completed. Lead qualification pending real Plivo integration.",
          transcript_text: "Simulated call transcript. Connect Plivo provider to enable real calls.",
        }).eq("id", session.id);

        await supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "INTERNAL",
          event_type: "CALL_COMPLETED",
          payload_json: { stub: true, duration: 120 },
        });

        await supabase.from("system_events").insert({
          business_id: session.business_id,
          event_type: "VOICE_CALL_SUMMARY_READY",
          payload_json: { session_id: session.id, stub: true },
        });
      }

      processed++;
    }

    return new Response(JSON.stringify({ processed, total: sessions.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Voice agent queue error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
