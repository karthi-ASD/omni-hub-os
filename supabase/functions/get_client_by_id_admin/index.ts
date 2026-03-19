import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const clientId = (body?.client_id ?? body?.clientId) as string | undefined;
    const emailLookup = (body?.email as string | undefined)?.trim().toLowerCase();

    if (!clientId && !emailLookup) {
      return new Response(JSON.stringify({ error: "client_id or email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isUuidLookup = clientId && UUID_REGEX.test(clientId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Validate the user's token using getUser (works with all supabase-js versions)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.error("[get_client_by_id_admin] Auth failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const adminClient = supabaseAdmin;

    // Fetch client by UUID or email
    let clientQuery;
    if (isUuidLookup) {
      clientQuery = adminClient.from("clients").select("*").eq("id", clientId).maybeSingle();
    } else {
      clientQuery = adminClient.from("clients").select("*").ilike("email", emailLookup!).limit(1).maybeSingle();
    }

    const [{ data: profile }, { data: roleRows }, { data: client, error: clientError }] = await Promise.all([
      adminClient.from("profiles").select("business_id").eq("user_id", userId).maybeSingle(),
      adminClient.from("user_roles").select("role").eq("user_id", userId),
      clientQuery,
    ]);

    if (clientError) {
      console.error("[get_client_by_id_admin] fetch error", { clientId, clientError });
      return new Response(JSON.stringify({ error: clientError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!client) {
      return new Response(JSON.stringify({ exists: false, client: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSuperAdmin = (roleRows || []).some((row) => row.role === "super_admin");
    const canAccess = Boolean(isSuperAdmin || (profile?.business_id && client.business_id === profile.business_id));

    return new Response(JSON.stringify({
      success: true,
      exists: true,
      can_access: canAccess,
      data: canAccess ? client : {
        id: client.id,
        business_id: client.business_id,
        merged_into: client.merged_into,
        deleted_at: client.deleted_at,
      },
      client: canAccess ? client : {
        id: client.id,
        business_id: client.business_id,
        merged_into: client.merged_into,
        deleted_at: client.deleted_at,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[get_client_by_id_admin] unexpected error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
