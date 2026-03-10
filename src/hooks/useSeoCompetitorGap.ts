import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoCompetitorGap {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  competitor_id: string | null;
  keyword: string | null;
  client_rank: number | null;
  competitor_rank: number | null;
  gap_type: string;
  opportunity_score: number | null;
  recommendation: string | null;
  created_at: string;
}

export const GAP_TYPES = ["KEYWORD_GAP", "CONTENT_GAP", "BACKLINK_GAP", "TECHNICAL_GAP", "LOCAL_SEO_GAP"];

export function useSeoCompetitorGap(projectId?: string) {
  const { profile } = useAuth();
  const [gaps, setGaps] = useState<SeoCompetitorGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setGaps([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_competitor_gap") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("opportunity_score", { ascending: false });
    setGaps((data as SeoCompetitorGap[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const analyzeGaps = async (competitorData: any) => {
    if (!profile?.business_id || !projectId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: {
          task_type: "seo_competitor_gap",
          payload: { ...competitorData, project_id: projectId },
        },
      });
      if (error) throw error;
      const gaps = data?.result?.gaps || [];
      for (const g of gaps) {
        await (supabase.from("seo_competitor_gap") as any).insert({
          business_id: profile.business_id,
          seo_project_id: projectId,
          competitor_id: competitorData.competitor_id,
          keyword: g.keyword,
          client_rank: g.client_rank,
          competitor_rank: g.competitor_rank,
          gap_type: g.gap_type || "KEYWORD_GAP",
          opportunity_score: g.opportunity_score,
          recommendation: g.recommendation,
        });
      }
      toast.success(`${gaps.length} gap opportunities identified`);
      fetch();
    } catch {
      toast.error("Failed to analyze gaps");
    }
    setAnalyzing(false);
  };

  return { gaps, loading, analyzing, analyzeGaps, refetch: fetch };
}
