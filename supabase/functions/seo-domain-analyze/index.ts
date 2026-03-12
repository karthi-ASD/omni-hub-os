import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { domain, business_id, seo_project_id } = await req.json();
    if (!domain || !business_id) throw new Error("domain and business_id required");

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");

    // Create analysis record
    const { data: analysis } = await supabase.from("seo_domain_analyses").insert({
      business_id, seo_project_id, domain: cleanDomain, status: "processing",
      started_at: new Date().toISOString(),
    }).select().single();

    const analysisId = analysis?.id;

    // Step 1: Fetch the actual website to analyze
    let pageHtml = "";
    let pageTitle = "";
    let metaDesc = "";
    let fetchError = false;
    try {
      const resp = await fetch(`https://${cleanDomain}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NextWebBot/1.0)" },
        redirect: "follow",
      });
      pageHtml = await resp.text();
      const titleMatch = pageHtml.match(/<title[^>]*>(.*?)<\/title>/i);
      pageTitle = titleMatch?.[1]?.trim() || "";
      const descMatch = pageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
      metaDesc = descMatch?.[1]?.trim() || "";
    } catch (e) {
      console.error("Fetch error:", e);
      fetchError = true;
    }

    // Step 2: Use AI to generate comprehensive SEO analysis
    let aiAnalysis: any = {};
    if (lovableApiKey && !fetchError) {
      try {
        const truncatedHtml = pageHtml.substring(0, 8000);
        const aiResp = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "user",
              content: `Analyze this website for SEO. Domain: ${cleanDomain}
Title: ${pageTitle}
Meta Description: ${metaDesc}
HTML snippet: ${truncatedHtml}

Return a JSON object with these exact keys:
{
  "seo_score": (0-100 integer),
  "estimated_monthly_traffic": (integer estimate),
  "keywords": [{"keyword": "...", "type": "primary|secondary|long_tail|lsi|local|question", "intent": "informational|transactional|navigational|commercial", "estimated_volume": "high|medium|low", "difficulty": (0-100), "opportunity": (0-100)}] (generate at least 40 diverse keywords),
  "on_page_issues": [{"issue": "...", "severity": "high|medium|low", "recommendation": "..."}],
  "technical_issues": [{"issue": "...", "severity": "high|medium|low"}],
  "page_audit": {"title_score": (0-100), "meta_score": (0-100), "heading_score": (0-100), "content_score": (0-100), "internal_linking_score": (0-100), "schema_score": (0-100), "speed_score": (0-100), "mobile_score": (0-100)},
  "top_pages": [{"url": "...", "estimated_traffic": (int)}],
  "content_gaps": [{"topic": "...", "type": "service_page|blog|faq|location_page", "priority": "high|medium|low"}],
  "roadmap_items": [{"title": "...", "category": "technical|metadata|content|internal_linking|backlinks|local_seo", "priority": "high|medium|low", "impact": "high|medium|low"}],
  "internal_link_suggestions": [{"source": "...", "target": "...", "anchor_text": "..."}],
  "competitor_domains": ["domain1.com", "domain2.com"] (list 15 likely competitor domains in Australia)
}
Only return valid JSON, no markdown.`
            }],
            temperature: 0.3,
          }),
        });
        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI analysis error:", e);
      }
    }

    // Step 3: Store keyword intelligence
    const keywords = aiAnalysis.keywords || [];
    if (keywords.length > 0) {
      const keywordRows = keywords.map((kw: any) => ({
        business_id,
        seo_project_id,
        domain_analysis_id: analysisId,
        keyword: kw.keyword,
        keyword_type: kw.type || "primary",
        estimated_volume: kw.estimated_volume || "medium",
        difficulty_score: kw.difficulty || 50,
        intent: kw.intent || "informational",
        opportunity_score: kw.opportunity || 50,
        is_branded: kw.keyword?.toLowerCase().includes(cleanDomain.split(".")[0]),
      }));
      await supabase.from("seo_keyword_intelligence").insert(keywordRows as any);
    }

    // Step 4: Store page audit
    if (aiAnalysis.page_audit) {
      const pa = aiAnalysis.page_audit;
      const avgScore = Math.round(Object.values(pa).reduce((a: number, b: any) => a + (Number(b) || 0), 0) / Object.keys(pa).length);
      await supabase.from("seo_page_audits").insert({
        business_id,
        domain_analysis_id: analysisId,
        seo_project_id,
        page_url: `https://${cleanDomain}`,
        seo_score: avgScore,
        title_tag: pageTitle,
        meta_description: metaDesc,
        h1_count: (pageHtml.match(/<h1/gi) || []).length,
        word_count: pageHtml.replace(/<[^>]*>/g, "").split(/\s+/).length,
        has_canonical: /<link[^>]*rel=["']canonical["']/i.test(pageHtml),
        has_schema: /application\/ld\+json/i.test(pageHtml),
        issues_json: aiAnalysis.on_page_issues || [],
        recommendations_json: aiAnalysis.roadmap_items || [],
      } as any);
    }

    // Step 5: Store roadmap items
    const roadmapItems = aiAnalysis.roadmap_items || [];
    if (roadmapItems.length > 0) {
      await supabase.from("seo_roadmap_items").insert(
        roadmapItems.map((r: any) => ({
          business_id, seo_project_id,
          title: r.title,
          category: r.category || "technical",
          priority: r.priority || "medium",
          estimated_impact: r.impact || "medium",
        })) as any
      );
    }

    // Step 6: Store content gaps as content workflow
    const contentGaps = aiAnalysis.content_gaps || [];
    if (contentGaps.length > 0) {
      await supabase.from("seo_content_workflow").insert(
        contentGaps.slice(0, 20).map((g: any) => ({
          business_id, seo_project_id,
          title: g.topic,
          content_type: g.type || "blog",
          status: "brief_created",
          brief: `Priority: ${g.priority}. Auto-discovered content gap.`,
        })) as any
      );
    }

    // Step 7: Store internal link suggestions
    const linkSuggestions = aiAnalysis.internal_link_suggestions || [];
    if (linkSuggestions.length > 0) {
      await supabase.from("seo_internal_links").insert(
        linkSuggestions.map((l: any) => ({
          business_id, seo_project_id,
          source_url: l.source || `https://${cleanDomain}`,
          target_url: l.target || `https://${cleanDomain}`,
          anchor_text: l.anchor_text || "",
          is_suggestion: true,
          status: "pending",
        })) as any
      );
    }

    // Step 8: Store traffic estimate
    await supabase.from("seo_traffic_estimates").insert({
      business_id, seo_project_id, domain: cleanDomain,
      estimated_monthly_traffic: aiAnalysis.estimated_monthly_traffic || 0,
      visibility_score: aiAnalysis.seo_score || 0,
      top_pages_json: aiAnalysis.top_pages || [],
    } as any);

    // Step 9: Discover competitors
    const competitorDomains = aiAnalysis.competitor_domains || [];
    if (competitorDomains.length > 0) {
      const { data: existing } = await supabase.from("seo_competitors")
        .select("competitor_domain").eq("seo_project_id", seo_project_id);
      const existingSet = new Set((existing || []).map((e: any) => e.competitor_domain?.toLowerCase()));
      
      const newComps = competitorDomains
        .filter((d: string) => !existingSet.has(d.toLowerCase()) && d.toLowerCase() !== cleanDomain.toLowerCase())
        .slice(0, 30)
        .map((d: string, i: number) => ({
          business_id, seo_project_id,
          competitor_domain: d,
          competitor_name: d,
          competitor_title: d,
          ranking_position: i + 1,
          discovered_date: new Date().toISOString(),
        }));
      
      if (newComps.length > 0) {
        await supabase.from("seo_competitors").insert(newComps as any);
      }
    }

    // Step 10: Update analysis record
    await supabase.from("seo_domain_analyses").update({
      status: "completed",
      seo_score: aiAnalysis.seo_score || 0,
      estimated_traffic: aiAnalysis.estimated_monthly_traffic || 0,
      total_keywords: keywords.length,
      total_pages_crawled: 1,
      analysis_json: aiAnalysis,
      completed_at: new Date().toISOString(),
    } as any).eq("id", analysisId);

    return new Response(JSON.stringify({
      success: true,
      analysis_id: analysisId,
      seo_score: aiAnalysis.seo_score || 0,
      keywords_found: keywords.length,
      competitors_found: competitorDomains.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Domain analysis error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
