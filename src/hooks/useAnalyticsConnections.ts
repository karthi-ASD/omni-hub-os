import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalyticsConnection {
  id: string;
  business_id: string;
  provider: string;
  auth_type: string;
  external_account_id: string | null;
  status: string;
  created_at: string;
}

export interface AnalyticsDailyMetric {
  id: string;
  business_id: string;
  date: string;
  sessions: number;
  users_count: number;
  leads_count: number;
  gsc_clicks: number;
  gsc_impressions: number;
  gsc_ctr: number;
  gsc_avg_position: number;
  gbp_calls: number;
  gbp_direction_requests: number;
  gbp_website_clicks: number;
  ads_spend: number;
  ads_clicks: number;
  ads_impressions: number;
  created_at: string;
}

export function useAnalyticsConnections() {
  const { profile } = useAuth();
  const [connections, setConnections] = useState<AnalyticsConnection[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsDailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const [c, m] = await Promise.all([
      supabase.from("analytics_connections").select("*").order("created_at", { ascending: false }),
      supabase.from("analytics_daily_metrics").select("*").order("date", { ascending: false }).limit(90),
    ]);
    setConnections((c.data as any) || []);
    setMetrics((m.data as any) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addConnection = async (provider: string) => {
    if (!profile?.business_id) return;
    await supabase.from("analytics_connections").insert({
      business_id: profile.business_id, provider, auth_type: "OAUTH", status: "pending",
    } as any);
    fetchAll();
  };

  return { connections, metrics, loading, addConnection, refetch: fetchAll };
}
