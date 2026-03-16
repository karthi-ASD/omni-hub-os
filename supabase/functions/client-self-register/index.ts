import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, full_name, company_name, phone, business_slug } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Email, password, and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve business by slug (or use default)
    let businessId: string | null = null;
    if (business_slug) {
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("slug", business_slug)
        .eq("status", "active")
        .single();
      businessId = biz?.id || null;
    }

    if (!businessId) {
      // Get first active business as default
      const { data: defaultBiz } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .single();
      businessId = defaultBiz?.id || null;
    }

    if (!businessId) {
      return new Response(JSON.stringify({ error: "No active business found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if client already exists with this email
    const { data: existingClients } = await supabaseAdmin
      .from("clients")
      .select("id, contact_name, login_status, auth_user_id")
      .eq("email", email.toLowerCase())
      .eq("business_id", businessId);

    const existingClient = existingClients?.[0];

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name, is_client: true },
    });

    if (authError) {
      // If user already exists in auth, get their ID
      if (authError.message?.includes("already been registered")) {
        return new Response(JSON.stringify({ 
          error: "An account with this email already exists. Please sign in instead." 
        }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Assign client role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "client",
      business_id: businessId,
    });

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ business_id: businessId, full_name })
      .eq("user_id", userId);

    let clientId: string;

    if (existingClient) {
      // Client exists - link user to existing client
      clientId = existingClient.id;
      await supabaseAdmin
        .from("clients")
        .update({ auth_user_id: userId, login_status: "active" })
        .eq("id", clientId);

      await supabaseAdmin.from("system_events").insert({
        business_id: businessId,
        event_type: "CLIENT_SELF_REGISTERED_LINKED",
        payload_json: { client_id: clientId, email, user_id: userId },
      });
    } else {
      // No existing client - create new client record
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from("clients")
        .insert({
          business_id: businessId,
          contact_name: full_name,
          company_name: company_name || full_name,
          email: email.toLowerCase(),
          phone: phone || null,
          auth_user_id: userId,
          login_status: "active",
          onboarding_status: "pending",
          client_status: "active",
          signup_source: "self_registration",
        })
        .select("id")
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id;

      await supabaseAdmin.from("system_events").insert({
        business_id: businessId,
        event_type: "CLIENT_SELF_REGISTERED_NEW",
        payload_json: { client_id: clientId, email, user_id: userId },
      });
    }

    // Create client_users entry
    await supabaseAdmin.from("client_users").upsert(
      { user_id: userId, client_id: clientId, role: "owner", is_primary: true },
      { onConflict: "user_id,client_id" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        client_id: clientId,
        linked_existing: !!existingClient,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
