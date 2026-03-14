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
  caption_template: string | null;
  visibility_type: string;
  visibility_targets: string[];
  reward_type: string;
  reward_trigger: string;
  points_per_share: number;
  points_per_click: number;
  points_per_lead: number;
  points_per_sale: number;
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
  channel: string | null;
}

export interface AdvocacyBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_label: string;
  earned_at: string;
}

export interface AdvocacySettings {
  id: string;
  business_id: string;
  default_points_per_share: number;
  default_points_per_click: number;
  default_points_per_lead: number;
  default_points_per_sale: number;
  anti_fraud_cooldown_seconds: number;
  default_network_size: number;
}

export function useAdvocacy() {
  const { user, profile } = useAuth();
  const businessId = profile?.business_id;
  const [campaigns, setCampaigns] = useState<AdvocacyCampaign[]>([]);
  const [shares, setShares] = useState<AdvocacyShare[]>([]);
  const [leaderboard, setLeaderboard] = useState<(EmployeePoints & { full_name?: string })[]>([]);
  const [referrals, setReferrals] = useState<ReferralClick[]>([]);
  const [myPoints, setMyPoints] = useState<EmployeePoints | null>(null);
  const [badges, setBadges] = useState<AdvocacyBadge[]>([]);
  const [settings, setSettings] = useState<AdvocacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [campRes, shareRes, pointsRes, refRes, badgeRes, settingsRes] = await Promise.all([
        supabase.from("advocacy_campaigns").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
        supabase.from("advocacy_shares").select("*").eq("business_id", businessId).order("shared_at", { ascending: false }),
        supabase.from("employee_advocacy_points").select("*").eq("business_id", businessId).order("points_total", { ascending: false }),
        supabase.from("referral_tracking").select("*").eq("business_id", businessId).order("click_timestamp", { ascending: false }),
        supabase.from("advocacy_badges").select("*").eq("business_id", businessId),
        supabase.from("advocacy_settings").select("*").eq("business_id", businessId).maybeSingle(),
      ]);

      setCampaigns((campRes.data as any[]) || []);
      setShares((shareRes.data as any[]) || []);
      setReferrals((refRes.data as any[]) || []);
      setBadges((badgeRes.data as any[]) || []);
      setSettings((settingsRes.data as any) || null);

      const pts = (pointsRes.data as any[]) || [];
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
    toast({ title: `Campaign ${status}` });
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

    // Anti-fraud: check cooldown
    const cooldownSec = settings?.anti_fraud_cooldown_seconds || 60;
    const recentShare = shares.find(
      (s) => s.campaign_id === campaignId && s.user_id === user.id && s.platform === platform &&
        (Date.now() - new Date(s.shared_at).getTime()) < cooldownSec * 1000
    );
    if (recentShare) {
      toast({ title: "Please wait", description: `You can share again in ${cooldownSec} seconds.`, variant: "destructive" });
      return refCode;
    }

    await supabase.from("advocacy_shares").insert({
      business_id: businessId,
      campaign_id: campaignId,
      user_id: user.id,
      platform,
      referral_code: refCode,
    } as any);

    // Get campaign point config
    const camp = campaigns.find((c) => c.id === campaignId);
    const pointsForShare = camp?.points_per_share || settings?.default_points_per_share || 5;

    // Upsert points
    const { data: existing } = await supabase
      .from("employee_advocacy_points")
      .select("*")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("employee_advocacy_points").update({
        points_total: (existing as any).points_total + pointsForShare,
        shares_count: (existing as any).shares_count + 1,
        updated_at: new Date().toISOString(),
      } as any).eq("id", (existing as any).id);
    } else {
      await supabase.from("employee_advocacy_points").insert({
        business_id: businessId,
        user_id: user.id,
        points_total: pointsForShare,
        shares_count: 1,
      } as any);
    }

    toast({ title: `Shared on ${platform}`, description: `+${pointsForShare} points earned!` });
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

  const getPlatformBreakdown = () => {
    const breakdown: Record<string, { shares: number; clicks: number; leads: number }> = {};
    shares.forEach((s) => {
      if (!breakdown[s.platform]) breakdown[s.platform] = { shares: 0, clicks: 0, leads: 0 };
      breakdown[s.platform].shares++;
    });
    referrals.forEach((r) => {
      const ch = (r as any).channel || "direct";
      if (!breakdown[ch]) breakdown[ch] = { shares: 0, clicks: 0, leads: 0 };
      breakdown[ch].clicks++;
      if (r.lead_generated) breakdown[ch].leads++;
    });
    return Object.entries(breakdown).map(([platform, data]) => ({ platform, ...data }));
  };

  const saveSettings = async (data: Partial<AdvocacySettings>) => {
    if (!businessId) return;
    if (settings) {
      await supabase.from("advocacy_settings").update({ ...data, updated_at: new Date().toISOString() } as any).eq("id", settings.id);
    } else {
      await supabase.from("advocacy_settings").insert({ ...data, business_id: businessId } as any);
    }
    toast({ title: "Settings saved" });
    fetchAll();
  };

  const getMyBadges = () => badges.filter((b) => b.user_id === user?.id);

  return {
    campaigns,
    shares,
    leaderboard,
    referrals,
    myPoints,
    badges,
    settings,
    loading,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    recordShare,
    getCampaignStats,
    getPlatformBreakdown,
    generateReferralCode,
    saveSettings,
    getMyBadges,
    refetch: fetchAll,
  };
}
