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

    // Verify the requesting user is admin/super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some(
      (r: any) => r.role === "super_admin" || r.role === "business_admin"
    );

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only Admin and Super Admin can use this feature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id } = await req.json();

    // Get client's auth user
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("auth_user_id, email, contact_name")
      .eq("id", client_id)
      .single();

    if (!client?.auth_user_id) {
      return new Response(JSON.stringify({ error: "Client has no linked auth user. Create login first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic link / session for the client user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: client.email,
    });

    if (linkError) throw linkError;

    // Log the impersonation
    await supabaseAdmin.from("audit_logs").insert({
      business_id: (await supabaseAdmin.from("profiles").select("business_id").eq("user_id", requestingUser.id).single()).data?.business_id,
      actor_user_id: requestingUser.id,
      action_type: "LOGIN_AS_CLIENT",
      entity_type: "client",
      entity_id: client_id,
      new_value_json: { client_name: client.contact_name, client_email: client.email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        magic_link: linkData.properties?.action_link,
        client_name: client.contact_name,
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
