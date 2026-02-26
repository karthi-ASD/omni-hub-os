import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const { api_key, name, email, phone, suburb, message, service_interest, source, channel, landing_page_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = body;

    if (!api_key || !name || !email) {
      return new Response(JSON.stringify({ error: "api_key, name, and email are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find business by API key in settings
    const { data: setting } = await supabase
      .from("settings")
      .select("business_id")
      .eq("key", "public_inquiry_api_key")
      .eq("value", api_key)
      .single();

    if (!setting) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const business_id = setting.business_id;

    // Simple spam check
    const linkCount = (message || "").match(/https?:\/\//gi)?.length || 0;
    const isSpam = linkCount > 3 || !phone;

    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert({
        business_id,
        source: source || "website_form",
        channel: channel || "unknown",
        landing_page_url: landing_page_url || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        name,
        email,
        phone: phone || null,
        suburb: suburb || null,
        message: message || null,
        service_interest: service_interest || null,
        status: isSpam ? "spam" : "new",
      })
      .select("id")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Write system event
    await supabase.from("system_events").insert({
      business_id,
      event_type: "INQUIRY_CREATED",
      payload_json: { entity_type: "inquiry", entity_id: inquiry.id, short_message: `New inquiry from ${name}` },
    });

    return new Response(JSON.stringify({ id: inquiry.id, status: isSpam ? "spam" : "new" }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
