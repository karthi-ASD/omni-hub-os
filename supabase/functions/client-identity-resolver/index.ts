import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All tables that have client_id and should be scanned for orphans
const SCANNABLE_TABLES = [
  "support_tickets",
  "seo_projects",
  "seo_tasks",
  "xero_invoices",
  "xero_payments",
  "projects",
  "call_logs",
  "invoices",
  "payments",
  "contracts",
  "whatsapp_conversations",
  "whatsapp_messages",
  "communications_log",
  "client_activity_log",
  "content_tasks",
  "seo_campaigns",
  "seo_backlinks",
  "seo_blogs",
  "seo_monthly_reports",
  "ads_campaigns",
  "ads_snapshots",
  "renewals",
  "proposal_requests",
  "social_media_tasks",
  "gmb_tasks",
  "notifications",
  "sales_callbacks",
  "roi_metrics",
  "analytics_snapshots",
  "customer_feedback",
  "onboarding_checklist_items",
  "gsc_data",
  "google_rank_checks",
  "google_analytics_daily_stats",
  "google_maps_daily_stats",
  "seo_snapshots",
  "seo_updates",
  "seo_page_audits",
  "seo_page_scores",
  "seo_competitors",
  "seo_competitor_gap",
  "seo_content_workflow",
  "seo_content_generation",
  "seo_backlink_outreach",
  "seo_captured_leads",
  "seo_internal_link_suggestions",
  "seo_lead_forms",
  "seo_roadmaps",
  "seo_automation_settings",
  "seo_cms_connections",
  "seo_client_messages",
  "client_services",
  "client_pipeline_stages",
  "client_contacts",
  "client_billing_schedules",
  "client_access_credentials",
  "client_domains",
  "client_hosting_accounts",
  "client_websites",
  "client_website_pages",
  "client_social_links",
  "client_alternate_emails",
  "client_whatsapp_identity",
  "client_conversations",
  "client_projects",
  "client_project_integrations",
  "upsell_opportunities",
  "churn_signals",
  "account_suspensions",
  "account_timeline",
  "deal_room_proposals",
  "cohort_memberships",
  "renewal_reminders",
  "renewal_reminder_logs",
  "recurring_profiles",
  "sales_commissions",
  "ai_blog_drafts",
  "ai_chat_logs",
  "ai_content_briefs",
  "ai_content_opportunities",
  "ai_competitor_analysis",
  "ai_seo_audits",
  "ai_insights",
  "ai_email_drafts",
  "ai_social_posts",
  "ai_keyword_clusters",
  "ai_outreach_prospects",
  "ai_execution_logs",
  "client_health_scores",
  "client_risk_alerts",
  "client_employees",
  "client_departments",
  "client_mobile_apps",
  "client_profiles",
  "client_users",
  "analytics_sync_status",
  "website_trees",
  "website_project_stages",
  "onboarding_instances",
  "onboarding_workflows",
];

interface MatchResult {
  client_id: string;
  method: string;
  confidence: "high" | "medium" | "low";
}

