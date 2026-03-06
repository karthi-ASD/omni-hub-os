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
        const promises: Promise<any>[] = [];

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

        promises.push(
          supabase.from("businesses").select("name").eq("id", session.business_id).single()
            .then(r => { if (r.data?.name) businessName = r.data.name; })
        );

        promises.push(
          supabase.from("ai_agent_scripts").select("intro_text")
            .eq("business_id", session.business_id).eq("is_default", true).limit(1)
            .then(r => {
              if (r.data?.[0]?.intro_text) scriptIntro = r.data[0].intro_text;
            })
        );

        await Promise.all(promises);

        if (scriptIntro) {
          scriptIntro = scriptIntro
            .replace("{lead_name}", leadName)
            .replace("{business_name}", businessName);
        }

        // Fire-and-forget: status update + event log
        Promise.all([
          supabase.from("voice_agent_sessions").update({ status: "IN_PROGRESS" }).eq("id", session.id),
          supabase.from("voice_agent_events").insert({
            business_id: session.business_id,
            session_id: session.id,
            event_source: "PLIVO",
            event_type: "CALL_ANSWERED",
            payload_json: { from, to, call_uuid: callUuid },
          }),
        ]).catch(e => console.error("DB error:", e));
      }
    }

    // Short, warm, human greeting with SSML for natural prosody
    const greetingText = scriptIntro ||
      `Hi ${leadName}, this is Sarah from ${businessName}. How can I help you today?`;

    const aiResponseUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

    // SSML-enhanced speech for natural, warm, human-like delivery
    const ssmlGreeting = `<prosody rate="95%" volume="loud">${escapeXml(greetingText)}</prosody>`;

    const plivoXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${aiResponseUrl}" method="POST" inputType="speech" speechEndTimeout="auto" speechModel="command_and_search" executionTimeout="30" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${ssmlGreeting}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}"><prosody rate="95%">Sorry I missed that. We&#39;ll follow up shortly. Cheers!</prosody></Speak>
</Response>`;

    return new Response(plivoXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("plivo-answer error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Thanks for your interest. We&#39;ll be in touch shortly. Cheers!</Speak>
</Response>`, {
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