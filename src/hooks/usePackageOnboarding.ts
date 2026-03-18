import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OnboardingStep {
  id: string;
  package_id: string;
  step_name: string;
  status: "pending" | "in_progress" | "completed";
  sort_order: number;
  updated_at: string;
}

export function usePackageOnboarding(packageId: string | undefined, canEditOnboarding = false) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = useCallback(async () => {
    if (!packageId) { setLoading(false); return; }
    const { data } = await supabase
      .from("package_onboarding_status" as any)
      .select("*")
      .eq("package_id", packageId)
      .order("sort_order", { ascending: true });
    setSteps((data as any as OnboardingStep[]) || []);
    setLoading(false);
  }, [packageId]);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  const updateStepStatus = async (stepId: string, status: OnboardingStep["status"]) => {
    if (!canEditOnboarding) {
      console.warn("Unauthorized onboarding update blocked");
      return;
    }

    const { error } = await supabase
      .from("package_onboarding_status" as any)
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", stepId);

    if (error) {
      toast.error("Failed to update onboarding status");
      return;
    }

    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
    toast.success(`Step marked as ${status}`);
  };

  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const allComplete = steps.length > 0 && completedCount === steps.length;

  return { steps, loading, updateStepStatus, progress, completedCount, allComplete, refetch: fetchSteps };
}
