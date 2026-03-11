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

    const { platform, business_id, client_id, campaigns } = await req.json();

    if (!platform || !business_id || !campaigns?.length) {
      return new Response(JSON.stringify({ error: "Missing platform, business_id, or campaigns" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert campaign data
    const rows = campaigns.map((c: any) => ({
      business_id,
      client_id: client_id || null,
      platform,
      campaign_name: c.campaign_name || "Unknown",
      campaign_external_id: c.campaign_external_id || null,
      status: c.status || "active",
      date: c.date || new Date().toISOString().split("T")[0],
      spend: c.spend || 0,
      clicks: c.clicks || 0,
      impressions: c.impressions || 0,
      conversions: c.conversions || 0,
      leads: c.leads || 0,
      cpc: c.impressions > 0 ? (c.spend / Math.max(c.clicks, 1)).toFixed(4) : 0,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(4) : 0,
    }));

    const { error } = await supabase.from("ads_campaigns").insert(rows);
    if (error) throw error;

    // Also update analytics_daily_metrics with aggregate ads data per date
    const dateMap: Record<string, { spend: number; clicks: number; impressions: number }> = {};
    for (const r of rows) {
      if (!dateMap[r.date]) dateMap[r.date] = { spend: 0, clicks: 0, impressions: 0 };
      dateMap[r.date].spend += Number(r.spend);
      dateMap[r.date].clicks += Number(r.clicks);
      dateMap[r.date].impressions += Number(r.impressions);
    }

    for (const [date, agg] of Object.entries(dateMap)) {
      await supabase.from("analytics_daily_metrics").upsert({
        business_id,
        date,
        ads_spend: agg.spend,
        ads_clicks: agg.clicks,
        ads_impressions: agg.impressions,
      }, { onConflict: "business_id,date" });
    }

    return new Response(JSON.stringify({ success: true, synced: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
