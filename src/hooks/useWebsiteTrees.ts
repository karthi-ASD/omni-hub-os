import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WebsiteTreeRecord {
  id: string;
  client_id: string;
  project_id: string | null;
  business_id: string;
  domain: string;
  source_type: "client" | "competitor";
  tree_data: any;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

export function useWebsiteTrees(projectId: string | undefined, clientId?: string) {
  const [trees, setTrees] = useState<WebsiteTreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTrees = useCallback(async () => {
    if (!projectId && !clientId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("website_trees" as any)
        .select("*")
        .order("source_type", { ascending: true })
        .order("created_at", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrees((data as any[]) ?? []);
    } catch (err: any) {
      console.error("Error fetching website trees:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, clientId]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const generateTree = useCallback(
    async (domain: string, sourceType: "client" | "competitor", businessId: string, targetClientId: string) => {
      if (!projectId || !domain) return;
      setGenerating(true);
      try {
        // Call the crawl-sitemap edge function to get sitemap data
        const { data: crawlData, error: crawlError } = await supabase.functions.invoke("crawl-sitemap", {
          body: { client_id: targetClientId, website_url: domain },
        });

        if (crawlError) throw crawlError;

        // Fetch the crawled pages to build tree_data
        const { data: pages, error: pagesError } = await supabase
          .from("client_website_pages" as any)
          .select("*")
          .eq("client_id", targetClientId)
          .order("level", { ascending: true })
          .order("url", { ascending: true });

        if (pagesError) throw pagesError;

        const treeData = buildNestedTree(pages as any[] ?? []);
        const totalPages = (pages as any[])?.length ?? 0;

        // Upsert into website_trees
        const { error: upsertError } = await supabase
          .from("website_trees" as any)
          .upsert(
            {
              client_id: targetClientId,
              project_id: projectId,
              business_id: businessId,
              domain: normalizeDomain(domain),
              source_type: sourceType,
              tree_data: treeData,
              total_pages: totalPages,
            },
            { onConflict: "client_id,project_id,domain" }
          );

        if (upsertError) throw upsertError;

        toast.success(`Website tree generated: ${totalPages} pages discovered`);
        await fetchTrees();
      } catch (err: any) {
        console.error("Generate tree error:", err);
        toast.error("Failed to generate website tree: " + (err.message || "Unknown error"));
      } finally {
        setGenerating(false);
      }
    },
    [projectId, fetchTrees]
  );

  const deleteTree = useCallback(
    async (treeId: string) => {
      try {
        const { error } = await supabase
          .from("website_trees" as any)
          .delete()
          .eq("id", treeId);
        if (error) throw error;
        toast.success("Website tree removed");
        await fetchTrees();
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message);
      }
    },
    [fetchTrees]
  );

  const clientTree = trees.find((t) => t.source_type === "client");
  const competitorTrees = trees.filter((t) => t.source_type === "competitor");

  return {
    trees,
    clientTree,
    competitorTrees,
    loading,
    generating,
    generateTree,
    deleteTree,
    refetch: fetchTrees,
  };
}

function normalizeDomain(url: string): string {
  try {
    let formatted = url.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = "https://" + formatted;
    }
    return new URL(formatted).origin;
  } catch {
    return url.trim();
  }
}

interface FlatPage {
  url: string;
  parent_url: string | null;
  level: number;
  page_title: string | null;
}

interface TreeNodeData {
  url: string;
  title: string;
  level: number;
  children: TreeNodeData[];
}

function buildNestedTree(pages: FlatPage[]): TreeNodeData[] {
  if (pages.length === 0) return [];

  const nodeMap = new Map<string, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  for (const page of pages) {
    nodeMap.set(page.url, {
      url: page.url,
      title: page.page_title || "Untitled",
      level: page.level,
      children: [],
    });
  }

  for (const page of pages) {
    const node = nodeMap.get(page.url)!;
    if (page.parent_url && nodeMap.has(page.parent_url)) {
      nodeMap.get(page.parent_url)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
