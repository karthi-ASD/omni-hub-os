import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemHealthEntry {
  id: string;
  service_name: string;
  status: string;
  response_time_ms: number | null;
  details_json: any;
  last_checked: string;
}

export interface BackgroundJob {
  id: string;
  business_id: string | null;
  job_type: string;
  status: string;
  retries: number;
  max_retries: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  business_id: string | null;
  error_type: string;
  message: string;
  stack_trace: string | null;
  request_path: string | null;
  user_id: string | null;
  created_at: string;
}

export interface HealthCheck {
  id: string;
  service_name: string;
  status: string;
  latency_ms: number | null;
  error_message: string | null;
  last_checked_at: string;
}

export interface FeatureFlag {
  id: string;
  scope_level: string;
  business_id: string | null;
  flag_key: string;
  enabled: boolean;
  created_at: string;
}

export function useSystemMonitoring() {
  const [health, setHealth] = useState<SystemHealthEntry[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [hRes, jRes, eRes, hcRes, ffRes] = await Promise.all([
      supabase.from("system_health").select("*").order("last_checked", { ascending: false }).limit(50),
      supabase.from("background_jobs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("system_health_checks").select("*").order("last_checked_at", { ascending: false }).limit(50),
      supabase.from("feature_flags").select("*").order("created_at", { ascending: false }),
    ]);
    setHealth((hRes.data as any) || []);
    setJobs((jRes.data as any) || []);
    setErrors((eRes.data as any) || []);
    setHealthChecks((hcRes.data as any) || []);
    setFeatureFlags((ffRes.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("system-health-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_health" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const jobStats = {
    pending: jobs.filter(j => j.status === "pending").length,
    processing: jobs.filter(j => j.status === "processing").length,
    failed: jobs.filter(j => j.status === "failed").length,
    completed: jobs.filter(j => j.status === "completed").length,
  };

  const toggleFeatureFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("feature_flags").update({ enabled } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchAll();
  };

  const addFeatureFlag = async (flag: { flag_key: string; scope_level: string; enabled: boolean }) => {
    const { error } = await supabase.from("feature_flags").insert(flag as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Feature flag created");
    fetchAll();
    return true;
  };

  return { health, jobs, errors, healthChecks, featureFlags, loading, jobStats, toggleFeatureFlag, addFeatureFlag, refetch: fetchAll };
}
