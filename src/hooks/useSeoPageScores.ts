import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoPageScore {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  page_url: string;
  page_title: string | null;
  primary_keyword: string | null;
  seo_score: number;
  readability_score: number | null;
  content_length: number | null;
  keyword_density: number | null;
  internal_links_count: number | null;
  images_count: number | null;
  alt_tags_count: number | null;
  technical_score: number | null;
  meta_score: number | null;
  content_score: number | null;
  local_seo_score: number | null;
  recommendations_json: any;
  last_scanned_at: string;
  created_at: string;
}

export function useSeoPageScores(projectId?: string) {
  const { profile } = useAuth();
  const [scores, setScores] = useState<SeoPageScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setScores([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_page_scores") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("seo_score", { ascending: true });
    setScores((data as SeoPageScore[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const scanPage = async (pageUrl: string, primaryKeyword?: string) => {
    if (!profile?.business_id || !projectId) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: {
          task_type: "seo_page_score",
          payload: { page_url: pageUrl, primary_keyword: primaryKeyword, project_id: projectId },
        },
      });
      if (error) throw error;
      const r = data?.result || {};

      await (supabase.from("seo_page_scores") as any).upsert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        page_url: pageUrl,
        page_title: r.page_title || pageUrl,
        primary_keyword: primaryKeyword,
        seo_score: r.seo_score || 0,
        readability_score: r.readability_score,
        content_length: r.content_length,
        keyword_density: r.keyword_density,
        internal_links_count: r.internal_links_count,
        images_count: r.images_count,
        alt_tags_count: r.alt_tags_count,
        technical_score: r.technical_score,
        meta_score: r.meta_score,
        content_score: r.content_score,
        local_seo_score: r.local_seo_score,
        recommendations_json: r.recommendations || [],
        last_scanned_at: new Date().toISOString(),
      }, { onConflict: "id" });

      toast.success(`Page scored: ${r.seo_score || 0}/100`);
      fetch();
    } catch {
      toast.error("Failed to score page");
    }
    setScanning(false);
  };

  return { scores, loading, scanning, scanPage, refetch: fetch };
}
