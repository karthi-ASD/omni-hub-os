import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GscDataRow {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
  created_at: string;
}

export function useGscData(projectId?: string) {
  const { profile } = useAuth();
  const [data, setData] = useState<GscDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setData([]); setLoading(false); return; }
    setLoading(true);
    const { data: rows } = await supabase
      .from("gsc_data")
      .select("*")
      .eq("seo_project_id", projectId)
      .order("date", { ascending: false })
      .limit(500);
    setData((rows as any as GscDataRow[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
