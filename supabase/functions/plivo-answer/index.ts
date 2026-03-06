import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICE = "Polly.Nicole";
const LANG = "en-AU";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    let callUuid = "";
    let from = "";
    let to = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      callUuid = body.CallUUID || body.RequestUUID || "";
      from = body.From || "";
      to = body.To || "";
    } else {
      const body = await req.text();
      const params = new URLSearchParams(body);
      callUuid = params.get("CallUUID") || params.get("RequestUUID") || "";
      from = params.get("From") || "";
      to = params.get("To") || "";
    }

    console.log("plivo-answer - UUID:", callUuid);

    let session: any = null;
    let leadName = "there";
    let businessName = "Nextweb";
    let scriptIntro = "";

    if (callUuid) {
      // Find session by UUID or most recent CALLING
      const { data: sess } = await supabase
        .from("voice_agent_sessions")
        .select("*")
        .eq("plivo_call_uuid", callUuid)
        .single();
      session = sess;

      if (!session) {
        const { data: recentSess } = await supabase
          .from("voice_agent_sessions")
          .select("*")
          .in("status", ["CALLING", "IN_PROGRESS"])
          .order("started_at", { ascending: false })
          .limit(1);
        if (recentSess?.[0]) {
          session = recentSess[0];
          await supabase.from("voice_agent_sessions").update({
            plivo_call_uuid: callUuid,
          }).eq("id", session.id);
        }
      }

      if (session) {
        // Parallel fetch: lead name, business name, script — all at once
        const promises: Promise<any>[] = [];

        // Lead name
        if (session.lead_id) {
          promises.push(
            supabase.from("leads").select("name").eq("id", session.lead_id).single()
              .then(r => { if (r.data?.name) leadName = r.data.name; })
          );
        } else if (session.inquiry_id) {
          promises.push(
            supabase.from("inquiries").select("name").eq("id", session.inquiry_id).single()
              .then(r => { if (r.data?.name) leadName = r.data.name; })
          );
        }

        // Business name
        promises.push(
          supabase.from("businesses").select("name").eq("id", session.business_id).single()
            .then(r => { if (r.data?.name) businessName = r.data.name; })
        );

        // Script
        promises.push(
          supabase.from("ai_agent_scripts").select("intro_text")
            .eq("business_id", session.business_id).eq("is_default", true).limit(1)
            .then(r => {
              if (r.data?.[0]?.intro_text) {
                scriptIntro = r.data[0].intro_text;
              }
            })
        );

        await Promise.all(promises);

        // Replace placeholders in script
        if (scriptIntro) {
          scriptIntro = scriptIntro
            .replace("{lead_name}", leadName)
            .replace("{business_name}", businessName);
        }

        // Update status + log event in parallel
        await Promise.all([
          supabase.from("voice_agent_sessions").update({ status: "IN_PROGRESS" }).eq("id", session.id),
          supabase.from("voice_agent_events").insert({
            business_id: session.business_id,
            session_id: session.id,
            event_source: "PLIVO",
            event_type: "CALL_ANSWERED",
            payload_json: { from, to, call_uuid: callUuid },
          }),
        ]);
      }
    }

    // Short, punchy greeting — reduces time before the caller can speak
    const greeting = scriptIntro ||
      `Hi ${leadName}, this is Sarah from ${businessName}. Thanks for your interest! How can I help you today?`;

    const aiResponseUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

    const plivoXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${aiResponseUrl}" method="POST" inputType="speech" speechEndTimeout="2" speechModel="default" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${escapeXml(greeting)}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}">Sorry I missed that. We will follow up with you shortly. Goodbye!</Speak>
</Response>`;

    return new Response(plivoXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("plivo-answer error:", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Thanks for your interest. We will follow up shortly. Goodbye!</Speak>
</Response>`;
    return new Response(fallbackXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}