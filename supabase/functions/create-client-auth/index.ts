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

/**
 * Ensure the client has its own dedicated business (tenant).
 * If client_business_id is already set, reuse it. Otherwise create one.
 */
async function ensureClientBusiness(
  supabaseAdmin: any,
  clientRecord: any
): Promise<string> {
  // If client already has a dedicated business, return it
  if (clientRecord.client_business_id) {
    return clientRecord.client_business_id;
  }

  const clientName = clientRecord.contact_name || clientRecord.company_name || clientRecord.email || "Client Business";

  // Create a new business for this client
  const { data: newBiz, error: bizError } = await supabaseAdmin
    .from("businesses")
    .insert({
      name: clientName,
      email: clientRecord.email,
      status: "active",
      owner_name: clientName,
      registration_method: "client_portal",
    })
    .select("id")
    .single();

  if (bizError) throw new Error(`Failed to create client business: ${bizError.message}`);

  const clientBusinessId = newBiz.id;

  // Link the client_business_id on the client record
  await supabaseAdmin
    .from("clients")
    .update({ client_business_id: clientBusinessId })
    .eq("id", clientRecord.id);

  // Insert default settings for the client's business
  await supabaseAdmin.from("settings").insert([
    { business_id: clientBusinessId, key: "timezone", value: "Australia/Sydney" },
    { business_id: clientBusinessId, key: "currency", value: "AUD" },
    { business_id: clientBusinessId, key: "date_format", value: "DD/MM/YYYY" },
    { business_id: clientBusinessId, key: "theme", value: "system" },
  ]);

  return clientBusinessId;
}

async function createSingleClientAuth(
  supabaseAdmin: any,
  { client_id, email, full_name, business_id }: { client_id: string; email: string; full_name?: string; business_id: string }
) {
  // Fetch the full client record
  const { data: clientRecord, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("id, contact_name, company_name, email, client_business_id, auth_user_id")
    .eq("id", client_id)
    .single();

  if (clientErr || !clientRecord) throw new Error("Client not found");

  // Step 1: Ensure client has its own dedicated business (tenant)
  const clientBusinessId = await ensureClientBusiness(supabaseAdmin, clientRecord);

  // Check if client_users already exists
  const { data: existingLink } = await supabaseAdmin
    .from("client_users")
    .select("user_id")
    .eq("client_id", client_id)
    .eq("is_primary", true)
    .maybeSingle();

  if (existingLink?.user_id) {
    // Ensure profile is mapped to client's own business (fix existing bad mappings)
    await supabaseAdmin.from("profiles").update({ business_id: clientBusinessId }).eq("user_id", existingLink.user_id);
    await supabaseAdmin.from("clients").update({ auth_user_id: existingLink.user_id, login_status: "active" }).eq("id", client_id);
    return { success: true, user_id: existingLink.user_id, already_exists: true, client_business_id: clientBusinessId };
  }

  // Fallback: check clients.auth_user_id
  if (clientRecord.auth_user_id) {
    await supabaseAdmin.from("client_users").upsert(
      { user_id: clientRecord.auth_user_id, client_id, role: "owner", is_primary: true },
      { onConflict: "user_id,client_id" }
    );
    // Fix profile business_id to client's own business
    await supabaseAdmin.from("profiles").update({ business_id: clientBusinessId }).eq("user_id", clientRecord.auth_user_id);
    await supabaseAdmin.from("clients").update({ login_status: "active" }).eq("id", client_id);
    return { success: true, user_id: clientRecord.auth_user_id, already_exists: true, client_business_id: clientBusinessId };
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
    // Step 2: Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email, is_client: true },
    });

    if (createError) throw createError;
    userId = newUser.user.id;
  }

  // Step 3: Set profile business_id to client's OWN business (NOT service provider's)
  await supabaseAdmin
    .from("profiles")
    .update({ business_id: clientBusinessId, full_name: full_name || email })
    .eq("user_id", userId);

  // Step 4: Assign business_admin role with the CLIENT's business_id
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "business_admin", business_id: clientBusinessId },
    { onConflict: "user_id,role" }
  );

  // Step 5: Link auth user to client
  await supabaseAdmin
    .from("clients")
    .update({ auth_user_id: userId, login_status: "active" })
    .eq("id", client_id);

  // Step 6: Create client_users entry
  await supabaseAdmin.from("client_users").upsert(
    { user_id: userId, client_id, role: "owner", is_primary: true },
    { onConflict: "user_id,client_id" }
  );

  // Log event
  await supabaseAdmin.from("system_events").insert({
    business_id: business_id, // log under service provider's business
    event_type: "CLIENT_AUTH_CREATED",
    payload_json: {
      client_id,
      email,
      system_mode: systemMode,
      client_business_id: clientBusinessId,
      service_provider_business_id: business_id,
    },
  });

  return {
    success: true,
    user_id: userId,
    login_status: "active",
    client_business_id: clientBusinessId,
    password_info: systemMode === "testing" ? "Testing password: nextweb123" : "Random password set - activation required",
  };
}
