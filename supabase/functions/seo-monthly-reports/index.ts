import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const currentMonth = new Date().toISOString().slice(0, 7);
    const results: any = { reports_generated: 0, emails_queued: 0 };

    // Get all active SEO projects
    const { data: projects } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, website_domain, project_name")
      .eq("project_status", "active");

    if (!projects?.length) {
      return new Response(JSON.stringify({ success: true, message: "No active projects" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const project of projects) {
      // Check if report already exists for this month
      const { data: existing } = await supabase
        .from("seo_reports")
        .select("id")
        .eq("campaign_id", project.id)
        .eq("report_month", currentMonth)
        .maybeSingle();

      if (existing) continue;

      // Gather data for report
      const [keywordsRes, competitorsRes, auditsRes, roadmapRes, trafficRes, backlinksRes] = await Promise.all([
        (supabase.from("seo_keyword_intelligence") as any).select("*").eq("seo_project_id", project.id).limit(50),
        supabase.from("seo_competitors").select("*").eq("seo_project_id", project.id).limit(30),
        (supabase.from("seo_page_audits") as any).select("*").eq("seo_project_id", project.id).limit(10),
        (supabase.from("seo_roadmap_items") as any).select("*").eq("seo_project_id", project.id),
        (supabase.from("seo_traffic_estimates") as any).select("*").eq("seo_project_id", project.id).order("estimated_at", { ascending: false }).limit(1),
        (supabase.from("seo_backlinks") as any).select("*").eq("seo_project_id", project.id).limit(20),
      ]);

      const keywords = keywordsRes.data || [];
      const competitors = competitorsRes.data || [];
      const audits = auditsRes.data || [];
      const roadmapItems = roadmapRes.data || [];
      const traffic = trafficRes.data?.[0];
      const backlinks = backlinksRes.data || [];

      const completedRoadmap = roadmapItems.filter((r: any) => r.status === "completed").length;
      const totalRoadmap = roadmapItems.length;

      // Generate AI summary
      let summary = "";
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{
              role: "user",
              content: `Generate a professional monthly SEO performance summary for client report.
Domain: ${project.website_domain}
Keywords tracked: ${keywords.length}
Competitors monitored: ${competitors.length}
Backlinks tracked: ${backlinks.length}
Traffic estimate: ${traffic?.estimated_monthly_traffic || 0}/mo
Roadmap progress: ${completedRoadmap}/${totalRoadmap} tasks complete
Page audit scores: ${audits.map((a: any) => `${a.page_url}: ${a.seo_score}/100`).join(", ")}

Write a 3-paragraph professional summary covering: overall SEO health, key improvements made, and recommended next actions. Keep it concise and client-friendly.`
            }],
            temperature: 0.5,
          }),
        });
        const aiData = await resp.json();
        summary = aiData.choices?.[0]?.message?.content || "";
      } catch (e) {
        console.error("AI summary error:", e);
        summary = `Monthly SEO report for ${project.website_domain}. ${keywords.length} keywords tracked, ${competitors.length} competitors monitored.`;
      }

      // Store report
      const reportData = {
        business_id: project.business_id,
        campaign_id: project.id,
        report_month: currentMonth,
        report_type: "monthly",
        summary_json: {
          summary,
          keywords_count: keywords.length,
          competitors_count: competitors.length,
          backlinks_count: backlinks.length,
          traffic_estimate: traffic?.estimated_monthly_traffic || 0,
          roadmap_progress: { completed: completedRoadmap, total: totalRoadmap },
          top_keywords: keywords.slice(0, 10).map((k: any) => ({ keyword: k.keyword, opportunity: k.opportunity_score })),
          audit_scores: audits.map((a: any) => ({ url: a.page_url, score: a.seo_score })),
        },
        status: "generated",
      };

      await supabase.from("seo_reports").insert(reportData as any);
      results.reports_generated++;

      // Send notification to client
      if (project.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("contact_name, email")
          .eq("id", project.client_id)
          .single();

        if (client?.email) {
          await supabase.from("notifications").insert({
            business_id: project.business_id,
            type: "info",
            title: `Monthly SEO Report — ${currentMonth}`,
            message: `Your SEO performance report for ${project.website_domain} is ready. View it in your client portal.`,
          });
          results.emails_queued++;
        }
      }

      // Notify assigned SEO team
      const { data: campaign } = await supabase
        .from("seo_campaigns")
        .select("assigned_seo_manager_user_id, assigned_seo_executive_user_id")
        .eq("project_id", project.id)
        .maybeSingle();

      if (campaign?.assigned_seo_manager_user_id) {
        await supabase.from("notifications").insert({
          business_id: project.business_id,
          user_id: campaign.assigned_seo_manager_user_id,
          type: "info",
          title: `Monthly Report Generated`,
          message: `${currentMonth} SEO report for "${project.website_domain}" has been auto-generated.`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Monthly report error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
