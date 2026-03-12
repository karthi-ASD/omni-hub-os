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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { domain, project_id, business_id } = await req.json();
    if (!domain || !project_id || !business_id) {
      throw new Error("domain, project_id, and business_id are required");
    }

    // Create fetch log
    const { data: logRow } = await supabase.from("seo_competitor_fetch_logs").insert({
      business_id,
      seo_project_id: project_id,
      status: "in_progress",
    }).select().single();

    const logId = logRow?.id;

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");

    // Use Lovable AI to discover competitors via web search simulation
    // We'll query Google AU programmatically
    const searchQueries = [
      cleanDomain,
      `${cleanDomain} competitors`,
      `sites like ${cleanDomain}`,
    ];

    const discoveredDomains = new Map<string, { title: string; position: number }>();

    for (const query of searchQueries) {
      try {
        // Use Google Custom Search JSON API or fallback to web scraping
        // For now, we use a simple approach - fetch search results page
        const searchUrl = `https://www.google.com.au/search?q=${encodeURIComponent(query)}&num=20&gl=au`;
        const response = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-AU,en;q=0.9",
          },
        });

        const html = await response.text();

        // Extract domains from search results using regex patterns
        const urlPattern = /https?:\/\/(www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z.]{2,})/g;
        let match;
        let position = 1;

        while ((match = urlPattern.exec(html)) !== null) {
          const foundDomain = match[2].toLowerCase();

          // Skip Google domains, the client's own domain, and common non-competitor domains
          const skipDomains = [
            "google.com", "google.com.au", "googleapis.com", "gstatic.com",
            "youtube.com", "facebook.com", "twitter.com", "instagram.com",
            "linkedin.com", "pinterest.com", "reddit.com", "wikipedia.org",
            "w3.org", "schema.org", "cloudflare.com", "amazonaws.com",
            cleanDomain,
          ];

          const shouldSkip = skipDomains.some(sd => foundDomain.includes(sd) || foundDomain === sd);

          if (!shouldSkip && !discoveredDomains.has(foundDomain)) {
            discoveredDomains.set(foundDomain, {
              title: foundDomain,
              position: position++,
            });
          }

          if (discoveredDomains.size >= 30) break;
        }
      } catch (searchErr) {
        console.error(`Search error for query "${query}":`, searchErr);
      }

      if (discoveredDomains.size >= 30) break;
    }

    // Check existing competitors to prevent duplicates
    const { data: existing } = await supabase
      .from("seo_competitors")
      .select("competitor_domain")
      .eq("seo_project_id", project_id);

    const existingDomains = new Set((existing || []).map((e: any) => e.competitor_domain.toLowerCase()));

    // Insert new competitors
    const newCompetitors = [];
    for (const [compDomain, info] of discoveredDomains) {
      if (!existingDomains.has(compDomain) && newCompetitors.length < 30) {
        newCompetitors.push({
          business_id,
          seo_project_id: project_id,
          competitor_domain: compDomain,
          competitor_name: info.title,
          competitor_title: info.title,
          ranking_position: info.position,
          discovered_date: new Date().toISOString(),
        });
      }
    }

    if (newCompetitors.length > 0) {
      await supabase.from("seo_competitors").insert(newCompetitors as any);
    }

    // Update fetch log
    if (logId) {
      await supabase.from("seo_competitor_fetch_logs").update({
        status: "completed",
        results_count: newCompetitors.length,
      }).eq("id", logId);
    }

    console.log(`[SEO_COMPETITOR_FETCH] Found ${discoveredDomains.size} domains, inserted ${newCompetitors.length} new competitors for project ${project_id}`);

    return new Response(JSON.stringify({
      success: true,
      total_found: discoveredDomains.size,
      new_inserted: newCompetitors.length,
      duplicates_skipped: discoveredDomains.size - newCompetitors.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Competitor fetch error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
