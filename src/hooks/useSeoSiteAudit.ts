import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSeoPageAudits } from "@/hooks/useSeoPageAudits";
import { toast } from "sonner";

export function useSeoSiteAudit(projectId?: string, domain?: string) {
  const { profile } = useAuth();
  const { audits, loading, refetch } = useSeoPageAudits(projectId);
  const [crawling, setCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState("");

  const runFullAudit = useCallback(async () => {
    if (!profile?.business_id || !projectId || !domain) {
      toast.error("Missing project or domain information");
      return;
    }

    setCrawling(true);
    setCrawlProgress("Starting site crawl...");

    try {
      // Step 1: Discover sitemap URLs
      setCrawlProgress("Discovering sitemap...");
      const sitemapResp = await supabase.functions.invoke("seo-domain-analyze", {
        body: {
          domain,
          business_id: profile.business_id,
          seo_project_id: projectId,
          module: "sitemap",
        },
      });

      const sitemapData = sitemapResp.data;
      const urls: string[] = sitemapData?.urls || [];

      // Step 2: Run audit module
      setCrawlProgress("Running SEO audit...");
      const auditResp = await supabase.functions.invoke("seo-domain-analyze", {
        body: {
          domain,
          business_id: profile.business_id,
          seo_project_id: projectId,
          module: "audit",
        },
      });

      // Step 3: Crawl individual pages (up to 20)
      const pagesToCrawl = urls.slice(0, 20);
      if (pagesToCrawl.length > 0) {
        setCrawlProgress(`Auditing ${pagesToCrawl.length} pages...`);
        for (let i = 0; i < pagesToCrawl.length; i++) {
          setCrawlProgress(`Auditing page ${i + 1}/${pagesToCrawl.length}...`);
          try {
            await crawlSinglePage(pagesToCrawl[i], profile.business_id, projectId);
          } catch (e) {
            console.error(`Failed to audit page: ${pagesToCrawl[i]}`, e);
          }
        }
      }

      setCrawlProgress("Generating tasks from findings...");
      // Auto-generate tasks from audit issues
      await generateTasksFromAudit(profile.business_id, projectId);

      toast.success(`Audit complete! ${pagesToCrawl.length + 1} pages scanned`);
      refetch();
    } catch (e: any) {
      console.error("Audit error:", e);
      toast.error("Audit failed: " + (e.message || "Unknown error"));
    } finally {
      setCrawling(false);
      setCrawlProgress("");
    }
  }, [profile, projectId, domain, refetch]);

  return { audits, loading, crawling, crawlProgress, runFullAudit, refetch };
}

async function crawlSinglePage(url: string, businessId: string, projectId: string) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NextWebBot/1.0)" },
      redirect: "follow",
    });
    if (!resp.ok) return;
    const html = await resp.text();

    // Extract SEO data
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const titleTag = titleMatch?.[1]?.trim() || null;
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
    const metaDesc = descMatch?.[1]?.trim() || null;
    const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]*>/g, "").trim());
    const h1Tag = h1Matches[0] || null;
    const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
    const canonicalUrl = canonicalMatch?.[1] || null;
    const hasSchema = /application\/ld\+json/i.test(html);
    const wordCount = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;
    const imgCount = (html.match(/<img/gi) || []).length;
    const altCount = (html.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;
    const missingAlt = imgCount - altCount;
    const internalLinks = [...html.matchAll(/href=["'](\/[^"']*)/gi)].length;
    const externalLinks = [...html.matchAll(/href=["'](https?:\/\/[^"']*)/gi)].length;
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["'](.*?)["']/i);
    const isNoindex = robotsMatch?.[1]?.toLowerCase().includes("noindex") || false;

    // Calculate SEO score
    let score = 100;
    const issues: any[] = [];
    if (!titleTag) { score -= 15; issues.push({ issue: "Missing title tag", severity: "high", category: "metadata" }); }
    else if (titleTag.length > 60) { score -= 5; issues.push({ issue: "Title tag too long", severity: "medium", category: "metadata" }); }
    else if (titleTag.length < 20) { score -= 5; issues.push({ issue: "Title tag too short", severity: "medium", category: "metadata" }); }
    if (!metaDesc) { score -= 15; issues.push({ issue: "Missing meta description", severity: "high", category: "metadata" }); }
    else if (metaDesc.length > 160) { score -= 5; issues.push({ issue: "Meta description too long", severity: "medium", category: "metadata" }); }
    if (!h1Tag) { score -= 10; issues.push({ issue: "Missing H1 tag", severity: "high", category: "content" }); }
    if (h1Matches.length > 1) { score -= 5; issues.push({ issue: `Multiple H1 tags (${h1Matches.length})`, severity: "medium", category: "content" }); }
    if (wordCount < 300) { score -= 10; issues.push({ issue: "Thin content (under 300 words)", severity: "high", category: "content" }); }
    if (missingAlt > 0) { score -= Math.min(10, missingAlt * 2); issues.push({ issue: `${missingAlt} images missing alt tags`, severity: "medium", category: "images" }); }
    if (!hasCanonical) { score -= 5; issues.push({ issue: "Missing canonical tag", severity: "medium", category: "technical" }); }
    if (!hasSchema) { score -= 5; issues.push({ issue: "No structured data (schema)", severity: "medium", category: "schema" }); }
    if (internalLinks < 3) { score -= 5; issues.push({ issue: "Low internal linking", severity: "medium", category: "links" }); }
    if (isNoindex) { score -= 15; issues.push({ issue: "Page has noindex directive", severity: "high", category: "technical" }); }

    score = Math.max(0, score);

    await (supabase.from("seo_page_audits") as any).insert({
      business_id: businessId,
      seo_project_id: projectId,
      page_url: url,
      title_tag: titleTag,
      meta_description: metaDesc,
      h1_tag: h1Tag,
      word_count: wordCount,
      internal_links_count: internalLinks,
      external_links_count: externalLinks,
      image_count: imgCount,
      missing_alt_tags_count: missingAlt,
      canonical_url: canonicalUrl,
      schema_present: hasSchema,
      mobile_friendly: true,
      broken_links_count: 0,
      seo_score: score,
      issues_json: issues,
    });
  } catch (e) {
    console.error(`Crawl error for ${url}:`, e);
  }
}

async function generateTasksFromAudit(businessId: string, projectId: string) {
  try {
    const { data: audits } = await (supabase.from("seo_page_audits") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!audits || audits.length === 0) return;

    const tasks: any[] = [];
    for (const audit of audits) {
      const issues = audit.issues_json || [];
      for (const issue of issues) {
        if (issue.severity === "high") {
          const taskTitle = `${issue.issue} — ${new URL(audit.page_url).pathname || audit.page_url}`;
          tasks.push({
            business_id: businessId,
            seo_project_id: projectId,
            page_url: audit.page_url,
            checklist_item: mapIssueToChecklist(issue),
            status: "todo",
          });
        }
      }
    }

    // Deduplicate by checklist_item + page_url
    const seen = new Set<string>();
    const unique = tasks.filter(t => {
      const key = `${t.checklist_item}:${t.page_url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length > 0) {
      await (supabase.from("seo_onpage_tasks") as any).insert(unique.slice(0, 50));
      toast.success(`${Math.min(unique.length, 50)} tasks auto-generated from audit`);
    }
  } catch (e) {
    console.error("Task generation error:", e);
  }
}

function mapIssueToChecklist(issue: any): string {
  const cat = issue.category?.toLowerCase() || "";
  const text = issue.issue?.toLowerCase() || "";
  if (text.includes("title")) return "META_TITLE";
  if (text.includes("meta description")) return "META_DESC";
  if (text.includes("h1")) return "H1";
  if (text.includes("alt")) return "ALT";
  if (text.includes("schema") || text.includes("structured")) return "SCHEMA";
  if (text.includes("canonical")) return "INDEXING";
  if (text.includes("noindex")) return "INDEXING";
  if (text.includes("internal link")) return "INTERNAL_LINKS";
  if (text.includes("thin content") || text.includes("word")) return "H2";
  if (text.includes("speed")) return "SPEED";
  if (text.includes("mobile")) return "MOBILE";
  return "META_TITLE";
}
