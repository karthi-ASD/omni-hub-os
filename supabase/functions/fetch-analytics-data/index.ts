import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { source, business_id, client_id, project_id, date_from, date_to, metrics } = await req.json();

    if (!source || !business_id) {
      return new Response(JSON.stringify({ error: "source and business_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine target table
    const tableMap: Record<string, string> = {
      ga: "analytics_snapshots",
      google_analytics: "analytics_snapshots",
      gsc: "seo_snapshots",
      search_console: "seo_snapshots",
      google_ads: "ads_snapshots",
      facebook_ads: "ads_snapshots",
    };
    const tableName = tableMap[source] || "analytics_snapshots";

    // Check for existing data today (caching - prevent duplicate API calls)
    const today = new Date().toISOString().split("T")[0];
    const targetDate = date_from || today;

    const { data: existing } = await supabase
      .from(tableName)
      .select("id")
      .eq("business_id", business_id)
      .eq("source", source)
      .eq("date", targetDate)
      .eq("client_id", client_id || null)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: true, cached: true, 
        message: "Data already exists for this date/source" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the metrics snapshot
    const row = {
      business_id,
      client_id: client_id || null,
      project_id: project_id || null,
      source,
      date: targetDate,
      metrics_json: metrics || {},
    };

    const { error } = await supabase.from(tableName).insert(row);
    if (error) throw error;

    // Also update analytics_daily_metrics if it's GA data
    if (source === "ga" || source === "google_analytics") {
      await supabase.from("analytics_daily_metrics").upsert({
        business_id,
        date: targetDate,
        sessions: metrics?.sessions || 0,
        users_count: metrics?.users || 0,
        leads_count: metrics?.conversions || 0,
      }, { onConflict: "business_id,date" });

      // Store historical snapshot in google_analytics_daily_stats (never overwrite)
      if (project_id) {
        const { data: existingSnapshot } = await supabase
          .from("google_analytics_daily_stats")
          .select("id")
          .eq("project_id", project_id)
          .eq("snapshot_date", targetDate)
          .limit(1);

        if (!existingSnapshot || existingSnapshot.length === 0) {
          await supabase.from("google_analytics_daily_stats").insert({
            project_id,
            client_id: client_id || null,
            business_id,
            snapshot_date: targetDate,
            users_count: metrics?.users || 0,
            sessions: metrics?.sessions || 0,
            pageviews: metrics?.pageviews || 0,
            bounce_rate: metrics?.bounce_rate || 0,
            avg_session_duration: metrics?.avg_session_duration || 0,
            organic_traffic: metrics?.organic_traffic || 0,
            direct_traffic: metrics?.direct_traffic || 0,
            paid_traffic: metrics?.paid_traffic || 0,
            referral_traffic: metrics?.referral_traffic || 0,
            conversions: metrics?.conversions || 0,
            top_pages_json: metrics?.top_pages || [],
          });
        }
      }
    }

    // If it's GSC data, update gsc_data table too
    if (source === "gsc" || source === "search_console") {
      const queries = metrics?.queries || [];
      for (const q of queries.slice(0, 100)) {
        await supabase.from("gsc_data").upsert({
          business_id,
          client_id: client_id || null,
          seo_project_id: project_id || null,
          query: q.query || "(unknown)",
          clicks: q.clicks || 0,
          impressions: q.impressions || 0,
          ctr: q.ctr || 0,
          position: q.position || 0,
          date: targetDate,
        }, { onConflict: "seo_project_id,query,date" });
      }
    }

    return new Response(JSON.stringify({ success: true, stored: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("fetch-analytics-data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
