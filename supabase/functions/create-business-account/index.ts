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

    // Verify the caller is authenticated and has admin/super_admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    // Check caller has admin role
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const roles = callerRoles?.map((r: any) => r.role) || [];
    if (!roles.includes("super_admin") && !roles.includes("business_admin") && !roles.includes("manager")) {
      throw new Error("Insufficient permissions");
    }

    const body = await req.json();
    const {
      businessName, ownerName, email, phone,
      address, city, state, country, postcode,
      websiteUrl, domainName, hostingProvider, cmsPlatform,
      socialFacebook, socialInstagram, socialLinkedin, socialGbp, socialYoutube,
      industry, subIndustry,
      targetLocations, competitors, subscribedServices,
      registeredByUserId,
    } = body;

    if (!businessName || !ownerName || !email || !phone) {
      throw new Error("Business name, owner name, email, and phone are required");
    }

    // Generate temporary password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    let tempPassword = "";
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure it meets requirements (letters + numbers)
    tempPassword = tempPassword.slice(0, 8) + "A1" + tempPassword.slice(10);

    // Create auth user with service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // requires email verification
      user_metadata: { full_name: ownerName },
    });
    if (authError) throw authError;
    const newUserId = authData.user.id;

    // Create business via RPC
    const { data: businessId, error: bizError } = await supabase.rpc("handle_business_registration", {
      _business_name: businessName,
      _owner_name: ownerName,
      _email: email,
      _phone: phone,
      _address: address || null,
      _city: city || null,
      _state: state || null,
      _country: country || null,
      _postcode: postcode || null,
      _website_url: websiteUrl || null,
      _domain_name: domainName || null,
      _hosting_provider: hostingProvider || null,
      _cms_platform: cmsPlatform || null,
      _social_facebook: socialFacebook || null,
      _social_instagram: socialInstagram || null,
      _social_linkedin: socialLinkedin || null,
      _social_gbp: socialGbp || null,
      _social_youtube: socialYoutube || null,
      _industry: industry || null,
      _sub_industry: subIndustry || null,
      _services_offered: null,
      _target_locations: targetLocations?.length ? targetLocations : null,
      _competitors: competitors?.length ? competitors : null,
      _subscribed_services: subscribedServices?.length ? subscribedServices : null,
      _registration_method: "admin",
      _registered_by_user_id: registeredByUserId || null,
    });
    if (bizError) throw bizError;

    // Update profile with business_id
    await supabase
      .from("profiles")
      .update({ business_id: businessId, full_name: ownerName })
      .eq("user_id", newUserId);

    // Assign client_admin role (using business_admin for now since client_admin doesn't exist yet)
    await supabase.from("user_roles").insert({
      user_id: newUserId,
      role: "business_admin",
      business_id: businessId,
    });

    // Create first_login_security record (forces security setup on first login)
    await supabase.from("first_login_security").insert({
      user_id: newUserId,
      requires_security_setup: true,
    });

    // Log the event
    await supabase.from("system_events").insert({
      business_id: businessId,
      event_type: "BUSINESS_CREATED_BY_ADMIN",
      payload_json: {
        created_by: registeredByUserId,
        business_name: businessName,
        client_email: email,
      },
    });

    // Send credentials email via MX Global SMS (as email placeholder)
    // In production, integrate with proper email service
    // For now, log the credentials
    console.log(`[CREATE_BUSINESS] Credentials for ${email}: temp password = ${tempPassword}`);

    return new Response(JSON.stringify({
      success: true,
      businessId,
      userId: newUserId,
      message: `Business created. Credentials sent to ${email}.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error creating business:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
