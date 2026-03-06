import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, from } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const username = Deno.env.get("MX_GLOBAL_USERNAME");
    const password = Deno.env.get("MX_GLOBAL_PASSWORD");

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "MX Global credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SMSGlobal / MX Global HTTP API
    const smsUrl = new URL("https://api.smsglobal.com/http-api.php");
    smsUrl.searchParams.set("action", "sendsms");
    smsUrl.searchParams.set("user", username);
    smsUrl.searchParams.set("password", password);
    smsUrl.searchParams.set("from", from || "NextWebOS");
    smsUrl.searchParams.set("to", to.replace(/[\s+]/g, ""));
    smsUrl.searchParams.set("text", message);

    const smsRes = await fetch(smsUrl.toString());
    const smsText = await smsRes.text();

    console.log("MX Global SMS response:", smsText);

    // Log the send in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract business_id from auth if available
    const authHeader = req.headers.get("authorization");
    let businessId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("user_id", user.id)
          .single();
        businessId = profile?.business_id;
      }
    }

    if (businessId) {
      await supabase.from("communications_sends").insert({
        business_id: businessId,
        channel: "SMS",
        provider_type: "MX Global",
        to_address: to,
        status: smsRes.ok ? "sent" : "failed",
      });
    }

    return new Response(
      JSON.stringify({
        success: smsRes.ok,
        response: smsText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SMS send error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
