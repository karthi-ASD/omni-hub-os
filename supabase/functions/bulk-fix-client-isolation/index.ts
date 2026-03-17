import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const allResults: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: clients, error: fetchErr } = await supabaseAdmin
        .from("clients")
        .select("id, contact_name, company_name, email, client_business_id, auth_user_id, business_id")
        .not("client_status", "in", '("deleted","merged","reverted")')
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) throw new Error(`Fetch failed at offset ${offset}: ${fetchErr.message}`);
      if (!clients || clients.length === 0) {
        hasMore = false;
        break;
      }

      for (const client of clients) {
        const result = await processClient(supabaseAdmin, client);
        allResults.push(result);
      }

      offset += PAGE_SIZE;
      if (clients.length < PAGE_SIZE) hasMore = false;
    }

    const fixed = allResults.filter(r => r.status === "fixed").length;
    const skipped = allResults.filter(r => r.status === "skipped").length;
    const errors = allResults.filter(r => r.status === "error").length;

    // Summary audit event
    if (allResults.length > 0) {
      const firstBizId = allResults.find(r => r.service_provider_business_id)?.service_provider_business_id;
      if (firstBizId) {
        await supabaseAdmin.from("system_events").insert({
          business_id: firstBizId,
          event_type: "BULK_FIX_CLIENT_ISOLATION",
          payload_json: { total: allResults.length, fixed, skipped, errors },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: allResults.length,
      fixed,
      skipped,
      errors,
      results: allResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processClient(supabaseAdmin: any, client: any) {
  const clientName = client.contact_name || client.company_name || client.email || "Client";

  try {
    // IDEMPOTENCY: If client already has client_business_id, only fix mappings
    if (client.client_business_id) {
      let mappingFixed = false;

      // Still fix profile/role if auth user exists
      if (client.auth_user_id) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("business_id")
          .eq("user_id", client.auth_user_id)
          .maybeSingle();

        if (profile && profile.business_id !== client.client_business_id) {
          await supabaseAdmin.from("profiles")
            .update({ business_id: client.client_business_id })
            .eq("user_id", client.auth_user_id);
          mappingFixed = true;
        }

        // Ensure role points to client_business_id
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: client.auth_user_id, role: "business_admin", business_id: client.client_business_id },
          { onConflict: "user_id,role" }
        );

        // Ensure client_users link exists
        await supabaseAdmin.from("client_users").upsert(
          { user_id: client.auth_user_id, client_id: client.id, role: "owner", is_primary: true },
          { onConflict: "user_id,client_id" }
        );

        if (mappingFixed) {
          await logClientEvent(supabaseAdmin, client, "mapping_corrected");
          return { client_id: client.id, name: clientName, status: "fixed", detail: "mapping_corrected" };
        }
      }

      return { client_id: client.id, name: clientName, status: "skipped", detail: "already_isolated" };
    }

    // Step 1: Create dedicated business
    const { data: newBiz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .insert({
        name: clientName,
        email: client.email,
        status: "active",
        owner_name: clientName,
        registration_method: "client_portal",
      })
      .select("id")
      .single();

    if (bizErr) throw new Error(`Business create: ${bizErr.message}`);
    const clientBusinessId = newBiz.id;

    // Step 2: Set client_business_id
    await supabaseAdmin.from("clients")
      .update({ client_business_id: clientBusinessId })
      .eq("id", client.id);

    // Step 3: Default settings
    await supabaseAdmin.from("settings").insert([
      { business_id: clientBusinessId, key: "timezone", value: "Australia/Sydney" },
      { business_id: clientBusinessId, key: "currency", value: "AUD" },
      { business_id: clientBusinessId, key: "date_format", value: "DD/MM/YYYY" },
      { business_id: clientBusinessId, key: "theme", value: "system" },
    ]);

    // Step 4: Fix auth user mappings if exists
    if (client.auth_user_id) {
      await supabaseAdmin.from("profiles")
        .update({ business_id: clientBusinessId })
        .eq("user_id", client.auth_user_id);

      await supabaseAdmin.from("user_roles").upsert(
        { user_id: client.auth_user_id, role: "business_admin", business_id: clientBusinessId },
        { onConflict: "user_id,role" }
      );

      await supabaseAdmin.from("client_users").upsert(
        { user_id: client.auth_user_id, client_id: client.id, role: "owner", is_primary: true },
        { onConflict: "user_id,client_id" }
      );
    }

    // Also fix any linked users via client_users
    const { data: linkedUsers } = await supabaseAdmin
      .from("client_users")
      .select("user_id")
      .eq("client_id", client.id);

    if (linkedUsers) {
      for (const lu of linkedUsers) {
        if (lu.user_id === client.auth_user_id) continue; // already done
        await supabaseAdmin.from("profiles")
          .update({ business_id: clientBusinessId })
          .eq("user_id", lu.user_id);
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: lu.user_id, role: "business_admin", business_id: clientBusinessId },
          { onConflict: "user_id,role" }
        );
      }
    }

    await logClientEvent(supabaseAdmin, client, "isolated", clientBusinessId);

    return {
      client_id: client.id,
      name: clientName,
      status: "fixed",
      detail: "new_business_created",
      client_business_id: clientBusinessId,
      service_provider_business_id: client.business_id,
    };
  } catch (e: any) {
    return { client_id: client.id, name: clientName, status: "error", error: e.message };
  }
}

async function logClientEvent(supabaseAdmin: any, client: any, action: string, clientBusinessId?: string) {
  try {
    await supabaseAdmin.from("system_events").insert({
      business_id: client.business_id,
      event_type: "CLIENT_ISOLATION_FIXED",
      payload_json: {
        client_id: client.id,
        client_name: client.contact_name,
        action,
        client_business_id: clientBusinessId || client.client_business_id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch { /* non-critical */ }
}
