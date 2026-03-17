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

    // Find all clients missing client_business_id
    const { data: clients, error: fetchErr } = await supabaseAdmin
      .from("clients")
      .select("id, contact_name, company_name, email, client_business_id, auth_user_id, business_id")
      .is("client_business_id", null)
      .not("client_status", "in", '("deleted","merged","reverted")')
      .limit(500);

    if (fetchErr) throw new Error(`Failed to fetch clients: ${fetchErr.message}`);
    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ success: true, fixed: 0, message: "All clients already have tenant isolation." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const client of clients) {
      try {
        const clientName = client.contact_name || client.company_name || client.email || "Client Business";

        // Step 1: Create dedicated business for this client
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

        if (bizErr) throw new Error(`Biz create failed: ${bizErr.message}`);
        const clientBusinessId = newBiz.id;

        // Step 2: Update client with client_business_id
        await supabaseAdmin
          .from("clients")
          .update({ client_business_id: clientBusinessId })
          .eq("id", client.id);

        // Step 3: Insert default settings for this tenant
        await supabaseAdmin.from("settings").insert([
          { business_id: clientBusinessId, key: "timezone", value: "Australia/Sydney" },
          { business_id: clientBusinessId, key: "currency", value: "AUD" },
          { business_id: clientBusinessId, key: "date_format", value: "DD/MM/YYYY" },
          { business_id: clientBusinessId, key: "theme", value: "system" },
        ]);

        // Step 4: If client has an auth_user_id, fix the profile and role mappings
        if (client.auth_user_id) {
          // Fix profile to point to client's own business
          await supabaseAdmin
            .from("profiles")
            .update({ business_id: clientBusinessId })
            .eq("user_id", client.auth_user_id);

          // Ensure correct role
          await supabaseAdmin.from("user_roles").upsert(
            { user_id: client.auth_user_id, role: "business_admin", business_id: clientBusinessId },
            { onConflict: "user_id,role" }
          );

          // Ensure client_users link
          await supabaseAdmin.from("client_users").upsert(
            { user_id: client.auth_user_id, client_id: client.id, role: "owner", is_primary: true },
            { onConflict: "user_id,client_id" }
          );
        }

        // Also check client_users for any linked users
        const { data: linkedUsers } = await supabaseAdmin
          .from("client_users")
          .select("user_id")
          .eq("client_id", client.id);

        if (linkedUsers) {
          for (const lu of linkedUsers) {
            await supabaseAdmin
              .from("profiles")
              .update({ business_id: clientBusinessId })
              .eq("user_id", lu.user_id);

            await supabaseAdmin.from("user_roles").upsert(
              { user_id: lu.user_id, role: "business_admin", business_id: clientBusinessId },
              { onConflict: "user_id,role" }
            );
          }
        }

        results.push({ client_id: client.id, name: clientName, status: "fixed", client_business_id: clientBusinessId });
      } catch (e: any) {
        results.push({ client_id: client.id, name: client.contact_name, status: "error", error: e.message });
      }
    }

    const fixed = results.filter(r => r.status === "fixed").length;
    const errors = results.filter(r => r.status === "error").length;

    // Log event
    await supabaseAdmin.from("system_events").insert({
      business_id: clients[0]?.business_id || "00000000-0000-0000-0000-000000000000",
      event_type: "BULK_FIX_CLIENT_ISOLATION",
      payload_json: { total: clients.length, fixed, errors },
    });

    return new Response(JSON.stringify({ success: true, total: clients.length, fixed, errors, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
