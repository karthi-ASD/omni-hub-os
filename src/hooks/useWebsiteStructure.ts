import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WebsitePage {
  id: string;
  client_id: string;
  business_id: string;
  url: string;
  parent_url: string | null;
  level: number;
  page_title: string | null;
  status_code: number | null;
  created_at: string;
  updated_at: string;
}

export interface TreeNode {
  page: WebsitePage;
  children: TreeNode[];
}

export function useWebsiteStructure(clientId: string | undefined) {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  const fetchPages = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("client_website_pages" as any)
      .select("*")
      .eq("client_id", clientId)
      .order("level", { ascending: true })
      .order("url", { ascending: true });

    if (!error) {
      setPages((data as any[]) ?? []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const crawlSitemap = useCallback(async (websiteUrl: string) => {
    if (!clientId || !websiteUrl) return;
    setCrawling(true);
    try {
      const { data, error } = await supabase.functions.invoke("crawl-sitemap", {
        body: { client_id: clientId, website_url: websiteUrl },
      });

      if (error) throw error;

      if (data?.cached) {
        toast.info("Sitemap data is already up to date (refreshes every 24h)");
      } else {
        toast.success(`Discovered ${data?.pages_count || 0} pages via ${data?.method || "crawl"}`);
      }
      await fetchPages();
    } catch (err: any) {
      console.error("Crawl error:", err);
      toast.error("Failed to crawl website: " + (err.message || "Unknown error"));
    } finally {
      setCrawling(false);
    }
  }, [clientId, fetchPages]);

  // Build tree structure from flat pages
  const tree = buildTree(pages);

  return { pages, tree, loading, crawling, crawlSitemap, refetch: fetchPages };
}

function buildTree(pages: WebsitePage[]): TreeNode[] {
  if (pages.length === 0) return [];

  const urlMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes
  for (const page of pages) {
    urlMap.set(page.url, { page, children: [] });
  }

  // Link children to parents
  for (const page of pages) {
    const node = urlMap.get(page.url)!;
    if (page.parent_url && urlMap.has(page.parent_url)) {
      urlMap.get(page.parent_url)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
