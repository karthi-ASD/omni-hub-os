import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExpansionTarget {
  id: string;
  region: string;
  industry: string | null;
  demand_score: number;
  partner_gap_score: number;
  seo_opportunity_score: number;
  sales_density: number;
  created_at: string;
}

export interface AIExpansionStrategy {
  id: string;
  target_region: string;
  recommended_action: string;
  projected_roi: number;
  confidence: number;
  created_at: string;
}

export function useExpansionEngine() {
  const [targets, setTargets] = useState<ExpansionTarget[]>([]);
  const [strategies, setStrategies] = useState<AIExpansionStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      supabase.from("expansion_targets").select("*").order("demand_score", { ascending: false }),
      supabase.from("ai_expansion_strategies").select("*").order("projected_roi", { ascending: false }),
    ]);
    setTargets((t.data as any) || []);
    setStrategies((s.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTarget = async (target: { region: string; industry?: string; demand_score: number; partner_gap_score: number; seo_opportunity_score: number; sales_density: number }) => {
    const { error } = await supabase.from("expansion_targets").insert(target as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Target added");
    fetchAll();
    return true;
  };

  const addStrategy = async (strategy: { target_region: string; recommended_action: string; projected_roi: number; confidence: number }) => {
    const { error } = await supabase.from("ai_expansion_strategies").insert(strategy as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Strategy added");
    fetchAll();
    return true;
  };

  return { targets, strategies, loading, addTarget, addStrategy, refetch: fetchAll };
}
