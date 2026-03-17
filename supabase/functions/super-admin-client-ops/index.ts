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

    const body = await req.json();
    const { action } = body;

    if (action === "permanent_delete") {
      const { client_id } = body;
      if (!client_id) throw new Error("Missing client_id");

      // Get client info for audit
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("id, contact_name, email, business_id, client_status")
        .eq("id", client_id)
        .single();

      if (!client) throw new Error("Client not found");
      if (client.client_status !== "deleted") throw new Error("Client must be soft-deleted first");

      // Delete related records in order
      const relatedTables = [
        "client_pipeline_stages",
        "client_services", 
        "client_users",
        "account_suspensions",
        "seo_keywords",
        "seo_tasks",
        "gsc_data",
        "seo_projects",
        "support_tickets",
        "account_timeline",
        "onboarding_checklist_items",
        "ai_chat_logs",
      ];

      for (const table of relatedTables) {
        await supabaseAdmin.from(table).delete().eq("client_id", client_id);
      }

      // Delete the client
      await supabaseAdmin.from("clients").delete().eq("id", client_id);

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        business_id: client.business_id,
        actor_user_id: caller.id,
        action_type: "CLIENT_PERMANENT_DELETE",
        entity_type: "client",
        entity_id: client_id,
        new_value_json: { contact_name: client.contact_name, email: client.email },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "merge") {
      const { primary_id, secondary_id } = body;
      if (!primary_id || !secondary_id) throw new Error("Missing primary_id or secondary_id");

      const { data: primary } = await supabaseAdmin
        .from("clients").select("*").eq("id", primary_id).single();
      const { data: secondary } = await supabaseAdmin
        .from("clients").select("*").eq("id", secondary_id).single();

      if (!primary || !secondary) throw new Error("One or both clients not found");
      if (primary.business_id !== secondary.business_id) {
        throw new Error("Clients cannot be merged across different businesses");
      }

      // Move related records from secondary to primary
      const fkTables = [
        "client_pipeline_stages",
        "client_services",
        "client_users",
        "account_suspensions",
        "seo_keywords",
        "seo_tasks",
        "gsc_data",
        "seo_projects",
        "support_tickets",
        "account_timeline",
        "onboarding_checklist_items",
        "ai_chat_logs",
        "ads_campaigns",
      ];

      for (const table of fkTables) {
        await supabaseAdmin.from(table).update({ client_id: primary_id }).eq("client_id", secondary_id);
      }

      // Mark secondary as merged
      await supabaseAdmin.from("clients").update({
        client_status: "merged",
        merged_into: primary_id,
        merged_at: new Date().toISOString(),
      }).eq("id", secondary_id);

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        business_id: primary.business_id,
        actor_user_id: caller.id,
        action_type: "CLIENT_MERGE",
        entity_type: "client",
        entity_id: primary_id,
        new_value_json: {
          primary_client: { id: primary_id, name: primary.contact_name },
          merged_client: { id: secondary_id, name: secondary.contact_name },
        },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action: " + action);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("Not authenticated") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
