import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error("Not authenticated");

    // Verify super_admin role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) throw new Error("Only Super Admin can perform this action");

    const { client_id, new_password } = await req.json();
    if (!client_id) throw new Error("Missing client_id");
    if (!new_password || new_password.length < 8) throw new Error("Password must be at least 8 characters");

    // Step 1: Try client_users table (primary link)
    const { data: clientUser } = await supabaseAdmin
      .from("client_users")
      .select("user_id")
      .eq("client_id", client_id)
      .eq("is_primary", true)
      .maybeSingle();

    let authUserId = clientUser?.user_id || null;

    // Step 2: Fallback to clients.auth_user_id (Xero imports, legacy records)
    if (!authUserId) {
      const { data: clientRecord } = await supabaseAdmin
        .from("clients")
        .select("auth_user_id, email, contact_name, business_id")
        .eq("id", client_id)
        .single();

      if (clientRecord?.auth_user_id) {
        authUserId = clientRecord.auth_user_id;
      } else if (clientRecord?.email) {
        // Step 3: Find auth user by email
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const matchedUser = usersData?.users?.find(
          (u: any) => u.email?.toLowerCase() === clientRecord.email.toLowerCase()
        );
        if (matchedUser) {
          authUserId = matchedUser.id;
          // Auto-link for future lookups
          await supabaseAdmin.from("clients").update({ auth_user_id: matchedUser.id }).eq("id", client_id);
          await supabaseAdmin.from("client_users").upsert(
            { user_id: matchedUser.id, client_id, role: "owner", is_primary: true },
            { onConflict: "user_id,client_id" }
          );
        }
      }
    }

    if (!authUserId) {
      return new Response(JSON.stringify({ error: "Client login account not found. Please create a login account for this client first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      clientUser.user_id,
      { password: new_password }
    );

    if (updateError) throw new Error("Failed to update password: " + updateError.message);

    // Get client info for audit
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("contact_name, email, business_id")
      .eq("id", client_id)
      .single();

    // Audit log
    if (client) {
      await supabaseAdmin.from("audit_logs").insert({
        business_id: client.business_id,
        actor_user_id: caller.id,
        action_type: "CLIENT_PASSWORD_RESET",
        entity_type: "client",
        entity_id: client_id,
        new_value_json: { contact_name: client.contact_name, email: client.email },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const status = error.message.includes("Not authenticated") ? 401 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
