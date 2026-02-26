import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useSystemMonitoring() {
  const [health, setHealth] = useState<SystemHealthEntry[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [hRes, jRes, eRes] = await Promise.all([
      supabase.from("system_health").select("*").order("last_checked", { ascending: false }).limit(50),
      supabase.from("background_jobs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setHealth((hRes.data as any) || []);
    setJobs((jRes.data as any) || []);
    setErrors((eRes.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime for system_health
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

  return { health, jobs, errors, loading, jobStats, refetch: fetchAll };
}
