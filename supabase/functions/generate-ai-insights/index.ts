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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { business_id, client_id, project_id } = await req.json();

    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dateStr = (d: Date) => d.toISOString().split("T")[0];

    // Fetch current period metrics
    let metricsQuery = supabase
      .from("analytics_daily_metrics")
      .select("*")
      .eq("business_id", business_id)
      .gte("date", dateStr(sevenDaysAgo))
      .lte("date", dateStr(today));

    let prevQuery = supabase
      .from("analytics_daily_metrics")
      .select("*")
      .eq("business_id", business_id)
      .gte("date", dateStr(fourteenDaysAgo))
      .lt("date", dateStr(sevenDaysAgo));

    const [{ data: currentMetrics }, { data: prevMetrics }] = await Promise.all([
      metricsQuery, prevQuery,
    ]);

    // Aggregate
    const sum = (rows: any[], field: string) =>
      (rows || []).reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

    const current = {
      sessions: sum(currentMetrics, "sessions"),
      users: sum(currentMetrics, "users_count"),
      leads: sum(currentMetrics, "leads_count"),
      gsc_clicks: sum(currentMetrics, "gsc_clicks"),
      gsc_impressions: sum(currentMetrics, "gsc_impressions"),
      ads_spend: sum(currentMetrics, "ads_spend"),
      ads_clicks: sum(currentMetrics, "ads_clicks"),
    };

    const previous = {
      sessions: sum(prevMetrics, "sessions"),
      users: sum(prevMetrics, "users_count"),
      leads: sum(prevMetrics, "leads_count"),
      gsc_clicks: sum(prevMetrics, "gsc_clicks"),
      gsc_impressions: sum(prevMetrics, "gsc_impressions"),
      ads_spend: sum(prevMetrics, "ads_spend"),
      ads_clicks: sum(prevMetrics, "ads_clicks"),
    };

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const insights: { title: string; description: string; severity: string; insight_type: string; source_data_json: any }[] = [];

    // Traffic insights
    const trafficChange = pctChange(current.sessions, previous.sessions);
    if (Math.abs(trafficChange) >= 10) {
      const direction = trafficChange > 0 ? "increased" : "dropped";
      const severity = trafficChange < -20 ? "warning" : trafficChange > 20 ? "success" : "info";
      insights.push({
        title: `Traffic ${direction} by ${Math.abs(trafficChange)}%`,
        description: `Website sessions ${direction} from ${previous.sessions} to ${current.sessions} compared to the previous 7 days.`,
        severity,
        insight_type: "traffic",
        source_data_json: { current: current.sessions, previous: previous.sessions, change: trafficChange },
      });
    }

    // Lead insights
    const leadChange = pctChange(current.leads, previous.leads);
    if (Math.abs(leadChange) >= 10) {
      const direction = leadChange > 0 ? "increased" : "decreased";
      insights.push({
        title: `Leads ${direction} by ${Math.abs(leadChange)}%`,
        description: `Lead generation ${direction} from ${previous.leads} to ${current.leads} this week.`,
        severity: leadChange < -20 ? "warning" : "info",
        insight_type: "leads",
        source_data_json: { current: current.leads, previous: previous.leads, change: leadChange },
      });
    }

    // GSC insights
    const gscClickChange = pctChange(current.gsc_clicks, previous.gsc_clicks);
    if (Math.abs(gscClickChange) >= 15) {
      const direction = gscClickChange > 0 ? "increased" : "dropped";
      insights.push({
        title: `Search clicks ${direction} by ${Math.abs(gscClickChange)}%`,
        description: `Google Search clicks ${direction} from ${previous.gsc_clicks} to ${current.gsc_clicks}.`,
        severity: gscClickChange < -20 ? "warning" : "info",
        insight_type: "seo",
        source_data_json: { current: current.gsc_clicks, previous: previous.gsc_clicks, change: gscClickChange },
      });
    }

    // Ad spend insights
    const spendChange = pctChange(current.ads_spend, previous.ads_spend);
    if (Math.abs(spendChange) >= 20) {
      const direction = spendChange > 0 ? "increased" : "decreased";
      insights.push({
        title: `Ad spend ${direction} by ${Math.abs(spendChange)}%`,
        description: `Advertising spend ${direction} from $${previous.ads_spend.toFixed(2)} to $${current.ads_spend.toFixed(2)}.`,
        severity: spendChange > 30 ? "warning" : "info",
        insight_type: "ads",
        source_data_json: { current: current.ads_spend, previous: previous.ads_spend, change: spendChange },
      });
    }

    // Ad CTR change
    const currentCtr = current.ads_clicks > 0 && current.ads_spend > 0
      ? (current.ads_clicks / Math.max(sum(currentMetrics, "ads_impressions"), 1)) * 100 : 0;
    const prevCtr = previous.ads_clicks > 0 && previous.ads_spend > 0
      ? (previous.ads_clicks / Math.max(sum(prevMetrics, "ads_impressions"), 1)) * 100 : 0;
    const ctrChange = pctChange(currentCtr, prevCtr);
    if (Math.abs(ctrChange) >= 10 && prevCtr > 0) {
      const direction = ctrChange > 0 ? "improved" : "dropped";
      insights.push({
        title: `Ad CTR ${direction} by ${Math.abs(ctrChange)}%`,
        description: `Click-through rate ${direction} from ${prevCtr.toFixed(2)}% to ${currentCtr.toFixed(2)}%.`,
        severity: ctrChange < -15 ? "warning" : "info",
        insight_type: "ads",
        source_data_json: { current: currentCtr, previous: prevCtr, change: ctrChange },
      });
    }

    // Use AI for deeper insights if available
    if (lovableApiKey && (currentMetrics?.length || 0) > 0) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are a digital marketing analyst. Given performance metrics, provide 2-3 brief actionable insights. Return JSON array: [{title, description, severity}]. severity: info|warning|success. Keep descriptions under 100 chars."
              },
              {
                role: "user",
                content: `Current 7 days: ${JSON.stringify(current)}\nPrevious 7 days: ${JSON.stringify(previous)}\nChanges: traffic ${trafficChange}%, leads ${leadChange}%, spend ${spendChange}%`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "return_insights",
                description: "Return marketing insights",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          severity: { type: "string", enum: ["info", "warning", "success"] }
                        },
                        required: ["title", "description", "severity"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["insights"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "return_insights" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const parsed = JSON.parse(toolCall.function.arguments);
            for (const ai of (parsed.insights || [])) {
              insights.push({
                title: ai.title,
                description: ai.description,
                severity: ai.severity || "info",
                insight_type: "ai_analysis",
                source_data_json: { ai_generated: true },
              });
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI insights generation failed (non-critical):", aiErr);
      }
    }

    // Store insights
    if (insights.length > 0) {
      const rows = insights.map(i => ({
        business_id,
        client_id: client_id || null,
        project_id: project_id || null,
        ...i,
      }));
      await supabase.from("ai_insights").insert(rows);
    }

    // Calculate and store ROI
    if (current.ads_spend > 0 || current.leads > 0) {
      const estimatedRevenue = current.leads * 500; // Configurable average deal value
      const roiMultiple = current.ads_spend > 0 ? estimatedRevenue / current.ads_spend : 0;

      await supabase.from("roi_metrics").upsert({
        business_id,
        client_id: client_id || null,
        project_id: project_id || null,
        period_start: dateStr(sevenDaysAgo),
        period_end: dateStr(today),
        total_spend: current.ads_spend,
        leads_generated: current.leads,
        estimated_revenue: estimatedRevenue,
        roi_multiple: Math.round(roiMultiple * 100) / 100,
        breakdown_json: {
          sessions: current.sessions,
          gsc_clicks: current.gsc_clicks,
          ads_clicks: current.ads_clicks,
        },
      }, { onConflict: "business_id,period_start,period_end" });
    }

    // Smart alerts: traffic drop > 20%
    if (trafficChange < -20) {
      // Get all admin users for this business
      const { data: admins } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("business_id", business_id);
      
      for (const admin of (admins || []).slice(0, 10)) {
        await supabase.from("notifications").insert({
          business_id,
          user_id: admin.user_id,
          type: "warning",
          title: "⚠️ Traffic Alert",
          message: `Traffic dropped by ${Math.abs(trafficChange)}% this week. Review SEO and ad campaigns.`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      insights_generated: insights.length,
      period: { from: dateStr(sevenDaysAgo), to: dateStr(today) },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-ai-insights error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
