import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plivo-supported Australian English female voice
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
    // Parse Plivo webhook (form-encoded or JSON)
    let callUuid = "";
    let from = "";
    let to = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      callUuid = body.CallUUID || body.RequestUUID || "";
      from = body.From || "";
      to = body.To || "";
      console.log("plivo-answer JSON body:", JSON.stringify(body));
    } else {
      const body = await req.text();
      const params = new URLSearchParams(body);
      callUuid = params.get("CallUUID") || params.get("RequestUUID") || "";
      from = params.get("From") || "";
      to = params.get("To") || "";
      console.log("plivo-answer form body:", body);
    }

    console.log("plivo-answer called - CallUUID:", callUuid, "From:", from, "To:", to);

    // Find the session for this call — try by plivo_call_uuid first, then by phone number
    let session: any = null;
    let leadName = "there";
    let businessName = "Nextweb";
    let scriptIntro = "";

    if (callUuid) {
      // Try exact UUID match
      const { data: sess } = await supabase
        .from("voice_agent_sessions")
        .select("*")
        .eq("plivo_call_uuid", callUuid)
        .single();
      session = sess;

      // If no match, try finding by status IN_PROGRESS or CALLING (most recent)
      if (!session) {
        console.log("No session found by UUID, trying recent CALLING session");
        const { data: recentSess } = await supabase
          .from("voice_agent_sessions")
          .select("*")
          .in("status", ["CALLING", "IN_PROGRESS"])
          .order("started_at", { ascending: false })
          .limit(1);
        if (recentSess?.[0]) {
          session = recentSess[0];
          // Update the session with the actual call UUID from Plivo
          await supabase.from("voice_agent_sessions").update({
            plivo_call_uuid: callUuid,
          }).eq("id", session.id);
          console.log("Matched to recent session:", session.id);
        }
      }

      if (session) {
        // Get lead name
        if (session.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("name, service_interest")
            .eq("id", session.lead_id)
            .single();
          if (lead?.name) leadName = lead.name;
        } else if (session.inquiry_id) {
          const { data: inq } = await supabase
            .from("inquiries")
            .select("name, service")
            .eq("id", session.inquiry_id)
            .single();
          if (inq?.name) leadName = inq.name;
        }

        // Get business name
        const { data: biz } = await supabase
          .from("businesses")
          .select("name")
          .eq("id", session.business_id)
          .single();
        if (biz?.name) businessName = biz.name;

        // Check for a custom script
        const { data: scripts } = await supabase
          .from("ai_agent_scripts")
          .select("intro_text")
          .eq("business_id", session.business_id)
          .eq("is_default", true)
          .limit(1);
        if (scripts?.[0]?.intro_text) {
          scriptIntro = scripts[0].intro_text
            .replace("{lead_name}", leadName)
            .replace("{business_name}", businessName);
        }

        // Update session status
        await supabase.from("voice_agent_sessions").update({
          status: "IN_PROGRESS",
        }).eq("id", session.id);

        // Log event
        await supabase.from("voice_agent_events").insert({
          business_id: session.business_id,
          session_id: session.id,
          event_source: "PLIVO",
          event_type: "CALL_ANSWERED",
          payload_json: { from, to, call_uuid: callUuid },
        });
      } else {
        console.log("WARNING: No session found for call UUID:", callUuid);
      }
    }

    const greeting = scriptIntro ||
      `Hello ${leadName}! This is an AI assistant calling from ${businessName}. Thank you for your interest in our services. How can I assist you today?`;

    const aiResponseUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

    console.log("Returning greeting XML, aiResponseUrl:", aiResponseUrl);
    console.log("Greeting text:", greeting);

    // Return Plivo XML — speak greeting then listen for speech input
    const plivoXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${aiResponseUrl}" method="POST" inputType="speech" speechEndTimeout="3" speechModel="default" profanityFilter="false" log="true" language="${LANG}">
    <Speak voice="${VOICE}" language="${LANG}">${escapeXml(greeting)}</Speak>
  </GetInput>
  <Speak voice="${VOICE}" language="${LANG}">I didn't catch that. Thank you for your time, and we'll follow up with you shortly. Goodbye!</Speak>
</Response>`;

    return new Response(plivoXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("Plivo answer error:", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${VOICE}" language="${LANG}">Thank you for your interest. One of our team members will follow up with you shortly. Goodbye!</Speak>
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
    .replace(/'/g, "&apos;");
}