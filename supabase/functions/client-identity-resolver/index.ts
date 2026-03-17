import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Get user's business_id
    const { data: profile } = await supabase.from("profiles").select("business_id").eq("user_id", user.id).single();
    if (!profile?.business_id) return new Response(JSON.stringify({ error: "No business" }), { status: 400, headers: corsHeaders });

    const { action, ...params } = await req.json();

    if (action === "resolve") {
      // Resolve a client from email/phone/external_id
      const { data } = await supabase.rpc("resolve_client_id", {
        _business_id: profile.business_id,
        _email: params.email || null,
        _phone: params.phone || null,
        _external_id: params.external_id || null,
        _name: params.name || null,
      });
      return new Response(JSON.stringify({ client_id: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "integrity_report") {
      const { data } = await supabase
        .from("client_integrity_report")
        .select("*")
        .eq("business_id", profile.business_id)
        .or("duplicate_email_count.gt.0,duplicate_phone_count.gt.0")
        .limit(200);
      return new Response(JSON.stringify({ records: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "unmatched_list") {
      const { data } = await supabase
        .from("unmatched_records")
        .select("*")
        .eq("business_id", profile.business_id)
        .eq("resolution_status", "unmatched")
        .order("created_at", { ascending: false })
        .limit(200);
      return new Response(JSON.stringify({ records: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "link_record") {
      // Link an unmatched record to a client
      const { record_id, client_id } = params;
      if (!record_id || !client_id) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: corsHeaders });

      // Get the unmatched record
      const { data: rec } = await supabase.from("unmatched_records").select("*").eq("id", record_id).single();
      if (!rec) return new Response(JSON.stringify({ error: "Record not found" }), { status: 404, headers: corsHeaders });

      // Update the source table's client_id
      const { error: updateErr } = await supabase
        .from(rec.source_table)
        .update({ client_id })
        .eq("id", rec.source_record_id);

      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: corsHeaders });

      // Mark as resolved
      await supabase.from("unmatched_records").update({
        resolution_status: "matched",
        resolved_client_id: client_id,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      }).eq("id", record_id);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "scan_orphans") {
      // Scan for orphan records across key tables and log unmatched
      const tables = ["support_tickets", "seo_projects"];
      let found = 0;

      for (const table of tables) {
        const { data: orphans } = await supabase
          .from(table)
          .select("id, business_id")
          .is("client_id", null)
          .eq("business_id", profile.business_id)
          .limit(500);

        if (orphans && orphans.length > 0) {
          // Check if already logged
          const ids = orphans.map((o: any) => o.id);
          const { data: existing } = await supabase
            .from("unmatched_records")
            .select("source_record_id")
            .eq("source_table", table)
            .in("source_record_id", ids);

          const existingIds = new Set((existing || []).map((e: any) => e.source_record_id));
          const newOrphans = orphans.filter((o: any) => !existingIds.has(o.id));

          if (newOrphans.length > 0) {
            const rows = newOrphans.map((o: any) => ({
              business_id: o.business_id,
              source_table: table,
              source_record_id: o.id,
              resolution_status: "unmatched",
            }));
            await supabase.from("unmatched_records").insert(rows);
            found += newOrphans.length;
          }
        }
      }

      return new Response(JSON.stringify({ scanned: true, new_orphans_found: found }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
