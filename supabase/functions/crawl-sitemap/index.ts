import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PageEntry {
  url: string;
  parent_url: string | null;
  level: number;
  page_title: string | null;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function normalizePath(url: string, domain: string): string {
  try {
    const u = new URL(url);
    if (u.origin !== new URL(domain).origin) return "";
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return "";
  }
}

function buildHierarchy(urls: string[], domain: string): PageEntry[] {
  const paths = urls
    .map((u) => normalizePath(u, domain))
    .filter((p) => p !== "")
    .filter((v, i, a) => a.indexOf(v) === i);

  // Sort by depth then alphabetically
  paths.sort((a, b) => {
    const da = a.split("/").filter(Boolean).length;
    const db = b.split("/").filter(Boolean).length;
    return da - db || a.localeCompare(b);
  });

  const entries: PageEntry[] = [];
  const pathSet = new Set(paths);

  for (const path of paths) {
    const segments = path.split("/").filter(Boolean);
    const level = segments.length === 0 ? 0 : segments.length;

    // Find parent
    let parentPath: string | null = null;
    if (segments.length > 0) {
      const parentSegments = segments.slice(0, -1);
      const candidate = parentSegments.length === 0 ? "/" : "/" + parentSegments.join("/");
      parentPath = pathSet.has(candidate) ? domain + candidate : null;
      // If no direct parent in set, link to home
      if (!parentPath && path !== "/") parentPath = domain + "/";
    }

    const fullUrl = domain + (path === "/" ? "" : path);
    const title = segments.length === 0
      ? "Home"
      : segments[segments.length - 1]
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

    entries.push({
      url: fullUrl,
      parent_url: parentPath,
      level,
      page_title: title,
    });
  }

  return entries;
}

async function fetchSitemapXml(websiteUrl: string): Promise<string[]> {
  const domain = extractDomain(websiteUrl);
  const sitemapUrl = `${domain}/sitemap.xml`;

  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "NextWebOS-Crawler/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return [];

    const xml = await res.text();
    if (!xml.includes("<url") && !xml.includes("<sitemap")) return [];

    // Extract URLs from <loc> tags
    const urls: string[] = [];
    const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      urls.push(match[1].trim());
    }

    // Check if it's a sitemap index (contains nested sitemaps)
    if (xml.includes("<sitemapindex") && urls.length > 0) {
      // Fetch first 3 sub-sitemaps
      const subUrls: string[] = [];
      for (const subSitemapUrl of urls.slice(0, 3)) {
        try {
          const subRes = await fetch(subSitemapUrl, {
            headers: { "User-Agent": "NextWebOS-Crawler/1.0" },
            redirect: "follow",
          });
          if (subRes.ok) {
            const subXml = await subRes.text();
            let subMatch;
            const subLocRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
            while ((subMatch = subLocRegex.exec(subXml)) !== null) {
              subUrls.push(subMatch[1].trim());
            }
          }
        } catch { /* skip failed sub-sitemaps */ }
      }
      return subUrls.length > 0 ? subUrls : urls;
    }

    return urls;
  } catch {
    return [];
  }
}

async function discoverByLinkCrawl(websiteUrl: string): Promise<string[]> {
  const domain = extractDomain(websiteUrl);
  const discovered = new Set<string>([domain + "/"]);
  const queue = [domain + "/"];
  const visited = new Set<string>();
  const maxPages = 50;

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "NextWebOS-Crawler/1.0" },
        redirect: "follow",
      });
      if (!res.ok) continue;

      const html = await res.text();
      const hrefRegex = /href=["'](\/[^"'#?]*|https?:\/\/[^"'#?]*)/gi;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        let href = match[1];
        if (href.startsWith("/")) href = domain + href;
        const normalized = normalizePath(href, domain);
        if (normalized && normalized !== "") {
          const fullUrl = domain + normalized;
          if (!discovered.has(fullUrl) && discovered.size < 200) {
            discovered.add(fullUrl);
            // Only crawl up to depth 3
            const depth = normalized.split("/").filter(Boolean).length;
            if (depth <= 3) queue.push(fullUrl);
          }
        }
      }
    } catch { /* skip failed pages */ }
  }

  return Array.from(discovered);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { client_id, website_url } = await req.json();
    if (!client_id || !website_url) {
      return new Response(JSON.stringify({ error: "client_id and website_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user belongs to client's business
    const { data: userProfile } = await adminClient
      .from("profiles")
      .select("business_id")
      .eq("user_id", user.id)
      .single();

    const { data: clientRecord } = await adminClient
      .from("clients")
      .select("business_id")
      .eq("id", client_id)
      .single();

    if (!userProfile?.business_id || userProfile.business_id !== clientRecord?.business_id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const businessId = userProfile.business_id;
    const domain = extractDomain(website_url);

    // Check cache: if last crawl < 24h ago, return cached
    const { data: existingPages } = await adminClient
      .from("client_website_pages")
      .select("updated_at")
      .eq("client_id", client_id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (existingPages && existingPages.length > 0) {
      const lastUpdate = new Date(existingPages[0].updated_at).getTime();
      const hoursSince = (Date.now() - lastUpdate) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return new Response(JSON.stringify({
          success: true,
          cached: true,
          message: "Sitemap data is fresh (< 24h old)",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Crawling sitemap for ${domain}...`);

    // Step 1: Try sitemap.xml
    let urls = await fetchSitemapXml(website_url);
    let method = "sitemap.xml";

    // Step 2: Fallback to link crawling
    if (urls.length === 0) {
      console.log("No sitemap.xml found, falling back to link crawl...");
      urls = await discoverByLinkCrawl(website_url);
      method = "crawl";
    }

    if (urls.length === 0) {
      // At minimum add the home page
      urls = [domain + "/"];
      method = "manual";
    }

    // Limit to 200 pages max
    urls = urls.slice(0, 200);

    // Build hierarchy
    const pages = buildHierarchy(urls, domain);

    // Clear existing and insert new
    await adminClient
      .from("client_website_pages")
      .delete()
      .eq("client_id", client_id);

    // Batch insert
    const rows = pages.map((p) => ({
      client_id,
      business_id: businessId,
      url: p.url,
      parent_url: p.parent_url,
      level: p.level,
      page_title: p.page_title,
    }));

    if (rows.length > 0) {
      const { error: insertErr } = await adminClient
        .from("client_website_pages")
        .insert(rows);
      if (insertErr) {
        console.error("Insert error:", insertErr);
        throw insertErr;
      }
    }

    console.log(`Crawl complete: ${rows.length} pages (${method})`);

    return new Response(JSON.stringify({
      success: true,
      method,
      pages_count: rows.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Crawl error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
