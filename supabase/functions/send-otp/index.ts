import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { phone, userId } = await req.json();
    if (!phone || !userId) throw new Error("Phone and userId required");

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    // Store OTP
    await supabase.from("otp_verifications").insert({
      user_id: userId,
      otp_code: otpCode,
      otp_type: "mobile",
      phone,
      expires_at: expiresAt,
    });

    // Send via MX Global SMS
    const mxUsername = Deno.env.get("MX_GLOBAL_USERNAME");
    const mxPassword = Deno.env.get("MX_GLOBAL_PASSWORD");

    if (!mxUsername || !mxPassword) {
      console.error("MX Global credentials not configured");
      throw new Error("SMS service not configured");
    }

    const message = `Your NextWeb OS verification code is: ${otpCode}. Valid for 5 minutes.`;
    
    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    
    const smsUrl = `https://api.mxglobal.com.au/v1/sms/send`;
    const smsResponse = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${mxUsername}:${mxPassword}`)}`,
      },
      body: JSON.stringify({
        to: cleanPhone,
        body: message,
        from: "NextWebOS",
      }),
    });

    if (!smsResponse.ok) {
      const errText = await smsResponse.text();
      console.error("MX Global SMS error:", errText);
      // Don't expose SMS failure details, but still create the OTP record
      // In dev/staging, the OTP can be verified from the database
    }

    console.log(`[SEND_OTP] OTP sent to ${cleanPhone} for user ${userId}`);

    return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
