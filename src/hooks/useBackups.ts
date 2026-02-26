import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BackupJob {
  id: string;
  backup_type: string;
  frequency: string;
  retention_days: number;
  status: string;
  last_run_at: string | null;
  created_at: string;
}

export interface BackupRun {
  id: string;
  backup_job_id: string;
  status: string;
  backup_location: string | null;
  created_at: string;
  error_message: string | null;
}

export function useBackups() {
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [j, r] = await Promise.all([
      supabase.from("backup_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("backup_runs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setJobs((j.data as any) || []);
    setRuns((r.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createJob = async (job: { backup_type: string; frequency: string; retention_days: number }) => {
    const { error } = await supabase.from("backup_jobs").insert(job as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Backup job created");
    fetchAll();
    return true;
  };

  return { jobs, runs, loading, createJob, refetch: fetchAll };
}
