import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { domain, business_id, seo_project_id, module } = body;
    if (!domain || !business_id) throw new Error("domain and business_id required");

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");

    // If module is specified, run only that module synchronously
    if (module && module !== "full") {
      return await runModule(supabase, lovableApiKey, cleanDomain, business_id, seo_project_id, module);
    }

    // Full analysis — create record and process in background
    const { data: analysis } = await supabase.from("seo_domain_analyses").insert({
      business_id, seo_project_id, domain: cleanDomain, status: "processing",
      started_at: new Date().toISOString(),
    }).select().single();

    const analysisId = analysis?.id;
    if (!analysisId) throw new Error("Failed to create analysis record");

    const responsePromise = new Response(JSON.stringify({
      success: true, analysis_id: analysisId, status: "processing",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    EdgeRuntime.waitUntil(runFullAnalysis(supabase, lovableApiKey, cleanDomain, business_id, seo_project_id, analysisId));

    return responsePromise;
  } catch (error: any) {
    console.error("Domain analysis error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ==================== Fetch site context ====================
async function fetchSiteContext(cleanDomain: string) {
  let pageHtml = "", pageTitle = "", metaDesc = "";
  let h1Tags: string[] = [], h2Tags: string[] = [], pageLinks: string[] = [];
  let hasCanonical = false, hasSchema = false, hasSsl = false;
  let wordCount = 0, imgCount = 0, altCount = 0;

  try {
    const resp = await fetch(`https://${cleanDomain}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NextWebBot/1.0)" },
      redirect: "follow",
    });
    hasSsl = resp.url.startsWith("https://");
    pageHtml = await resp.text();

    const titleMatch = pageHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    pageTitle = titleMatch?.[1]?.trim() || "";
    const descMatch = pageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    metaDesc = descMatch?.[1]?.trim() || "";
    h1Tags = [...pageHtml.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]*>/g, "").trim());
    h2Tags = [...pageHtml.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]*>/g, "").trim());
    hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(pageHtml);
    hasSchema = /application\/ld\+json/i.test(pageHtml);
    wordCount = pageHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;
    imgCount = (pageHtml.match(/<img/gi) || []).length;
    altCount = (pageHtml.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;
    const linkMatches = [...pageHtml.matchAll(/href=["'](\/[^"']*|https?:\/\/[^"']*)/gi)];
    pageLinks = linkMatches.map(m => m[1]).filter(l => l.startsWith("/") || l.includes(cleanDomain)).slice(0, 100);
  } catch (e) {
    console.error("Fetch error:", e);
  }

  const contextStr = `Domain: ${cleanDomain}
Title: ${pageTitle}
Meta Description: ${metaDesc}
H1 Tags: ${h1Tags.join(", ") || "NONE"}
H2 Tags: ${h2Tags.slice(0, 10).join(", ") || "NONE"}
Word Count: ${wordCount}
Images: ${imgCount}, With Alt: ${altCount}
Has Canonical: ${hasCanonical}
Has Schema: ${hasSchema}
Has SSL: ${hasSsl}
Internal Links Found: ${pageLinks.length}
Sample Links: ${pageLinks.slice(0, 20).join(", ")}
HTML snippet (first 5000 chars): ${pageHtml.substring(0, 5000)}`;

  return { contextStr, pageTitle, metaDesc, h1Tags, h2Tags, pageLinks, hasCanonical, hasSchema, hasSsl, wordCount, imgCount, altCount, pageHtml };
}

// ==================== Module runner (individual) ====================
async function runModule(supabase: any, apiKey: string, cleanDomain: string, business_id: string, seo_project_id: string, module: string) {
  try {
    const site = await fetchSiteContext(cleanDomain);
    let result: any = {};

    switch (module) {
      case "keywords":
        result = await runKeywords(supabase, apiKey, site.contextStr, business_id, seo_project_id);
        break;
      case "competitors":
        result = await runCompetitors(supabase, apiKey, site.contextStr, cleanDomain, business_id, seo_project_id);
        break;
      case "audit":
        result = await runAudit(supabase, apiKey, site, cleanDomain, business_id, seo_project_id);
        break;
      case "backlinks":
        result = await runBacklinks(supabase, apiKey, site.contextStr, cleanDomain, business_id, seo_project_id);
        break;
      case "content":
        result = await runContent(supabase, apiKey, site.contextStr, business_id, seo_project_id);
        break;
      case "roadmap":
        result = await runRoadmap(supabase, apiKey, site.contextStr, business_id, seo_project_id);
        break;
      case "sitemap":
        result = await runSitemap(cleanDomain);
        break;
      default:
        throw new Error(`Unknown module: ${module}`);
    }

    return new Response(JSON.stringify({ success: true, module, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`[SEO_MODULE:${module}] Error:`, error);
    return new Response(JSON.stringify({ success: false, module, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// ==================== Individual modules ====================

async function runKeywords(supabase: any, apiKey: string, ctx: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an expert SEO analyst specialising in Australian businesses and Google.com.au rankings.
Analyze this website and generate comprehensive keyword intelligence.

${ctx}

Return a JSON object with these exact keys:
{
  "keywords": [
    {"keyword": "...", "type": "primary|secondary|long_tail|lsi|local|question|brand|service", "intent": "informational|transactional|navigational|commercial", "estimated_volume": "high|medium|low", "difficulty": (0-100), "opportunity": (0-100), "cluster_group": "..."}
  ]
}

CRITICAL: Generate AT LEAST 200 diverse keywords covering all types. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);
  const keywords = data?.keywords || [];

  if (keywords.length > 0) {
    // Clear old keywords for this project first
    await supabase.from("seo_keyword_intelligence").delete().eq("seo_project_id", seo_project_id);
    const batches = chunkArray(keywords.map((kw: any) => ({
      business_id, seo_project_id,
      keyword: kw.keyword,
      keyword_type: kw.type || "primary",
      estimated_volume: kw.estimated_volume || "medium",
      difficulty_score: kw.difficulty || 50,
      intent: kw.intent || "informational",
      opportunity_score: kw.opportunity || 50,
      is_branded: kw.type === "brand",
      cluster_group: kw.cluster_group || null,
    })), 50);
    for (const batch of batches) {
      await supabase.from("seo_keyword_intelligence").insert(batch as any);
    }
  }

  return { count: keywords.length };
}

async function runCompetitors(supabase: any, apiKey: string, ctx: string, cleanDomain: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an expert SEO competitive intelligence analyst for Australian markets.
Analyze this domain and discover competitor websites that compete in Google.com.au search results.

${ctx}

Return a JSON object:
{
  "competitors": [
    {"domain": "...", "name": "...", "relevance_score": (0-100), "estimated_traffic": (integer), "strength_score": (0-100)}
  ]
}

CRITICAL: Discover AT LEAST 30 unique Australian competitor domains. Do NOT include social media, Google properties, or generic directories. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);
  const competitors = data?.competitors || [];

  if (competitors.length > 0) {
    const { data: existing } = await supabase.from("seo_competitors").select("competitor_domain").eq("seo_project_id", seo_project_id);
    const existingSet = new Set((existing || []).map((e: any) => e.competitor_domain?.toLowerCase()));

    const newComps = competitors
      .filter((c: any) => !existingSet.has(c.domain?.toLowerCase()) && c.domain?.toLowerCase() !== cleanDomain.toLowerCase())
      .slice(0, 35)
      .map((c: any, i: number) => ({
        business_id, seo_project_id,
        competitor_domain: c.domain,
        competitor_name: c.name || c.domain,
      }));

    if (newComps.length > 0) {
      await supabase.from("seo_competitors").insert(newComps as any);
    }
  }

  return { count: competitors.length };
}

async function runAudit(supabase: any, apiKey: string, site: any, cleanDomain: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an expert technical SEO auditor. Perform a comprehensive on-page and technical SEO audit.

${site.contextStr}

Return a JSON object:
{
  "seo_score": (0-100 overall),
  "page_audit": {
    "title_score": (0-100), "meta_score": (0-100), "heading_score": (0-100),
    "content_score": (0-100), "internal_linking_score": (0-100), "schema_score": (0-100),
    "speed_score": (0-100), "mobile_score": (0-100), "ssl_score": (0-100),
    "indexability_score": (0-100)
  },
  "on_page_issues": [{"issue": "...", "severity": "high|medium|low", "recommendation": "...", "category": "metadata|content|technical|links|images|schema"}],
  "technical_issues": [{"issue": "...", "severity": "high|medium|low", "category": "crawlability|indexability|speed|mobile|security|structured_data"}]
}

CRITICAL: Generate at least 15 on_page_issues and 10 technical_issues with specific, actionable recommendations. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);

  if (data?.page_audit) {
    const pa = data.page_audit;
    const scores = Object.values(pa).filter(v => typeof v === "number") as number[];
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    await supabase.from("seo_page_audits").insert({
      business_id, seo_project_id,
      page_url: `https://${cleanDomain}`,
      seo_score: avgScore,
      title_tag: site.pageTitle,
      meta_description: site.metaDesc,
      h1_count: site.h1Tags.length,
      word_count: site.wordCount,
      has_canonical: site.hasCanonical,
      has_schema: site.hasSchema,
      issues_json: [...(data.on_page_issues || []), ...(data.technical_issues || [])],
      recommendations_json: [],
    } as any);
  }

  return { seo_score: data?.seo_score || 0, issues: (data?.on_page_issues?.length || 0) + (data?.technical_issues?.length || 0), audit_data: data };
}

async function runBacklinks(supabase: any, apiKey: string, ctx: string, cleanDomain: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an SEO backlink intelligence analyst.
Analyze this domain and generate backlink intelligence.

${ctx}

Return a JSON object:
{
  "estimated_total_backlinks": (integer),
  "estimated_referring_domains": (integer),
  "estimated_domain_strength": (0-100),
  "backlink_opportunities": [
    {"target_domain": "...", "opportunity_type": "guest_post|resource_link|directory|citation|broken_link", "priority": "high|medium|low", "reason": "..."}
  ]
}

CRITICAL: Include at least 15 backlink opportunities. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);

  if (data?.backlink_opportunities?.length > 0) {
    await supabase.from("seo_backlinks").insert(
      data.backlink_opportunities.slice(0, 30).map((bl: any) => ({
        business_id, seo_project_id,
        source_url: bl.target_domain,
        target_url: `https://${cleanDomain}`,
        anchor_text: bl.opportunity_type,
        link_type: "DOFOLLOW",
        status: "NEW",
        domain_authority: Math.floor(Math.random() * 40 + 20),
      })) as any
    );
  }

  return { total_backlinks: data?.estimated_total_backlinks || 0, opportunities: data?.backlink_opportunities?.length || 0 };
}

async function runContent(supabase: any, apiKey: string, ctx: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an SEO content strategist for Australian businesses.
Analyze this website and generate content gap opportunities.

${ctx}

Return a JSON object:
{
  "content_gaps": [
    {"topic": "...", "type": "service_page|blog|faq|location_page|landing_page", "priority": "high|medium|low", "description": "..."}
  ]
}

CRITICAL: Generate at least 20 content gaps covering service pages, blog topics, FAQ pages, location pages, and landing pages. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);
  const gaps = data?.content_gaps || [];

  if (gaps.length > 0) {
    await supabase.from("seo_content_workflow").insert(
      gaps.slice(0, 30).map((g: any) => ({
        business_id, seo_project_id,
        title: g.topic,
        content_type: g.type || "blog",
        status: "brief_created",
        brief: `${g.description || ""} Priority: ${g.priority}.`,
      })) as any
    );
  }

  return { count: gaps.length };
}

async function runRoadmap(supabase: any, apiKey: string, ctx: string, business_id: string, seo_project_id: string) {
  const raw = await callAI(apiKey, `You are an SEO strategist. Generate a comprehensive SEO roadmap for this website.

${ctx}

Return a JSON object:
{
  "roadmap_items": [
    {"title": "...", "description": "...", "category": "technical|metadata|content|internal_linking|backlinks|local_seo|schema", "priority": "high|medium|low", "impact": "high|medium|low", "effort": "low|medium|high"}
  ]
}

CRITICAL: Generate at least 20 roadmap items covering all categories. Only return valid JSON, no markdown.`);

  const data = parseJSON(raw);
  const items = data?.roadmap_items || [];

  if (items.length > 0) {
    await supabase.from("seo_roadmap_items").insert(
      items.map((r: any) => ({
        business_id, seo_project_id,
        title: r.title,
        description: r.description || null,
        category: r.category || "technical",
        priority: r.priority || "medium",
        estimated_impact: r.impact || "medium",
      })) as any
    );
  }

  return { count: items.length };
}

async function runSitemap(cleanDomain: string) {
  const urls: string[] = [];
  try {
    const sitemapUrls = [
      `https://${cleanDomain}/sitemap.xml`,
      `https://${cleanDomain}/sitemap_index.xml`,
      `https://www.${cleanDomain}/sitemap.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const resp = await fetch(sitemapUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NextWebBot/1.0)" },
        });
        if (!resp.ok) { await resp.text(); continue; }
        const xml = await resp.text();

        // Check for sitemap index
        const sitemapLocs = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>/gi)].map(m => m[1].trim());
        if (sitemapLocs.length > 0) {
          for (const subUrl of sitemapLocs.slice(0, 5)) {
            try {
              const subResp = await fetch(subUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; NextWebBot/1.0)" } });
              if (!subResp.ok) { await subResp.text(); continue; }
              const subXml = await subResp.text();
              const subLocs = [...subXml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>/gi)].map(m => m[1].trim());
              urls.push(...subLocs);
            } catch { /* skip */ }
          }
        }

        // Direct URL entries
        const directLocs = [...xml.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>/gi)].map(m => m[1].trim());
        urls.push(...directLocs);

        if (urls.length > 0) break;
      } catch { /* try next */ }
    }
  } catch (e) {
    console.error("Sitemap error:", e);
  }

  const unique = [...new Set(urls)];
  return { sitemap_found: unique.length > 0, total_pages: unique.length, urls: unique.slice(0, 500) };
}

// ==================== Full analysis (background) ====================
async function runFullAnalysis(supabase: any, apiKey: string, cleanDomain: string, business_id: string, seo_project_id: string, analysisId: string) {
  try {
    const site = await fetchSiteContext(cleanDomain);

    // Run modules in parallel (2 at a time to avoid rate limits)
    const [kwResult, compResult] = await Promise.all([
      runKeywords(supabase, apiKey, site.contextStr, business_id, seo_project_id),
      runCompetitors(supabase, apiKey, site.contextStr, cleanDomain, business_id, seo_project_id),
    ]);

    const [auditResult, blResult] = await Promise.all([
      runAudit(supabase, apiKey, site, cleanDomain, business_id, seo_project_id),
      runBacklinks(supabase, apiKey, site.contextStr, cleanDomain, business_id, seo_project_id),
    ]);

    const [contentResult, roadmapResult, sitemapResult] = await Promise.all([
      runContent(supabase, apiKey, site.contextStr, business_id, seo_project_id),
      runRoadmap(supabase, apiKey, site.contextStr, business_id, seo_project_id),
      runSitemap(cleanDomain),
    ]);

    // Store traffic estimate
    await supabase.from("seo_traffic_estimates").insert({
      business_id, seo_project_id, domain: cleanDomain,
      estimated_monthly_traffic: 0,
      visibility_score: auditResult.seo_score || 0,
      top_pages_json: [],
    } as any);

    await supabase.from("seo_domain_analyses").update({
      status: "completed",
      seo_score: auditResult.seo_score || 0,
      total_keywords: kwResult.count,
      total_backlinks_est: blResult.total_backlinks,
      total_pages_crawled: sitemapResult.total_pages || 1,
      analysis_json: {
        ...(auditResult.audit_data || {}),
        keywords_count: kwResult.count,
        competitors_count: compResult.count,
        sitemap_pages: sitemapResult.total_pages,
      },
      completed_at: new Date().toISOString(),
    } as any).eq("id", analysisId);

    console.log(`[SEO_ANALYZE] Completed for ${cleanDomain}: kw=${kwResult.count}, comp=${compResult.count}, score=${auditResult.seo_score}`);
  } catch (error: any) {
    console.error("[SEO_ANALYZE] Background error:", error);
    await supabase.from("seo_domain_analyses").update({
      status: "failed",
      analysis_json: { error: error.message },
    } as any).eq("id", analysisId);
  }
}

// ==================== Utilities ====================
async function callAI(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  const rawText = await resp.text();

  if (!resp.ok) {
    console.error(`[callAI] HTTP ${resp.status}: ${rawText.substring(0, 500)}`);
    throw new Error(`AI API returned HTTP ${resp.status}`);
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error(`[callAI] Non-JSON response: ${rawText.substring(0, 500)}`);
    throw new Error("AI API returned non-JSON response");
  }

  return data.choices?.[0]?.message?.content || "";
}

function parseJSON(text: string): any {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("JSON parse error:", e);
  }
  return {};
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
