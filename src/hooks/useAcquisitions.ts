import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AcquisitionTarget {
  id: string;
  company_name: string;
  arr: number;
  churn_rate: number;
  margin: number;
  tech_stack: string | null;
  integration_complexity_score: number;
  acquisition_score: number;
  status: string;
  created_at: string;
}

export interface AcquisitionScenario {
  id: string;
  target_id: string | null;
  purchase_price: number;
  projected_synergy: number;
  cost_savings: number;
  integration_plan_json: any;
  roi_projection: number;
  created_at: string;
}

export function useAcquisitions() {
  const [targets, setTargets] = useState<AcquisitionTarget[]>([]);
  const [scenarios, setScenarios] = useState<AcquisitionScenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      supabase.from("acquisition_targets").select("*").order("acquisition_score", { ascending: false }),
      supabase.from("acquisition_scenarios").select("*").order("created_at", { ascending: false }),
    ]);
    setTargets((t.data as any) || []);
    setScenarios((s.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTarget = async (t: { company_name: string; arr: number; churn_rate: number; margin: number; tech_stack?: string; acquisition_score: number }) => {
    const { error } = await supabase.from("acquisition_targets").insert(t as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Target added");
    fetchAll();
    return true;
  };

  const addScenario = async (s: { target_id: string; purchase_price: number; projected_synergy: number; cost_savings: number; roi_projection: number }) => {
    const { error } = await supabase.from("acquisition_scenarios").insert(s as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Scenario created");
    fetchAll();
    return true;
  };

  const updateTargetStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("acquisition_targets").update({ status } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchAll();
  };

  return { targets, scenarios, loading, addTarget, addScenario, updateTargetStatus, refetch: fetchAll };
}
