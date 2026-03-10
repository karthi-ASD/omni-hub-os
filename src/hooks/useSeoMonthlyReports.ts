import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoMonthlyReport {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  report_month: string;
  report_data_json: any;
  report_pdf_url: string | null;
  generated_at: string;
  created_at: string;
}

export function useSeoMonthlyReports(projectId?: string) {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SeoMonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setReports([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_monthly_reports").select("*").eq("seo_project_id", projectId).order("report_month", { ascending: false });
    setReports((data as any as SeoMonthlyReport[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generate = async (reportMonth: string, reportData: any, clientId?: string) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_monthly_reports").insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      client_id: clientId,
      report_month: reportMonth,
      report_data_json: reportData,
    } as any);
    toast.success("Monthly report generated");
    fetch();
  };

  return { reports, loading, generate, refetch: fetch };
}
