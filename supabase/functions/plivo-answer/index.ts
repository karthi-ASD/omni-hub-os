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
    // Plivo sends form-encoded or JSON data
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

    // Find the session for this call
    let session: any = null;
    let leadName = "there";
    let businessName = "our team";
    let scriptIntro = "";

    if (callUuid) {
      const { data: sess } = await supabase
        .from("voice_agent_sessions")
        .select("*")
        .eq("plivo_call_uuid", callUuid)
        .single();
      session = sess;

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
      }
    }

    const greeting = scriptIntro ||
      `Hello ${leadName}! This is an AI assistant calling from ${businessName}. Thank you for your interest in our services. I'd love to help you with any questions you might have. How can I assist you today?`;

    const aiResponseUrl = `${supabaseUrl}/functions/v1/plivo-ai-response`;

    // Return Plivo XML that speaks a greeting then listens for speech
    const plivoXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <GetInput action="${aiResponseUrl}" method="POST" inputType="speech" speechEndTimeout="2500" speechModel="enhanced" profanityFilter="false" log="true">
    <Speak voice="Polly.Joanna" language="en-US">${escapeXml(greeting)}</Speak>
  </GetInput>
  <Speak voice="Polly.Joanna" language="en-US">I didn't catch that. Thank you for your time, and we'll follow up with you shortly. Goodbye!</Speak>
</Response>`;

    return new Response(plivoXml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    console.error("Plivo answer error:", err);
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="Polly.Joanna">Thank you for your interest. One of our team members will follow up with you shortly. Goodbye!</Speak>
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
