import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CapitalAllocation {
  id: string;
  scenario_type: string;
  investment_amount: number;
  projected_roi: number;
  time_horizon: number;
  risk_score: number;
  created_at: string;
}

export function useCapitalAllocation() {
  const [models, setModels] = useState<CapitalAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("capital_allocation_models").select("*").order("projected_roi", { ascending: false });
    setModels((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (m: { scenario_type: string; investment_amount: number; projected_roi: number; time_horizon: number; risk_score: number }) => {
    const { error } = await supabase.from("capital_allocation_models").insert(m as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Scenario created");
    fetch();
    return true;
  };

  return { models, loading, add, refetch: fetch };
}
