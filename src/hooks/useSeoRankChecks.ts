import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GoogleRankCheck {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  keyword_id: string | null;
  keyword: string;
  location: string | null;
  device_type: string;
  search_engine: string;
  rank_position: number | null;
  url_found: string | null;
  search_date: string;
  created_at: string;
}

export function useSeoRankChecks(projectId?: string) {
  const { profile } = useAuth();
  const [checks, setChecks] = useState<GoogleRankCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setChecks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("google_rank_checks") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("search_date", { ascending: false })
      .limit(500);
    setChecks((data as GoogleRankCheck[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addCheck = async (input: {
    keyword: string;
    rank_position?: number;
    location?: string;
    device_type?: string;
    url_found?: string;
    keyword_id?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("google_rank_checks") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Rank check recorded");
    fetch();
  };

  return { checks, loading, addCheck, refetch: fetch };
}
