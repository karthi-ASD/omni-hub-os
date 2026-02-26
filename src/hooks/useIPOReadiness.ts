import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IPOReadiness {
  id: string;
  governance_score: number;
  revenue_stability_score: number;
  audit_compliance_score: number;
  scalability_score: number;
  board_independence_score: number;
  overall_readiness_score: number;
  assessed_at: string;
}

export function useIPOReadiness() {
  const [assessments, setAssessments] = useState<IPOReadiness[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ipo_readiness").select("*").order("assessed_at", { ascending: false });
    setAssessments((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const assess = async (scores: Omit<IPOReadiness, "id" | "assessed_at" | "overall_readiness_score">) => {
    const overall = Math.round((scores.governance_score + scores.revenue_stability_score + scores.audit_compliance_score + scores.scalability_score + scores.board_independence_score) / 5);
    const { error } = await supabase.from("ipo_readiness").insert({ ...scores, overall_readiness_score: overall } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Assessment saved");
    fetch();
    return true;
  };

  return { assessments, loading, assess, refetch: fetch };
}
