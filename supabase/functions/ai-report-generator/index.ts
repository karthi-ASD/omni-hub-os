import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { business_id, period, user_id } = await req.json();
    if (!business_id || !period) {
      return new Response(JSON.stringify({ error: "business_id and period required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine date range from period (e.g. "2026-03")
    const [year, month] = period.split("-").map(Number);
    const startDate = `${period}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    // Fetch data from all source tables in parallel
    const [analyticsRes, seoRes, leadsRes, revenueRes] = await Promise.all([
      supabase
        .from("analytics_daily_metrics")
        .select("*")
        .eq("business_id", business_id)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date"),
      supabase
        .from("seo_reports")
        .select("*")
        .eq("business_id", business_id)
        .eq("report_month", period),
      supabase
        .from("fact_leads")
        .select("*")
        .eq("business_id", business_id)
        .eq("period", period),
      supabase
        .from("fact_revenue")
        .select("*")
        .eq("business_id", business_id)
        .eq("period", period),
    ]);

    const analytics = analyticsRes.data || [];
    const seoReports = seoRes.data || [];
    const leads = leadsRes.data || [];
    const revenue = revenueRes.data || [];

    // Compute summary stats for the prompt
    const totalSessions = analytics.reduce((s: number, r: any) => s + (r.sessions || 0), 0);
    const totalUsers = analytics.reduce((s: number, r: any) => s + (r.users_count || 0), 0);
    const totalLeadsFromAnalytics = analytics.reduce((s: number, r: any) => s + (r.leads_count || 0), 0);
    const totalGscClicks = analytics.reduce((s: number, r: any) => s + (r.gsc_clicks || 0), 0);
    const totalGscImpressions = analytics.reduce((s: number, r: any) => s + (r.gsc_impressions || 0), 0);
    const avgPosition = analytics.length > 0
      ? analytics.reduce((s: number, r: any) => s + (r.gsc_avg_position || 0), 0) / analytics.length
      : 0;
    const totalCalls = analytics.reduce((s: number, r: any) => s + (r.calls_count || 0), 0);
    const totalAdSpend = analytics.reduce((s: number, r: any) => s + (r.ads_spend || 0), 0);
    const totalAdClicks = analytics.reduce((s: number, r: any) => s + (r.ads_clicks || 0), 0);

    const totalFactLeads = leads.reduce((s: number, r: any) => s + (r.total_leads || 0), 0);
    const convertedLeads = leads.reduce((s: number, r: any) => s + (r.converted || 0), 0);
    const conversionRate = leads.length > 0
      ? leads.reduce((s: number, r: any) => s + (r.conversion_rate || 0), 0) / leads.length
      : 0;

    const totalRevenue = revenue.reduce((s: number, r: any) => s + (r.revenue || 0), 0);
    const invoiceCount = revenue.reduce((s: number, r: any) => s + (r.invoice_count || 0), 0);
    const paidCount = revenue.reduce((s: number, r: any) => s + (r.paid_count || 0), 0);

    const dataSnapshot = {
      period,
      analytics: { totalSessions, totalUsers, totalLeadsFromAnalytics, totalGscClicks, totalGscImpressions, avgPosition: avgPosition.toFixed(1), totalCalls, totalAdSpend, totalAdClicks, daysTracked: analytics.length },
      seo: { reportsCount: seoReports.length, summaries: seoReports.map((r: any) => r.summary_json) },
      leads: { totalFactLeads, convertedLeads, conversionRate: conversionRate.toFixed(1) },
      revenue: { totalRevenue, invoiceCount, paidCount },
    };

    // Build AI prompt
    const systemPrompt = `You are a business intelligence analyst generating a monthly performance report. Write a clear, professional summary in plain English. Use bullet points. Include insights, trends, and actionable recommendations. Mention specific numbers. Keep it under 500 words. Format with markdown.`;

    const userPrompt = `Generate a monthly performance report for period: ${period}

DATA:
- Website: ${totalSessions} sessions, ${totalUsers} unique users
- SEO: ${totalGscClicks} search clicks, ${totalGscImpressions} impressions, avg position ${avgPosition.toFixed(1)}
- Leads: ${totalFactLeads} total leads, ${convertedLeads} converted (${conversionRate.toFixed(1)}% rate)
- Revenue: $${totalRevenue.toLocaleString()} from ${invoiceCount} invoices (${paidCount} paid)
- Calls: ${totalCalls} phone calls received
- Ads: $${totalAdSpend.toFixed(2)} spent, ${totalAdClicks} clicks
- SEO Reports: ${seoReports.length} published
- Days of analytics data: ${analytics.length}

Write the report as if presenting to a business owner. Include:
1. Executive Summary (2-3 sentences)
2. Traffic & SEO Performance
3. Lead Generation & Conversion
4. Revenue & Financial Health
5. Key Recommendations (3-5 actionable items)

If data is zero or missing, note it as "No data available for this period" rather than drawing conclusions.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices?.[0]?.message?.content || "Unable to generate summary.";

    // Store report
    const { data: report, error: insertError } = await supabase
      .from("ai_reports")
      .insert({
        business_id,
        report_type: "monthly_summary",
        report_period: period,
        summary_text: summaryText,
        data_snapshot_json: dataSnapshot,
        generated_by_user_id: user_id || null,
        model_used: "google/gemini-3-flash-preview",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ report }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-report-generator error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
