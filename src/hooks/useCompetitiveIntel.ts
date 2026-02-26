import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Competitor {
  id: string;
  company_name: string;
  estimated_arr: number;
  feature_overlap_score: number;
  pricing_comparison: string | null;
  strength_score: number;
  threat_level: string;
  created_at: string;
}

export function useCompetitiveIntel() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("competitors").select("*").order("threat_level", { ascending: true });
    setCompetitors((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (c: { company_name: string; estimated_arr: number; feature_overlap_score: number; strength_score: number; threat_level: string; pricing_comparison?: string }) => {
    const { error } = await supabase.from("competitors").insert(c as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Competitor added");
    fetch();
    return true;
  };

  return { competitors, loading, add, refetch: fetch };
}
