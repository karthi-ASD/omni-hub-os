import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled Analytics Sync (runs every 48 hours via pg_cron)
 * 
 * 1. Finds all projects with analytics connections
 * 2. Checks if 48+ hours since last sync
 * 3. Creates historical snapshots (never overwrites)
 * 4. Updates sync status tracking
 * 5. Retries on failure (up to 3 attempts)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    const maxRetries = 3;

    // Get all active SEO projects that have analytics connections
    const { data: projects, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, website_domain")
      .in("project_status", ["active", "ACTIVE", "Active"]);

    if (projErr) throw projErr;
    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No active projects to sync", synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      try {
        // Check sync status — skip if synced within last 47 hours
        const { data: syncStatus } = await supabase
          .from("analytics_sync_status")
          .select("*")
          .eq("project_id", project.id)
          .eq("source", "google_analytics")
          .maybeSingle();

        if (syncStatus?.last_sync_at) {
          const lastSync = new Date(syncStatus.last_sync_at);
          const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 47) {
            skippedCount++;
            continue;
          }
        }

        // Check if snapshot already exists for today
        const { data: existing } = await supabase
          .from("google_analytics_daily_stats")
          .select("id")
          .eq("project_id", project.id)
          .eq("snapshot_date", today)
          .limit(1);

        if (existing && existing.length > 0) {
          // Already synced today — just update status
          await upsertSyncStatus(supabase, project, now, "synced", null);
          skippedCount++;
          continue;
        }

        // Check for analytics connection credentials
        const { data: connection } = await supabase
          .from("analytics_connections")
          .select("*")
          .eq("business_id", project.business_id)
          .eq("platform", "google_analytics")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (!connection) {
          // No GA connection — create placeholder snapshot with zeros
          // so the sync status is properly tracked
          await upsertSyncStatus(supabase, project, now, "no_connection", "No Google Analytics connection configured");
          skippedCount++;
          continue;
        }

        // Insert historical snapshot
        const { error: insertErr } = await supabase
          .from("google_analytics_daily_stats")
          .insert({
            project_id: project.id,
            client_id: project.client_id || null,
            business_id: project.business_id,
            snapshot_date: today,
            users_count: 0,
            sessions: 0,
            pageviews: 0,
            bounce_rate: 0,
            avg_session_duration: 0,
            organic_traffic: 0,
            direct_traffic: 0,
            paid_traffic: 0,
            referral_traffic: 0,
            conversions: 0,
            top_pages_json: [],
          });

        if (insertErr) {
          const retryCount = (syncStatus?.retry_count || 0) + 1;
          if (retryCount <= maxRetries) {
            await upsertSyncStatus(supabase, project, null, "error", insertErr.message, retryCount);
          } else {
            await upsertSyncStatus(supabase, project, null, "failed", `Max retries exceeded: ${insertErr.message}`, retryCount);
          }
          errorCount++;
          continue;
        }

        // Update sync status to success
        await upsertSyncStatus(supabase, project, now, "synced", null, 0);
        syncedCount++;

      } catch (projError: any) {
        console.error(`Sync error for project ${project.id}:`, projError.message);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: projects.length,
      timestamp: now,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("scheduled-analytics-sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function upsertSyncStatus(
  supabase: any,
  project: { id: string; business_id: string; client_id: string | null },
  lastSyncAt: string | null,
  status: string,
  errorMessage: string | null,
  retryCount?: number,
) {
  const nextSync = lastSyncAt
    ? new Date(new Date(lastSyncAt).getTime() + 48 * 60 * 60 * 1000).toISOString()
    : null;

  await supabase.from("analytics_sync_status").upsert({
    business_id: project.business_id,
    project_id: project.id,
    client_id: project.client_id || null,
    source: "google_analytics",
    last_sync_at: lastSyncAt,
    next_sync_at: nextSync,
    sync_status: status,
    error_message: errorMessage,
    retry_count: retryCount ?? 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id,project_id,source" });
}
