import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface AdvocacyCampaign {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  category: string;
  campaign_type: string;
  start_date: string;
  end_date: string | null;
  rewards_enabled: boolean;
  status: string;
  share_message_template: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AdvocacyShare {
  id: string;
  campaign_id: string;
  user_id: string;
  platform: string;
  referral_code: string;
  shared_at: string;
}

export interface EmployeePoints {
  id: string;
  user_id: string;
  points_total: number;
  shares_count: number;
  clicks_count: number;
  leads_generated: number;
  sales_generated: number;
}

export interface ReferralClick {
  id: string;
  campaign_id: string;
  referrer_id: string;
  referrer_type: string;
  lead_generated: boolean;
  sale_generated: boolean;
  click_timestamp: string;
}

export function useAdvocacy() {
  const { user, profile } = useAuth();
  const businessId = profile?.business_id;
  const [campaigns, setCampaigns] = useState<AdvocacyCampaign[]>([]);
  const [shares, setShares] = useState<AdvocacyShare[]>([]);
  const [leaderboard, setLeaderboard] = useState<(EmployeePoints & { full_name?: string })[]>([]);
  const [referrals, setReferrals] = useState<ReferralClick[]>([]);
  const [myPoints, setMyPoints] = useState<EmployeePoints | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [campRes, shareRes, pointsRes, refRes] = await Promise.all([
        supabase.from("advocacy_campaigns").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
        supabase.from("advocacy_shares").select("*").eq("business_id", businessId).order("shared_at", { ascending: false }),
        supabase.from("employee_advocacy_points").select("*").eq("business_id", businessId).order("points_total", { ascending: false }),
        supabase.from("referral_tracking").select("*").eq("business_id", businessId).order("click_timestamp", { ascending: false }),
      ]);

      setCampaigns((campRes.data as any[]) || []);
      setShares((shareRes.data as any[]) || []);
      setReferrals((refRes.data as any[]) || []);

      const pts = (pointsRes.data as any[]) || [];
      // Fetch names for leaderboard
      if (pts.length > 0) {
        const userIds = pts.map((p) => p.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
        setLeaderboard(pts.map((p) => ({ ...p, full_name: nameMap.get(p.user_id) || "Unknown" })));
      } else {
        setLeaderboard([]);
      }

      if (user) {
        const mine = pts.find((p) => p.user_id === user.id);
        setMyPoints(mine || null);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createCampaign = async (data: Partial<AdvocacyCampaign>) => {
    if (!businessId || !user) return;
    const { error } = await supabase.from("advocacy_campaigns").insert({
      ...data,
      business_id: businessId,
      created_by: user.id,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campaign created" });
    fetchAll();
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("advocacy_campaigns").update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchAll();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("advocacy_shares").delete().eq("campaign_id", id);
    await supabase.from("referral_tracking").delete().eq("campaign_id", id);
    const { error } = await supabase.from("advocacy_campaigns").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campaign deleted" });
    fetchAll();
  };

  const generateReferralCode = () => {
    if (!user) return "ref";
    return user.id.substring(0, 8);
  };

  const recordShare = async (campaignId: string, platform: string) => {
    if (!businessId || !user) return;
    const refCode = generateReferralCode();
    await supabase.from("advocacy_shares").insert({
      business_id: businessId,
      campaign_id: campaignId,
      user_id: user.id,
      platform,
      referral_code: refCode,
    } as any);

    // Upsert points
    const { data: existing } = await supabase
      .from("employee_advocacy_points")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("employee_advocacy_points").update({
        points_total: (existing as any).points_total + 5,
        shares_count: (existing as any).shares_count + 1,
        updated_at: new Date().toISOString(),
      } as any).eq("id", (existing as any).id);
    } else {
      await supabase.from("employee_advocacy_points").insert({
        business_id: businessId,
        user_id: user.id,
        points_total: 5,
        shares_count: 1,
      } as any);
    }

    toast({ title: `Shared on ${platform}`, description: "+5 points earned!" });
    fetchAll();
    return refCode;
  };

  const getCampaignStats = (campaignId: string) => {
    const campShares = shares.filter((s) => s.campaign_id === campaignId);
    const campRefs = referrals.filter((r) => r.campaign_id === campaignId);
    return {
      shares: campShares.length,
      clicks: campRefs.length,
      leads: campRefs.filter((r) => r.lead_generated).length,
      conversions: campRefs.filter((r) => r.sale_generated).length,
    };
  };

  return {
    campaigns,
    shares,
    leaderboard,
    referrals,
    myPoints,
    loading,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    recordShare,
    getCampaignStats,
    generateReferralCode,
    refetch: fetchAll,
  };
}
