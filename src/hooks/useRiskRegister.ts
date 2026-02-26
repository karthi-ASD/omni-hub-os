import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Risk {
  id: string;
  risk_category: string;
  description: string;
  impact_level: string;
  mitigation_plan: string | null;
  owner: string | null;
  status: string;
  created_at: string;
}

export function useRiskRegister() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("risk_register").select("*").order("created_at", { ascending: false });
    setRisks((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (risk: { risk_category: string; description: string; impact_level: string; mitigation_plan?: string; owner?: string }) => {
    const { error } = await supabase.from("risk_register").insert(risk as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Risk added");
    fetch();
    return true;
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("risk_register").update({ status } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Risk updated");
    fetch();
  };

  return { risks, loading, create, updateStatus, refetch: fetch };
}
