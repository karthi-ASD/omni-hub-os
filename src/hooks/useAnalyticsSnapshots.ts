import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalyticsSnapshot {
  id: string;
  business_id: string;
  client_id: string | null;
  project_id: string | null;
  source: string;
  date: string;
  metrics_json: Record<string, any>;
  created_at: string;
}

export interface RoiMetric {
  id: string;
  business_id: string;
  client_id: string | null;
  project_id: string | null;
  period_start: string;
  period_end: string;
  total_spend: number;
  leads_generated: number;
  estimated_revenue: number;
  roi_multiple: number;
  breakdown_json: Record<string, any>;
  created_at: string;
}

export interface AiInsight {
  id: string;
  business_id: string;
  client_id: string | null;
  project_id: string | null;
  insight_type: string;
  title: string;
  description: string | null;
  severity: string;
  source_data_json: Record<string, any>;
  is_dismissed: boolean;
  created_at: string;
}

export function useAnalyticsSnapshots(clientId?: string, projectId?: string) {
  const { profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot[]>([]);
  const [seoData, setSeoData] = useState<AnalyticsSnapshot[]>([]);
  const [adsData, setAdsData] = useState<AnalyticsSnapshot[]>([]);
  const [roi, setRoi] = useState<RoiMetric | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const baseFilter = (query: any) => {
      let q = query.eq("business_id", profile.business_id);
      if (clientId) q = q.eq("client_id", clientId);
      if (projectId) q = q.eq("project_id", projectId);
      return q;
    };

    const [aRes, sRes, adRes, roiRes, insRes] = await Promise.all([
      baseFilter(supabase.from("analytics_snapshots").select("*"))
        .order("date", { ascending: false }).limit(30),
      baseFilter(supabase.from("seo_snapshots").select("*"))
        .order("date", { ascending: false }).limit(30),
      baseFilter(supabase.from("ads_snapshots").select("*"))
        .order("date", { ascending: false }).limit(30),
      baseFilter(supabase.from("roi_metrics").select("*"))
        .order("period_end", { ascending: false }).limit(1),
      baseFilter(supabase.from("ai_insights").select("*"))
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false }).limit(20),
    ]);

    setAnalyticsData((aRes.data as any[]) || []);
    setSeoData((sRes.data as any[]) || []);
    setAdsData((adRes.data as any[]) || []);
    setRoi((roiRes.data as any[])?.[0] || null);
    setInsights((insRes.data as any[]) || []);
    setLoading(false);
  }, [profile?.business_id, clientId, projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const dismissInsight = async (id: string) => {
    await supabase.from("ai_insights").update({ is_dismissed: true } as any).eq("id", id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  const generateInsights = async () => {
    if (!profile?.business_id) return;
    try {
      await supabase.functions.invoke("generate-ai-insights", {
        body: {
          business_id: profile.business_id,
          client_id: clientId || null,
          project_id: projectId || null,
        },
      });
      await fetchAll();
    } catch (err) {
      console.error("Failed to generate insights:", err);
    }
  };

  return {
    analyticsData, seoData, adsData, roi, insights,
    loading, dismissInsight, generateInsights, refetch: fetchAll,
  };
}
