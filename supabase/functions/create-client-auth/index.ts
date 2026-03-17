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

    const { client_id, email, full_name, business_id, bulk } = await req.json();

    // Bulk activation support
    if (bulk && Array.isArray(bulk)) {
      const results: any[] = [];
      for (const item of bulk) {
        try {
          const result = await createSingleClientAuth(supabaseAdmin, item);
          results.push({ client_id: item.client_id, ...result });
        } catch (e: any) {
          results.push({ client_id: item.client_id, error: e.message });
        }
      }
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single client activation
    if (!client_id || !email || !business_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await createSingleClientAuth(supabaseAdmin, { client_id, email, full_name, business_id });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function createSingleClientAuth(
  supabaseAdmin: any,
  { client_id, email, full_name, business_id }: { client_id: string; email: string; full_name?: string; business_id: string }
) {
  // Check if client_users already exists
  const { data: existingLink } = await supabaseAdmin
    .from("client_users")
    .select("user_id")
    .eq("client_id", client_id)
    .eq("is_primary", true)
    .maybeSingle();

  if (existingLink?.user_id) {
    // Also check clients.auth_user_id is set
    await supabaseAdmin.from("clients").update({ auth_user_id: existingLink.user_id, login_status: "active" }).eq("id", client_id);
    return { success: true, user_id: existingLink.user_id, already_exists: true };
  }

  // Check clients.auth_user_id fallback
  const { data: clientRecord } = await supabaseAdmin
    .from("clients")
    .select("auth_user_id")
    .eq("id", client_id)
    .single();

  if (clientRecord?.auth_user_id) {
    // Ensure client_users link exists
    await supabaseAdmin.from("client_users").upsert(
      { user_id: clientRecord.auth_user_id, client_id, role: "owner", is_primary: true },
      { onConflict: "user_id,client_id" }
    );
    await supabaseAdmin.from("clients").update({ login_status: "active" }).eq("id", client_id);
    return { success: true, user_id: clientRecord.auth_user_id, already_exists: true };
  }

  // Check system_mode for password
  const { data: modeData } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("business_id", business_id)
    .eq("key", "system_mode")
    .single();

  const systemMode = modeData?.value || "testing";
  const password = systemMode === "testing" ? "nextweb123" : crypto.randomUUID();

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

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ business_id, full_name: full_name || email })
      .eq("user_id", userId);
  }

  // Assign client role (business_admin as requested)
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "business_admin", business_id },
    { onConflict: "user_id,role" }
  );

  // Link auth user to client
  await supabaseAdmin
    .from("clients")
    .update({ auth_user_id: userId, login_status: "active" })
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

  return {
    success: true,
    user_id: userId,
    login_status: "active",
    password_info: systemMode === "testing" ? "Testing password: nextweb123" : "Random password set - activation required",
  };
}
