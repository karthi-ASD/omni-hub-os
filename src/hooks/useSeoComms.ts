import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoCommunicationLog {
  id: string;
  campaign_id: string;
  communication_type: string;
  summary: string | null;
  follow_up_date: string | null;
  assigned_to_user_id: string | null;
  attachment_url: string | null;
  created_at: string;
}

export function useSeoComms(campaignId?: string) {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<SeoCommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("seo_communication_logs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    setLogs((data as any as SeoCommunicationLog[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLog = async (input: { communication_type: string; summary?: string; follow_up_date?: string }) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_communication_logs").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("Communication logged");
    fetch();
  };

  return { logs, loading, addLog, refetch: fetch };
}
