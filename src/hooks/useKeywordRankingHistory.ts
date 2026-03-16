import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RankingHistoryRow {
  id: string;
  business_id: string;
  keyword_id: string;
  rank_position: number | null;
  date_checked: string;
  search_engine: string | null;
  device: string | null;
  created_at: string;
}

export function useKeywordRankingHistory(keywordIds: string[]) {
  const [history, setHistory] = useState<RankingHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!keywordIds.length) { setHistory([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("keyword_ranking_history") as any)
      .select("*")
      .in("keyword_id", keywordIds)
      .order("date_checked", { ascending: true })
      .limit(1000);
    setHistory((data as RankingHistoryRow[]) || []);
    setLoading(false);
  }, [keywordIds.join(",")]);

  useEffect(() => { fetch(); }, [fetch]);

  return { history, loading, refetch: fetch };
}
