import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlanLimits {
  planName: string;
  userLimit: number;
  projectLimit: number;
  storageLimitGb: number;
  features: string[];
  currentUsers: number;
  currentProjects: number;
  isUnlimited: boolean;
  canAddUser: boolean;
  canAddProject: boolean;
  subscriptionStatus: string;
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  loading: boolean;
}

export function usePlanLimits(): PlanLimits {
  const { profile, isSuperAdmin } = useAuth();
  const [limits, setLimits] = useState<PlanLimits>({
    planName: "Free",
    userLimit: 0,
    projectLimit: 0,
    storageLimitGb: 0,
    features: [],
    currentUsers: 0,
    currentProjects: 0,
    isUnlimited: false,
    canAddUser: true,
    canAddProject: true,
    subscriptionStatus: "none",
    isTrialExpired: false,
    trialEndsAt: null,
    loading: true,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      setLimits(prev => ({ ...prev, isUnlimited: true, canAddUser: true, canAddProject: true, loading: false, planName: "Super Admin" }));
      return;
    }

    if (!profile?.business_id) {
      setLimits(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetch = async () => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*, saas_plans(*)")
        .eq("business_id", profile.business_id!)
        .single() as any;

      if (!sub) {
        setLimits(prev => ({ ...prev, loading: false, subscriptionStatus: "none" }));
        return;
      }

      const plan = sub.saas_plans;
      const userLimit = plan?.user_limit ?? 5;
      const projectLimit = plan?.project_limit ?? 10;
      const isUnlimited = userLimit === -1;

      // Count current usage
      const [usersRes, projectsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("business_id", profile.business_id!),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("business_id", profile.business_id!),
      ]);

      const currentUsers = usersRes.count || 0;
      const currentProjects = projectsRes.count || 0;
      const trialExpired = sub.status === "trial" && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();

      setLimits({
        planName: plan?.name || "Unknown",
        userLimit,
        projectLimit,
        storageLimitGb: plan?.storage_limit_gb || 1,
        features: Array.isArray(plan?.features_json) ? plan.features_json : [],
        currentUsers,
        currentProjects,
        isUnlimited,
        canAddUser: isUnlimited || currentUsers < userLimit,
        canAddProject: isUnlimited || currentProjects < projectLimit,
        subscriptionStatus: sub.status,
        isTrialExpired: !!trialExpired,
        trialEndsAt: sub.trial_ends_at,
        loading: false,
      });
    };

    fetch();
  }, [profile?.business_id, isSuperAdmin]);

  return limits;
}
