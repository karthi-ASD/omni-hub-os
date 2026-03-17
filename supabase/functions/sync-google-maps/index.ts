import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({}));
  const targetProjectId = body.projectId || null;
  const now = new Date().toISOString();

  try {
    // Fetch active SEO projects
    let query = supabase.from("seo_projects").select("id, business_id, client_id").eq("project_status", "active");
    if (targetProjectId) query = query.eq("id", targetProjectId);
    const { data: projects } = await query;

    if (!projects?.length) {
      return new Response(JSON.stringify({ message: "No projects to sync" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let synced = 0, skipped = 0;

    for (const project of projects) {
      try {
        // Check if synced within 48 hours
        if (!targetProjectId) {
          const { data: syncStatus } = await supabase
            .from("analytics_sync_status")
            .select("last_sync_at")
            .eq("project_id", project.id)
            .eq("source", "google_maps")
            .maybeSingle();

          if (syncStatus?.last_sync_at) {
            const hoursSince = (Date.now() - new Date(syncStatus.last_sync_at).getTime()) / 3600000;
            if (hoursSince < 48) { skipped++; continue; }
          }
        }

        // Look up GBP connection
        const { data: connection } = await supabase
          .from("analytics_connections")
          .select("*")
          .eq("project_id", project.id)
          .eq("provider", "GBP")
          .eq("is_active", true)
          .maybeSingle();

        if (!connection?.credentials_encrypted || !connection?.location_id) {
          await upsertSync(supabase, project, now, "no_connection", "No active GBP connection with credentials");
          skipped++;
          continue;
        }

        // Decrypt credentials
        const { data: decrypted } = await supabase.rpc("decrypt_sensitive_field", {
          cipher_text: connection.credentials_encrypted,
        });

        let creds: any;
        try { creds = JSON.parse(decrypted); } catch {
          await upsertSync(supabase, project, now, "error", "Failed to parse credentials");
          skipped++;
          continue;
        }

        // Get access token from service account
        const accessToken = await getAccessToken(creds.service_account_json || creds.oauth_token);
        if (!accessToken) {
          await upsertSync(supabase, project, now, "error", "Failed to obtain access token");
          skipped++;
          continue;
        }

        // Fetch GBP performance data
        const locationId = connection.location_id;
        const today = new Date();
        const startDate = new Date(today.getTime() - 86400000).toISOString().split("T")[0];

        // Fetch location metrics via Business Profile Performance API
        const metricsUrl = `https://businessprofileperformance.googleapis.com/v1/${locationId}:getDailyMetricsTimeSeries?dailyMetric=WEBSITE_CLICKS&dailyMetric=CALL_CLICKS&dailyMetric=BUSINESS_DIRECTION_REQUESTS&dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_SEARCH&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_SEARCH&dailyRange.start_date.year=${today.getFullYear()}&dailyRange.start_date.month=${today.getMonth()}&dailyRange.start_date.day=1&dailyRange.end_date.year=${today.getFullYear()}&dailyRange.end_date.month=${today.getMonth() + 1}&dailyRange.end_date.day=${today.getDate()}`;

        const metricsRes = await fetch(metricsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        let viewsTotal = 0, viewsSearch = 0, viewsMaps = 0, webClicks = 0, directionReqs = 0, phoneCalls = 0;

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          const series = metricsData.timeSeries || [];

          for (const ts of series) {
            const latestValue = ts.labeledInsightDataPoints?.[0]?.value || 
                               ts.dailyMetricTimeSeries?.dailySubEntityType?.timeSeriesDataPoints?.slice(-1)?.[0]?.value || 0;
            const val = Number(latestValue) || 0;
            
            switch (ts.dailyMetric) {
              case "WEBSITE_CLICKS": webClicks += val; break;
              case "CALL_CLICKS": phoneCalls += val; break;
              case "BUSINESS_DIRECTION_REQUESTS": directionReqs += val; break;
              case "BUSINESS_IMPRESSIONS_DESKTOP_MAPS":
              case "BUSINESS_IMPRESSIONS_MOBILE_MAPS": viewsMaps += val; break;
              case "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH":
              case "BUSINESS_IMPRESSIONS_MOBILE_SEARCH": viewsSearch += val; break;
            }
          }
          viewsTotal = viewsMaps + viewsSearch;
        }

        // Fetch reviews via My Business API
        let reviewsCount = 0, avgRating = 0;
        try {
          const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?readMask=name`;
          const reviewsRes = await fetch(reviewsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
          if (reviewsRes.ok) {
            // Reviews are fetched separately — use Account Management API
            const accountReviewsUrl = `https://mybusiness.googleapis.com/v4/${locationId}/reviews`;
            const rRes = await fetch(accountReviewsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (rRes.ok) {
              const rData = await rRes.json();
              reviewsCount = rData.totalReviewCount || 0;
              avgRating = rData.averageRating || 0;
            }
          }
        } catch { /* reviews fetch optional */ }

        // Insert snapshot (never overwrite)
        await supabase.from("google_maps_daily_stats").upsert({
          project_id: project.id,
          client_id: project.client_id,
          business_id: project.business_id,
          snapshot_date: startDate,
          views_total: viewsTotal,
          views_search: viewsSearch,
          views_maps: viewsMaps,
          website_clicks: webClicks,
          direction_requests: directionReqs,
          phone_calls: phoneCalls,
          messages: 0,
          reviews_count: reviewsCount,
          average_rating: avgRating,
        } as any, { onConflict: "project_id,snapshot_date" });

        await upsertSync(supabase, project, now, "synced", null);
        synced++;
      } catch (err: any) {
        await upsertSync(supabase, project, now, "error", err.message?.slice(0, 200));
        skipped++;
      }
    }

    return new Response(JSON.stringify({ synced, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function upsertSync(supabase: any, project: any, now: string, status: string, error: string | null) {
  const nextSync = new Date(Date.now() + 48 * 3600000).toISOString();
  await supabase.from("analytics_sync_status").upsert({
    business_id: project.business_id,
    project_id: project.id,
    client_id: project.client_id,
    source: "google_maps",
    sync_status: status,
    last_sync_at: status === "synced" ? now : undefined,
    next_sync_at: nextSync,
    error_message: error,
    retry_count: status === "error" ? 1 : 0,
  } as any, { onConflict: "project_id,source" });
}

async function getAccessToken(credential: string): Promise<string | null> {
  if (!credential) return null;

  // If it's a raw OAuth token, return directly
  if (!credential.startsWith("{")) return credential;

  try {
    const sa = JSON.parse(credential);
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/business.manage",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }));

    // Import private key and sign
    const keyData = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
    );

    const signInput = new TextEncoder().encode(`${header}.${claim}`);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signInput);
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const jwt = `${header}.${claim}.${sig}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    return tokenData.access_token || null;
  } catch {
    return null;
  }
}
