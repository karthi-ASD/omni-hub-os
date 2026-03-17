import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Scheduled Analytics Sync (runs every 48 hours via pg_cron)
 *
 * 1. Finds all active SEO projects
 * 2. Looks up analytics_connections by project's business_id
 * 3. Calls GA4 Data API (runReport) for real metrics
 * 4. Creates historical snapshots (never overwrites)
 * 5. Updates sync status tracking
 * 6. Retries on failure (up to 3 attempts)
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

    // Get all active SEO projects
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
        // Check sync status — skip if synced within last 48 hours
        const { data: syncStatus } = await supabase
          .from("analytics_sync_status")
          .select("*")
          .eq("project_id", project.id)
          .eq("source", "google_analytics")
          .maybeSingle();

        if (syncStatus?.last_sync_at) {
          const lastSync = new Date(syncStatus.last_sync_at);
          const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 48) {
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
          await upsertSyncStatus(supabase, project, now, "synced", null, 0);
          skippedCount++;
          continue;
        }

        // Look up analytics connection by project's business_id
        const { data: connection } = await supabase
          .from("analytics_connections")
          .select("*")
          .eq("business_id", project.business_id)
          .eq("provider", "google_analytics")
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (!connection || !connection.token_encrypted || !connection.external_account_id) {
          await upsertSyncStatus(supabase, project, now, "no_connection", "No active Google Analytics connection with credentials");
          skippedCount++;
          continue;
        }

        // Decrypt the access token
        let accessToken: string;
        try {
          const { data: decrypted } = await supabase.rpc("decrypt_sensitive_field", {
            cipher_text: connection.token_encrypted,
          });
          accessToken = decrypted;
        } catch {
          await upsertSyncStatus(supabase, project, null, "error", "Failed to decrypt access token");
          errorCount++;
          continue;
        }

        // If we have a refresh token, try to refresh first
        if (connection.refresh_token_encrypted) {
          try {
            const { data: refreshToken } = await supabase.rpc("decrypt_sensitive_field", {
              cipher_text: connection.refresh_token_encrypted,
            });
            const clientId = Deno.env.get("GMAIL_OAUTH_CLIENT_ID");
            const clientSecret = Deno.env.get("GMAIL_OAUTH_CLIENT_SECRET");

            if (clientId && clientSecret && refreshToken) {
              const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  grant_type: "refresh_token",
                  refresh_token: refreshToken,
                  client_id: clientId,
                  client_secret: clientSecret,
                }),
              });
              if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                accessToken = tokenData.access_token;
                // Update stored token
                const { data: encrypted } = await supabase.rpc("encrypt_sensitive_field", {
                  plain_text: accessToken,
                });
                if (encrypted) {
                  await supabase
                    .from("analytics_connections")
                    .update({ token_encrypted: encrypted })
                    .eq("id", connection.id);
                }
              }
            }
          } catch (refreshErr) {
            console.error("Token refresh failed, using existing token:", refreshErr);
          }
        }

        // Call GA4 Data API - runReport
        const propertyId = connection.external_account_id;
        const ga4Url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

        // Fetch main metrics
        const metricsReport = await fetchGA4Report(accessToken, ga4Url, {
          dateRanges: [{ startDate: today, endDate: today }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "conversions" },
          ],
        });

        // Fetch traffic source breakdown
        const sourceReport = await fetchGA4Report(accessToken, ga4Url, {
          dateRanges: [{ startDate: today, endDate: today }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
        });

        // Fetch top pages
        const pagesReport = await fetchGA4Report(accessToken, ga4Url, {
          dateRanges: [{ startDate: today, endDate: today }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
          ],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "10",
        });

        // Parse main metrics
        const mainRow = metricsReport?.rows?.[0]?.metricValues || [];
        const users = parseInt(mainRow[0]?.value || "0");
        const sessions = parseInt(mainRow[1]?.value || "0");
        const pageviews = parseInt(mainRow[2]?.value || "0");
        const bounceRate = parseFloat(mainRow[3]?.value || "0") * 100;
        const avgSessionDuration = parseFloat(mainRow[4]?.value || "0");
        const conversions = parseInt(mainRow[5]?.value || "0");

        // Parse traffic sources
        let organic = 0, direct = 0, paid = 0, referral = 0;
        if (sourceReport?.rows) {
          for (const row of sourceReport.rows) {
            const channel = (row.dimensionValues?.[0]?.value || "").toLowerCase();
            const sessCount = parseInt(row.metricValues?.[0]?.value || "0");
            if (channel.includes("organic")) organic += sessCount;
            else if (channel.includes("direct")) direct += sessCount;
            else if (channel.includes("paid") || channel.includes("cpc")) paid += sessCount;
            else if (channel.includes("referral")) referral += sessCount;
          }
        }

        // Parse top pages
        const topPages = (pagesReport?.rows || []).slice(0, 10).map((row: any) => ({
          path: row.dimensionValues?.[0]?.value || "/",
          views: parseInt(row.metricValues?.[0]?.value || "0"),
          avgDuration: parseFloat(row.metricValues?.[1]?.value || "0"),
        }));

        // Insert historical snapshot
        const { error: insertErr } = await supabase
          .from("google_analytics_daily_stats")
          .insert({
            project_id: project.id,
            client_id: project.client_id || null,
            business_id: project.business_id,
            snapshot_date: today,
            users_count: users,
            sessions,
            pageviews,
            bounce_rate: Math.round(bounceRate * 100) / 100,
            avg_session_duration: Math.round(avgSessionDuration),
            organic_traffic: organic,
            direct_traffic: direct,
            paid_traffic: paid,
            referral_traffic: referral,
            conversions,
            top_pages_json: topPages,
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

        // Update sync status
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

async function fetchGA4Report(accessToken: string, url: string, body: any): Promise<any> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`GA4 API error (${res.status}):`, errorText);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("GA4 fetch error:", err);
    return null;
  }
}

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
