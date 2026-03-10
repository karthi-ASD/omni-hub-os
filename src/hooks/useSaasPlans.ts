import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SaasPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  user_limit: number;
  project_limit: number;
  storage_limit_gb: number;
  features_json: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useSaasPlans() {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("saas_plans")
      .select("*")
      .order("sort_order", { ascending: true });
    setPlans(
      (data || []).map((p: any) => ({
        ...p,
        monthly_price: Number(p.monthly_price),
        yearly_price: Number(p.yearly_price),
        features_json: Array.isArray(p.features_json) ? p.features_json : [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const createPlan = async (input: Partial<SaasPlan>) => {
    const { error } = await supabase.from("saas_plans").insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      monthly_price: input.monthly_price,
      yearly_price: input.yearly_price,
      user_limit: input.user_limit,
      project_limit: input.project_limit,
      storage_limit_gb: input.storage_limit_gb,
      features_json: input.features_json,
      sort_order: input.sort_order || 0,
    } as any);
    if (error) { toast.error("Failed to create plan"); return; }
    toast.success("Plan created");
    fetchPlans();
  };

  const updatePlan = async (id: string, input: Partial<SaasPlan>) => {
    const { error } = await supabase.from("saas_plans").update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      monthly_price: input.monthly_price,
      yearly_price: input.yearly_price,
      user_limit: input.user_limit,
      project_limit: input.project_limit,
      storage_limit_gb: input.storage_limit_gb,
      features_json: input.features_json,
      is_active: input.is_active,
      sort_order: input.sort_order,
      updated_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) { toast.error("Failed to update plan"); return; }
    toast.success("Plan updated");
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("saas_plans").delete().eq("id", id);
    if (error) { toast.error("Failed to delete plan"); return; }
    toast.success("Plan deleted");
    fetchPlans();
  };

  return { plans, loading, createPlan, updatePlan, deletePlan, refetch: fetchPlans };
}
