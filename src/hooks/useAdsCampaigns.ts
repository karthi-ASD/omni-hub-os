import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdsCampaign {
  id: string;
  business_id: string;
  client_id: string | null;
  platform: string;
  campaign_name: string;
  campaign_external_id: string | null;
  status: string;
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  leads: number;
  cpc: number;
  ctr: number;
  created_at: string;
}

export function useAdsCampaigns() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("ads_campaigns")
      .select("*")
      .order("date", { ascending: false })
      .limit(200);
    setCampaigns((data as any as AdsCampaign[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const syncCampaigns = async (platform: string, campaigns: any[], clientId?: string) => {
    if (!profile?.business_id) return;
    const { data, error } = await supabase.functions.invoke("ads-sync", {
      body: {
        platform,
        business_id: profile.business_id,
        client_id: clientId,
        campaigns,
      },
    });
    if (error) throw error;
    fetchAll();
    return data;
  };

  // Aggregate stats
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.clicks), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + Number(c.impressions), 0);
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    campaigns, loading, syncCampaigns, refetch: fetchAll,
    stats: { totalSpend, totalClicks, totalImpressions, totalConversions, avgCtr },
  };
}