async function resolveClientMatch(
  supabase: any,
  businessId: string,
  email?: string | null,
  phone?: string | null,
  externalId?: string | null
): Promise<MatchResult | null> {
  const normEmail = (email || "").trim().toLowerCase();
  const normPhone = (phone || "").replace(/[^0-9+]/g, "");

  // Priority 1: External ID (high confidence)
  if (externalId) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("xero_contact_id", externalId)
      .is("deleted_at", null)
      .is("merged_into", null)
      .limit(1)
      .single();
    if (data) return { client_id: data.id, method: "xero_contact_id", confidence: "high" };
  }

  // Priority 2: Exact email (medium confidence)
  if (normEmail) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .ilike("email", normEmail)
      .is("deleted_at", null)
      .is("merged_into", null)
      .limit(1)
      .single();
    if (data) return { client_id: data.id, method: "exact_email", confidence: "medium" };
  }

  // Priority 3: Phone suffix (low confidence — manual review only)
  if (normPhone && normPhone.length >= 8) {
    const suffix = normPhone.slice(-9);
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .is("merged_into", null)
      .or(`phone.ilike.%${suffix},mobile.ilike.%${suffix}`)
      .limit(1)
      .single();
    if (data) return { client_id: data.id, method: "phone_suffix", confidence: "low" };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase.from("profiles").select("business_id").eq("user_id", user.id).single();
    if (!profile?.business_id) return new Response(JSON.stringify({ error: "No business" }), { status: 400, headers: corsHeaders });

    const businessId = profile.business_id;
    const { action, ...params } = await req.json();

    // ─── RESOLVE CLIENT ───
    if (action === "resolve") {
      const match = await resolveClientMatch(supabase, businessId, params.email, params.phone, params.external_id);
      return new Response(JSON.stringify({ client_id: match?.client_id || null, method: match?.method, confidence: match?.confidence }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── INTEGRITY REPORT ───
    if (action === "integrity_report") {
      const { data } = await supabase
        .from("client_integrity_report")
        .select("*")
        .eq("business_id", businessId)
        .or("duplicate_email_count.gt.0,duplicate_phone_count.gt.0")
        .limit(200);
      return new Response(JSON.stringify({ records: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── UNMATCHED LIST ───
    if (action === "unmatched_list") {
      const { data } = await supabase
        .from("unmatched_records")
        .select("*")
        .eq("business_id", businessId)
        .eq("resolution_status", "unmatched")
        .order("created_at", { ascending: false })
        .limit(500);
      return new Response(JSON.stringify({ records: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── LINK RECORD (manual) ───
    if (action === "link_record") {
      const { record_id, client_id } = params;
      if (!record_id || !client_id) return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: corsHeaders });

      const { data: rec } = await supabase.from("unmatched_records").select("*").eq("id", record_id).single();
      if (!rec) return new Response(JSON.stringify({ error: "Record not found" }), { status: 404, headers: corsHeaders });

      // Audit log
      await supabase.from("client_backfill_audit_log").insert({
        business_id: businessId,
        source_table: rec.source_table,
        source_record_id: rec.source_record_id,
        old_client_id: null,
        new_client_id: client_id,
        match_method: "manual",
        confidence: "high",
        is_dry_run: false,
        applied_at: new Date().toISOString(),
        applied_by: user.id,
      });

      const { error: updateErr } = await supabase
        .from(rec.source_table)
        .update({ client_id })
        .eq("id", rec.source_record_id);

      if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500, headers: corsHeaders });

      await supabase.from("unmatched_records").update({
        resolution_status: "matched",
        resolved_client_id: client_id,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        match_confidence: "high",
        suggested_match_method: "manual",
      }).eq("id", record_id);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── SCAN ORPHANS (expanded) ───
    if (action === "scan_orphans") {
      let found = 0;
      const tableSummary: Record<string, number> = {};

      for (const table of SCANNABLE_TABLES) {
        try {
          const { data: orphans, error } = await supabase
            .from(table)
            .select("id, business_id")
            .is("client_id", null)
            .eq("business_id", businessId)
            .limit(500);

          if (error || !orphans || orphans.length === 0) continue;

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
            tableSummary[table] = newOrphans.length;
          }
        } catch {
          // Table may not exist or have different schema — skip
        }
      }

      return new Response(JSON.stringify({ scanned: true, new_orphans_found: found, by_table: tableSummary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── MODULE SUMMARY (orphan counts per table) ───
    if (action === "module_summary") {
      const summary: Record<string, { orphans: number; total: number }> = {};
      const priorityTables = [
        "support_tickets", "seo_projects", "seo_tasks", "xero_invoices",
        "projects", "call_logs", "invoices", "contracts",
        "whatsapp_conversations", "payments", "ads_campaigns",
        "renewals", "client_services", "notifications",
      ];

      for (const table of priorityTables) {
        try {
          const { count: total } = await supabase
            .from(table).select("*", { count: "exact", head: true })
            .eq("business_id", businessId);
          const { count: orphans } = await supabase
            .from(table).select("*", { count: "exact", head: true })
            .eq("business_id", businessId).is("client_id", null);
          summary[table] = { orphans: orphans || 0, total: total || 0 };
        } catch { /* skip */ }
      }

      return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── DRY-RUN BACKFILL ───
    if (action === "backfill_dry_run" || action === "backfill_apply") {
      const isDryRun = action === "backfill_dry_run";
      const targetTable = params.table; // optional: specific table
      const tables = targetTable ? [targetTable] : ["support_tickets", "seo_projects", "projects", "call_logs", "invoices", "xero_invoices"];
      
      let totalMatched = 0;
      let totalUnmatched = 0;
      const results: any[] = [];

      for (const table of tables) {
        try {
          // Get records with null client_id that have email or phone we can match
          const { data: orphans } = await supabase
            .from(table)
            .select("id, business_id")
            .is("client_id", null)
            .eq("business_id", businessId)
            .limit(200);

          if (!orphans || orphans.length === 0) continue;

          // For each orphan, try to find email/phone from the record itself
          for (const orphan of orphans) {
            // Fetch record details to get matching fields
            const { data: record } = await supabase.from(table).select("*").eq("id", orphan.id).single();
            if (!record) continue;

            const email = record.email || record.contact_email || record.client_email || null;
            const phone = record.phone || record.contact_phone || null;
            const externalId = record.xero_contact_id || record.external_id || null;

            const match = await resolveClientMatch(supabase, businessId, email, phone, externalId);

            const auditEntry = {
              business_id: businessId,
              source_table: table,
              source_record_id: orphan.id,
              old_client_id: null,
              new_client_id: match?.client_id || null,
              match_method: match?.method || "none",
              confidence: match?.confidence || "none",
              is_dry_run: isDryRun,
              applied_by: user.id,
            };

            if (match) {
              // NEVER auto-apply low confidence
              if (match.confidence === "low") {
                results.push({ ...auditEntry, action: "manual_review_required" });
                // Log to unmatched for manual review
                if (!isDryRun) {
                  await supabase.from("unmatched_records").upsert({
                    business_id: businessId,
                    source_table: table,
                    source_record_id: orphan.id,
                    resolution_status: "unmatched",
                    suggested_client_id: match.client_id,
                    match_confidence: "low",
                    suggested_match_method: match.method,
                  }, { onConflict: "source_table,source_record_id", ignoreDuplicates: true });
                }
                totalUnmatched++;
                continue;
              }

              if (!isDryRun) {
                // Apply the match
                await supabase.from(table).update({ client_id: match.client_id }).eq("id", orphan.id);
                auditEntry.applied_at = new Date().toISOString();
              }

              await supabase.from("client_backfill_audit_log").insert(auditEntry);
              results.push({ ...auditEntry, action: isDryRun ? "would_link" : "linked" });
              totalMatched++;
            } else {
              results.push({ ...auditEntry, action: "no_match" });
              totalUnmatched++;
            }
          }
        } catch { /* skip table */ }
      }

      return new Response(JSON.stringify({
        mode: isDryRun ? "dry_run" : "applied",
        total_matched: totalMatched,
        total_unmatched: totalUnmatched,
        details: results.slice(0, 100), // cap response size
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── CLIENT DEBUG VIEW ───
    if (action === "client_debug") {
      const { client_id } = params;
      if (!client_id) return new Response(JSON.stringify({ error: "client_id required" }), { status: 400, headers: corsHeaders });

      // Get client details
      const { data: client } = await supabase.from("clients").select("*").eq("id", client_id).single();
      if (!client) return new Response(JSON.stringify({ error: "Client not found" }), { status: 404, headers: corsHeaders });

      // Check linked entities across key modules
      const modules: Record<string, number> = {};
      const checkTables = [
        "support_tickets", "seo_projects", "seo_tasks", "xero_invoices",
        "projects", "call_logs", "invoices", "contracts", "payments",
        "whatsapp_conversations", "client_services", "renewals",
        "ads_campaigns", "notifications", "client_pipeline_stages",
        "client_access_credentials", "onboarding_checklist_items",
        "gsc_data", "seo_monthly_reports", "client_contacts",
      ];

      for (const t of checkTables) {
        try {
          const { count } = await supabase.from(t).select("*", { count: "exact", head: true }).eq("client_id", client_id);
          modules[t] = count || 0;
        } catch { modules[t] = -1; }
      }

      // Check duplicates by email
      const { data: emailDups } = await supabase
        .from("clients")
        .select("id, contact_name, email")
        .eq("business_id", businessId)
        .ilike("email", client.email || "___impossible___")
        .is("deleted_at", null)
        .neq("id", client_id);

      // Check duplicates by phone
      let phoneDups: any[] = [];
      if (client.phone && client.phone.length > 6) {
        const suffix = client.phone.replace(/[^0-9]/g, "").slice(-9);
        if (suffix.length >= 6) {
          const { data } = await supabase
            .from("clients")
            .select("id, contact_name, phone")
            .eq("business_id", businessId)
            .is("deleted_at", null)
            .neq("id", client_id)
            .or(`phone.ilike.%${suffix},mobile.ilike.%${suffix}`);
          phoneDups = data || [];
        }
      }

      // Unmatched records referencing this client
      const { data: unmatchedForClient } = await supabase
        .from("unmatched_records")
        .select("*")
        .eq("business_id", businessId)
        .eq("suggested_client_id", client_id);

      // Determine health status
      let healthStatus = "healthy";
      if ((emailDups && emailDups.length > 0) || phoneDups.length > 0) healthStatus = "duplicate_risk";
      else if (!client.xero_contact_id) healthStatus = "missing_external_mapping";
      else {
        const hasOrphans = Object.values(modules).some(v => v === 0);
        const linkedCount = Object.values(modules).filter(v => v > 0).length;
        if (linkedCount < 3) healthStatus = "needs_linking";
      }

      // Update health status on client
      await supabase.from("clients").update({ client_health_status: healthStatus }).eq("id", client_id);

      return new Response(JSON.stringify({
        client,
        modules,
        email_duplicates: emailDups || [],
        phone_duplicates: phoneDups,
        unmatched_records: unmatchedForClient || [],
        health_status: healthStatus,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── UPDATE CLIENT HEALTH (bulk) ───
    if (action === "update_health_statuses") {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, email, phone, xero_contact_id")
        .eq("business_id", businessId)
        .is("deleted_at", null)
        .is("merged_into", null)
        .limit(500);

      if (!clients) return new Response(JSON.stringify({ updated: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      let updated = 0;
      for (const c of clients) {
        let status = "healthy";

        // Check email duplicates
        if (c.email) {
          const { count } = await supabase
            .from("clients").select("*", { count: "exact", head: true })
            .eq("business_id", businessId)
            .ilike("email", c.email)
            .is("deleted_at", null)
            .neq("id", c.id);
          if ((count || 0) > 0) status = "duplicate_risk";
        }

        if (status === "healthy" && !c.xero_contact_id) status = "missing_external_mapping";

        await supabase.from("clients").update({ client_health_status: status }).eq("id", c.id);
        updated++;
      }

      return new Response(JSON.stringify({ updated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── FINAL PRE-CONSTRAINT REPORT ───
    if (action === "pre_constraint_report") {
      const report: any = { unmatched_by_table: {}, duplicate_emails: 0, duplicate_phones: 0, auto_linked: 0, pending_manual: 0 };

      // Unmatched by table
      const { data: unmatched } = await supabase
        .from("unmatched_records")
        .select("source_table")
        .eq("business_id", businessId)
        .eq("resolution_status", "unmatched");
      
      const byTable: Record<string, number> = {};
      (unmatched || []).forEach((r: any) => { byTable[r.source_table] = (byTable[r.source_table] || 0) + 1; });
      report.unmatched_by_table = byTable;
      report.pending_manual = (unmatched || []).length;

      // Duplicate emails
      const { data: dupEmails } = await supabase.rpc("resolve_client_id", { _business_id: businessId }); // won't work, use raw
      // Just count from integrity report
      const { data: dups } = await supabase
        .from("client_integrity_report")
        .select("duplicate_email_count, duplicate_phone_count")
        .eq("business_id", businessId);
      
      report.duplicate_emails = (dups || []).filter((d: any) => d.duplicate_email_count > 0).length;
      report.duplicate_phones = (dups || []).filter((d: any) => d.duplicate_phone_count > 0).length;

      // Auto-linked from audit
      const { count: autoLinked } = await supabase
        .from("client_backfill_audit_log")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("is_dry_run", false);
      report.auto_linked = autoLinked || 0;

      return new Response(JSON.stringify(report), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
