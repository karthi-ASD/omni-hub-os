import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;

  try {
    const body = await req.json();
    const to = body.to || "+919894806302";
    const message = body.message || "👋 Hello! This is a test message from NextWeb OS. If you received this, WhatsApp integration is working! ✅";

    // Send directly via Meta Graph API
    const recipientPhone = to.replace(/[\s\-()]/g, "");
    const graphUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const waPayload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: message },
    };

    console.log(`Sending WhatsApp message to ${recipientPhone}...`);

    const waRes = await fetch(graphUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(waPayload),
    });

    const waData = await waRes.json();
    console.log("WhatsApp API response:", JSON.stringify(waData));

    const waMessageId = waData?.messages?.[0]?.id || null;
    const success = waRes.ok && !!waMessageId;

    // Log to DB
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("communications_sends").insert({
      business_id: "dde43875-0539-49d4-a39e-6820f110d9c5",
      channel: "WhatsApp",
      provider_type: "Meta Cloud API",
      to_address: recipientPhone,
      status: success ? "sent" : "failed",
    });

    return new Response(
      JSON.stringify({ success, message_id: waMessageId, api_response: waData }),
      { status: success ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Test send error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
