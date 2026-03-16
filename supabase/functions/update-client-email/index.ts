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

    // Verify caller is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error("Not authenticated");

    // Check caller has admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = callerRoles?.some(
      (r: any) => r.role === "super_admin" || r.role === "business_admin"
    );
    if (!isAdmin) throw new Error("Only Super Admin and Admin can edit client emails");

    const { client_id, new_email } = await req.json();
    if (!client_id || !new_email) throw new Error("Missing client_id or new_email");

    const email = new_email.toLowerCase().trim();

    // Get the client record
    const { data: client, error: clientErr } = await supabaseAdmin
      .from("clients")
      .select("id, email, auth_user_id, business_id")
      .eq("id", client_id)
      .single();

    if (clientErr || !client) throw new Error("Client not found");

    // Check duplicate email in clients table (same business)
    const { data: duplicate } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", email)
      .eq("business_id", client.business_id)
      .neq("id", client_id)
      .maybeSingle();

    if (duplicate) throw new Error("A client with this email already exists");

    // Check duplicate email in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const duplicateAuthUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email && u.id !== client.auth_user_id
    );
    if (duplicateAuthUser) throw new Error("A user account with this email already exists");

    // Update client email
    await supabaseAdmin
      .from("clients")
      .update({ email })
      .eq("id", client_id);

    // Update auth user email if linked
    if (client.auth_user_id) {
      const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
        client.auth_user_id,
        { email }
      );
      if (authUpdateErr) {
        console.error("Failed to update auth user email:", authUpdateErr);
        throw new Error("Client updated but failed to sync login email: " + authUpdateErr.message);
      }

      // Update profile email too
      await supabaseAdmin
        .from("profiles")
        .update({ email })
        .eq("user_id", client.auth_user_id);
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      business_id: client.business_id,
      actor_user_id: caller.id,
      action_type: "UPDATE_CLIENT_EMAIL",
      entity_type: "client",
      entity_id: client_id,
      new_value_json: { old_email: client.email, new_email: email },
    });

    return new Response(
      JSON.stringify({ success: true, synced_auth: !!client.auth_user_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Not authenticated") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
