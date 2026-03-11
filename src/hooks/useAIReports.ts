import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AIReport {
  id: string;
  business_id: string;
  report_type: string;
  report_period: string;
  summary_text: string | null;
  data_snapshot_json: any;
  generated_by_user_id: string | null;
  model_used: string | null;
  created_at: string;
}

export function useAIReports() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const businessId = profile?.business_id;

  const fetchReports = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ai_reports" as any)
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    setReports((data as any) || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const generateReport = async (period: string) => {
    if (!businessId || !user) return null;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-report-generator", {
        body: { business_id: businessId, period, user_id: user.id },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      toast.success("Report generated!");
      fetchReports();
      return data.report as AIReport;
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate report");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id: string) => {
    await supabase.from("ai_reports" as any).delete().eq("id", id);
    toast.success("Report deleted");
    fetchReports();
  };

  return { reports, loading, generating, generateReport, deleteReport, refetch: fetchReports };
}
