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

    const { client_id, email, full_name, business_id } = await req.json();

    if (!client_id || !email || !business_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check system_mode
    const { data: modeData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("business_id", business_id)
      .eq("key", "system_mode")
      .single();

    const systemMode = modeData?.value || "testing";
    const password = systemMode === "testing" ? "NextWebTest@123" : crypto.randomUUID();

    // Check if auth user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email, is_client: true },
      });

      if (createError) throw createError;
      userId = newUser.user.id;

      // Assign client role
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "client",
        business_id,
      });

      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({ business_id, full_name: full_name || email })
        .eq("user_id", userId);
    }

    // Link auth user to client
    await supabaseAdmin
      .from("clients")
      .update({
        auth_user_id: userId,
        login_status: systemMode === "testing" ? "active" : "pending",
      })
      .eq("id", client_id);

    // Create client_users entry
    await supabaseAdmin.from("client_users").upsert(
      { user_id: userId, client_id, role: "owner", is_primary: true },
      { onConflict: "user_id,client_id" }
    );

    // Log event
    await supabaseAdmin.from("system_events").insert({
      business_id,
      event_type: "CLIENT_AUTH_CREATED",
      payload_json: { client_id, email, system_mode: systemMode },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        login_status: systemMode === "testing" ? "active" : "pending",
        password_info: systemMode === "testing" ? "Using shared testing password" : "Random password set - activation required",
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
