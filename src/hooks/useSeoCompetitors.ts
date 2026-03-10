import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoCompetitor {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  competitor_domain: string;
  competitor_name: string | null;
  created_at: string;
}

export interface CompetitorKeywordRanking {
  id: string;
  competitor_id: string;
  keyword: string;
  rank_position: number | null;
  search_engine: string;
  date_checked: string;
  created_at: string;
}

export function useSeoCompetitors(projectId?: string) {
  const { profile } = useAuth();
  const [competitors, setCompetitors] = useState<SeoCompetitor[]>([]);
  const [rankings, setRankings] = useState<CompetitorKeywordRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setCompetitors([]); setRankings([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_competitors").select("*").eq("seo_project_id", projectId).order("created_at");
    const comps = (data as any as SeoCompetitor[]) || [];
    setCompetitors(comps);
    if (comps.length > 0) {
      const ids = comps.map(c => c.id);
      const { data: rData } = await supabase.from("competitor_keyword_rankings").select("*").in("competitor_id", ids).order("date_checked", { ascending: false });
      setRankings((rData as any as CompetitorKeywordRanking[]) || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addCompetitor = async (input: { competitor_domain: string; competitor_name?: string; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_competitors").insert({ business_id: profile.business_id, seo_project_id: projectId, ...input } as any);
    toast.success("Competitor added");
    fetch();
  };

  const addRanking = async (input: { competitor_id: string; keyword: string; rank_position: number }) => {
    await supabase.from("competitor_keyword_rankings").insert(input as any);
    fetch();
  };

  return { competitors, rankings, loading, addCompetitor, addRanking, refetch: fetch };
}
