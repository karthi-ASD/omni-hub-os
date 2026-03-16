import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoReport {
  id: string;
  seo_project_id: string | null;
  report_month: string;
  traffic_current: number;
  traffic_previous: number;
  keywords_improved: number;
  keywords_dropped: number;
  backlinks_built: number;
  tasks_completed: number;
  conversions: number;
  report_pdf_url: string | null;
  client_sent_date: string | null;
  client_feedback: string | null;
  created_at: string;
}

export function useSeoReports(projectId?: string) {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SeoReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setReports([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_reports") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("report_month", { ascending: false });
    setReports((data as SeoReport[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addReport = async (input: {
    report_month: string;
    traffic_current?: number;
    traffic_previous?: number;
    keywords_improved?: number;
    keywords_dropped?: number;
    backlinks_built?: number;
    tasks_completed?: number;
    conversions?: number;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_reports") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Report added");
    fetch();
  };

  return { reports, loading, addReport, refetch: fetch };
}
