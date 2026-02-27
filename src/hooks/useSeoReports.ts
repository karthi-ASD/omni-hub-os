import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoReport {
  id: string;
  campaign_id: string;
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

export function useSeoReports(campaignId?: string) {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SeoReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setReports([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("seo_reports")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    setReports((data as any as SeoReport[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addReport = async (input: Omit<SeoReport, "id" | "campaign_id" | "created_at">) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_reports").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("Report added");
    fetch();
  };

  return { reports, loading, addReport, refetch: fetch };
}
