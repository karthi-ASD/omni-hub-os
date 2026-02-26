import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FranchiseModel {
  id: string;
  region: string;
  entry_fee: number;
  revenue_share_percentage: number;
  required_team_size: number;
  projected_break_even_month: number;
  support_cost: number;
  created_at: string;
}

export interface FranchiseCandidate {
  id: string;
  candidate_name: string;
  region: string;
  capital_available: number;
  experience_score: number;
  fit_score: number;
  status: string;
  created_at: string;
}

export function useFranchise() {
  const [models, setModels] = useState<FranchiseModel[]>([]);
  const [candidates, setCandidates] = useState<FranchiseCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [m, c] = await Promise.all([
      supabase.from("franchise_models").select("*").order("created_at", { ascending: false }),
      supabase.from("franchise_pipeline").select("*").order("fit_score", { ascending: false }),
    ]);
    setModels((m.data as any) || []);
    setCandidates((c.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addModel = async (model: { region: string; entry_fee: number; revenue_share_percentage: number; required_team_size: number; projected_break_even_month: number; support_cost: number }) => {
    const { error } = await supabase.from("franchise_models").insert(model as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Franchise model created");
    fetchAll();
    return true;
  };

  const addCandidate = async (c: { candidate_name: string; region: string; capital_available: number; experience_score: number; fit_score: number }) => {
    const { error } = await supabase.from("franchise_pipeline").insert(c as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Candidate added");
    fetchAll();
    return true;
  };

  const updateCandidateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("franchise_pipeline").update({ status } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchAll();
  };

  return { models, candidates, loading, addModel, addCandidate, updateCandidateStatus, refetch: fetchAll };
}
