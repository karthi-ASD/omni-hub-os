import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoCommunicationLog {
  id: string;
  seo_project_id: string | null;
  communication_type: string;
  summary: string | null;
  follow_up_date: string | null;
  assigned_to_user_id: string | null;
  attachment_url: string | null;
  created_at: string;
}

export function useSeoComms(projectId?: string) {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<SeoCommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_communication_logs") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false });
    setLogs((data as SeoCommunicationLog[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLog = async (input: {
    communication_type: string;
    summary?: string;
    follow_up_date?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_communication_logs") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Communication logged");
    fetch();
  };

  return { logs, loading, addLog, refetch: fetch };
}
