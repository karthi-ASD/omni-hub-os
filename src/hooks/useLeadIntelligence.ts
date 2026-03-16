import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LeadIntelligence {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  stage: string;
  lead_score: number;
  lead_temperature: string;
  last_activity_at: string | null;
  total_calls: number;
  total_emails: number;
  total_whatsapp: number;
  website_visits: number;
  proposal_sent: boolean;
  last_contact_method: string | null;
  engagement_score: number;
  response_speed_hours: number | null;
  ai_prediction: string;
  next_follow_up_at: string | null;
  assigned_to_user_id: string | null;
  services_needed: string | null;
  created_at: string;
  source: string;
}

function calculateTemperature(score: number): string {
  if (score >= 71) return "hot";
  if (score >= 31) return "warm";
  return "cold";
}

function calculatePrediction(score: number, proposalSent: boolean, hasFollowUp: boolean): string {
  if (score > 75 && proposalSent && hasFollowUp) return "likely_to_convert";
  if (score < 30) return "low_probability";
  return "needs_follow_up";
}

export function useLeadIntelligence() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<LeadIntelligence[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const { data } = await supabase
      .from("leads")
      .select("id, name, email, phone, business_name, stage, lead_score, lead_temperature, last_activity_at, total_calls, total_emails, total_whatsapp, website_visits, proposal_sent, last_contact_method, engagement_score, response_speed_hours, ai_prediction, next_follow_up_at, assigned_to_user_id, services_needed, created_at, source, status")
      .eq("business_id", profile.business_id)
      .eq("status", "active")
      .order("lead_score", { ascending: false })
      .limit(500);

    setLeads((data as any as LeadIntelligence[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  /**
   * Recalculate score for a single lead based on its activities.
   */
  const recalculateScore = async (leadId: string) => {
    if (!profile?.business_id) return;

    // Fetch activities for this lead
    const { data: activities } = await supabase
      .from("lead_activities")
      .select("type, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    const acts = activities || [];
    let score = 0;
    let totalCalls = 0;
    let totalEmails = 0;
    let totalWhatsapp = 0;
    let lastContactMethod: string | null = null;
    let lastActivityAt: string | null = null;

    acts.forEach((a, i) => {
      if (i === 0) {
        lastContactMethod = a.type;
        lastActivityAt = a.created_at;
      }
      switch (a.type) {
        case "call": score += 5; totalCalls++; break;
        case "email": score += 5; totalEmails++; break;
        case "whatsapp": score += 10; totalWhatsapp++; break;
        case "meeting": score += 25; break;
        case "note": score += 2; break;
        case "status_change": score += 3; break;
      }
    });

    // Get lead's current data
    const { data: lead } = await supabase
      .from("leads")
      .select("stage, proposal_sent, next_follow_up_at, created_at")
      .eq("id", leadId)
      .single();

    if (!lead) return;

    const l = lead as any;
    const proposalSent = l.proposal_sent || l.stage === "proposal_requested";

    if (proposalSent) score += 20;
    if (l.stage === "meeting_booked") score += 15;
    if (l.stage === "negotiation") score += 10;
    if (l.stage === "conversion_requested") score += 15;

    // Decay for inactivity
    if (lastActivityAt) {
      const daysSince = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 30) score -= 20;
      else if (daysSince > 14) score -= 10;
      else if (daysSince > 7) score -= 5;
    } else {
      // No activity at all
      const daysSinceCreated = Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated > 14) score -= 15;
    }

    // Clamp
    score = Math.max(0, Math.min(100, score));
    const temperature = calculateTemperature(score);
    const prediction = calculatePrediction(score, proposalSent, !!l.next_follow_up_at);
    const engagementScore = totalCalls + totalEmails * 2 + totalWhatsapp * 3;

    await supabase.from("leads").update({
      lead_score: score,
      lead_temperature: temperature,
      total_calls: totalCalls,
      total_emails: totalEmails,
      total_whatsapp: totalWhatsapp,
      last_contact_method: lastContactMethod,
      last_activity_at: lastActivityAt,
      engagement_score: engagementScore,
      ai_prediction: prediction,
      proposal_sent: proposalSent,
    } as any).eq("id", leadId);

    // Also upsert into lead_scores table
    await supabase.from("lead_scores").upsert({
      business_id: profile.business_id,
      lead_id: leadId,
      score,
      tier: temperature,
      reasons_json: {
        total_calls: totalCalls,
        total_emails: totalEmails,
        total_whatsapp: totalWhatsapp,
        proposal_sent: proposalSent,
        stage: l.stage,
        engagement_score: engagementScore,
        prediction,
      },
    } as any, { onConflict: "lead_id" });
  };

  /**
   * Batch recalculate all leads for the business.
   */
  const recalculateAll = async () => {
    if (!profile?.business_id) return;

    const { data: allLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("business_id", profile.business_id)
      .eq("status", "active")
      .limit(500);

    if (!allLeads) return;

    toast.info(`Recalculating scores for ${allLeads.length} leads...`);

    for (const lead of allLeads) {
      await recalculateScore(lead.id);
    }

    toast.success("All lead scores updated");
    fetchLeads();
  };

  // Derived data
  const hotLeads = leads.filter(l => l.lead_temperature === "hot");
  const warmLeads = leads.filter(l => l.lead_temperature === "warm");
  const coldLeads = leads.filter(l => l.lead_temperature === "cold");
  const likelyToConvert = leads.filter(l => l.ai_prediction === "likely_to_convert");
  const needsFollowUp = leads.filter(l => l.ai_prediction === "needs_follow_up" && l.lead_temperature !== "cold");
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.length) : 0;

  // Leads with no activity for 14+ days
  const agingLeads = leads.filter(l => {
    const ref = l.last_activity_at || l.created_at;
    const daysSince = Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 14;
  });

  return {
    leads,
    loading,
    hotLeads,
    warmLeads,
    coldLeads,
    likelyToConvert,
    needsFollowUp,
    agingLeads,
    avgScore,
    recalculateScore,
    recalculateAll,
    refetch: fetchLeads,
  };
}
