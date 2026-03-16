import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isToday, isPast, parseISO, differenceInDays } from "date-fns";
import { useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export function useSalesPerformanceDashboard() {
  const { profile, user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const isAdmin = isSuperAdmin || isBusinessAdmin;
  const userId = user?.id;
  const businessId = profile?.business_id;

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [coldCalls, setColdCalls] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    const [leadsR, dealsR, clientsR, proposalsR, callLogsR, coldCallsR, invoicesR, profilesR] = await Promise.all([
      supabase.from("leads").select("*").eq("business_id", businessId).eq("is_deleted", false).limit(1000),
      supabase.from("deals").select("*").eq("business_id", businessId).limit(1000),
      supabase.from("clients").select("id, contact_name, company_name, client_status, sales_owner_id, salesperson_owner, created_at, contract_value, service_category").eq("business_id", businessId).limit(1000),
      supabase.from("deal_room_proposals").select("*").eq("business_id", businessId).limit(500),
      supabase.from("call_logs").select("*").eq("business_id", businessId).limit(500),
      supabase.from("cold_calls").select("*").eq("business_id", businessId).limit(500),
      supabase.from("xero_invoices").select("client_id, total, amount_due, status").eq("business_id", businessId).limit(1000),
      supabase.from("profiles").select("user_id, full_name, email").limit(200),
    ]);

    setLeads((leadsR.data as any[]) || []);
    setDeals((dealsR.data as any[]) || []);
    setClients((clientsR.data as any[]) || []);
    setProposals((proposalsR.data as any[]) || []);
    setCallLogs((callLogsR.data as any[]) || []);
    setColdCalls((coldCallsR.data as any[]) || []);
    setInvoices((invoicesR.data as any[]) || []);
    setProfiles((profilesR.data as any[]) || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Scope data by user role
  const myLeads = useMemo(() => isAdmin ? leads : leads.filter(l => l.assigned_to_user_id === userId), [leads, isAdmin, userId]);
  const myDeals = useMemo(() => isAdmin ? deals : deals.filter(d => d.owner_user_id === userId), [deals, isAdmin, userId]);
  const myClients = useMemo(() => isAdmin ? clients : clients.filter(c => c.sales_owner_id === userId), [clients, isAdmin, userId]);
  const myProposals = useMemo(() => isAdmin ? proposals : proposals.filter(p => p.uploaded_by_user_id === userId), [proposals, isAdmin, userId]);
  const myColdCalls = useMemo(() => isAdmin ? coldCalls : coldCalls.filter(c => c.user_id === userId), [coldCalls, isAdmin, userId]);
  const myCallLogs = useMemo(() => isAdmin ? callLogs : callLogs.filter(c => c.user_id === userId), [callLogs, isAdmin, userId]);

  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, p])), [profiles]);

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const monthStart = startOfMonth(now);

  // Client metrics
  const clientMetrics = useMemo(() => ({
    active: myClients.filter(c => c.client_status === "active").length,
    cancelled: myClients.filter(c => c.client_status === "cancelled").length,
    pending: myClients.filter(c => ["pending", "prospect"].includes(c.client_status)).length,
    total: myClients.length,
  }), [myClients]);

  // Lead temperature metrics
  const leadMetrics = useMemo(() => ({
    total: myLeads.length,
    hot: myLeads.filter(l => l.lead_temperature === "hot").length,
    warm: myLeads.filter(l => l.lead_temperature === "warm").length,
    cold: myLeads.filter(l => !l.lead_temperature || l.lead_temperature === "cold").length,
    newThisMonth: myLeads.filter(l => new Date(l.created_at) >= monthStart).length,
  }), [myLeads, monthStart]);

  // Pipeline funnel
  const pipelineStages = useMemo(() => {
    const stages = ["new", "contacted", "meeting_booked", "needs_analysis", "proposal_requested", "negotiation", "won", "lost"];
    const labels: Record<string, string> = {
      new: "New Lead", contacted: "Contacted", meeting_booked: "Meeting Booked",
      needs_analysis: "Needs Analysis", proposal_requested: "Proposal Sent",
      negotiation: "Negotiation", won: "Closed Won", lost: "Closed Lost",
    };
    return stages.map(stage => {
      const stageDeals = myDeals.filter(d => d.stage === stage);
      return {
        stage, label: labels[stage] || stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + (d.estimated_value || 0), 0),
      };
    });
  }, [myDeals]);

  // Follow-up metrics
  const followUpMetrics = useMemo(() => {
    const withFollowUp = myLeads.filter(l => l.next_follow_up_at);
    const todayFu = withFollowUp.filter(l => {
      const d = l.next_follow_up_at?.substring(0, 10);
      return d === today;
    });
    const overdue = withFollowUp.filter(l => {
      const d = parseISO(l.next_follow_up_at);
      return isPast(d) && !isToday(d);
    });
    const upcoming = withFollowUp.filter(l => {
      const d = parseISO(l.next_follow_up_at);
      return !isPast(d) && !isToday(d);
    });
    return { today: todayFu.length, overdue: overdue.length, upcoming: upcoming.length };
  }, [myLeads, today]);

  // Proposal metrics
  const proposalMetrics = useMemo(() => ({
    sent: myProposals.filter(p => p.proposal_status === "sent").length,
    viewed: myProposals.filter(p => p.proposal_status === "viewed").length,
    accepted: myProposals.filter(p => p.proposal_status === "accepted").length,
    pending: myProposals.filter(p => ["draft", "sent"].includes(p.proposal_status)).length,
    expired: myProposals.filter(p => p.proposal_status === "expired").length,
    total: myProposals.length,
  }), [myProposals]);

  // Revenue metrics
  const revenueMetrics = useMemo(() => {
    const wonDeals = myDeals.filter(d => d.status === "won");
    const wonThisMonth = wonDeals.filter(d => new Date(d.updated_at) >= monthStart);
    const totalRevenue = wonDeals.reduce((s, d) => s + (d.estimated_value || 0), 0);
    const monthRevenue = wonThisMonth.reduce((s, d) => s + (d.estimated_value || 0), 0);
    const avgDeal = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
    return { totalRevenue, monthRevenue, avgDeal, dealsWon: wonDeals.length };
  }, [myDeals, monthStart]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    const total = myLeads.length;
    const won = myDeals.filter(d => d.status === "won").length;
    return total > 0 ? ((won / total) * 100).toFixed(1) : "0";
  }, [myLeads, myDeals]);

  // Hot leads priority list
  const hotLeadsPriority = useMemo(() => {
    return myLeads
      .filter(l => l.status === "active")
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
      .slice(0, 10)
      .map(l => ({
        id: l.id, name: l.name, score: l.lead_score || 0,
        temperature: l.lead_temperature || "cold",
        lastContact: l.last_contacted_at,
        nextFollowUp: l.next_follow_up_at,
        prediction: l.ai_prediction,
      }));
  }, [myLeads]);

  // Daily activity
  const dailyActivity = useMemo(() => {
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    const todayCalls = myColdCalls.filter(c => c.created_at >= todayStart && c.created_at <= todayEnd).length;
    const todayEmails = myLeads.filter(l => l.total_emails && l.last_activity_at && l.last_activity_at >= todayStart).length;
    const todayWhatsapp = myLeads.filter(l => l.total_whatsapp && l.last_activity_at && l.last_activity_at >= todayStart).length;
    return { calls: todayCalls, emails: todayEmails, whatsapp: todayWhatsapp };
  }, [myColdCalls, myLeads, now]);

  // Sales leaderboard (admin only)
  const leaderboard = useMemo(() => {
    if (!isAdmin) return [];
    const map: Record<string, { name: string; revenue: number; dealsWon: number; leads: number }> = {};
    deals.filter(d => d.owner_user_id && d.status === "won").forEach(d => {
      const id = d.owner_user_id;
      if (!map[id]) {
        const p = profileMap.get(id);
        map[id] = { name: p?.full_name || "Unknown", revenue: 0, dealsWon: 0, leads: 0 };
      }
      map[id].revenue += d.estimated_value || 0;
      map[id].dealsWon++;
    });
    leads.filter(l => l.assigned_to_user_id).forEach(l => {
      const id = l.assigned_to_user_id;
      if (!map[id]) {
        const p = profileMap.get(id);
        map[id] = { name: p?.full_name || "Unknown", revenue: 0, dealsWon: 0, leads: 0 };
      }
      map[id].leads++;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [deals, leads, profileMap, isAdmin]);

  // My accounts table
  const myAccountsTable = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    invoices.forEach(inv => {
      if (!inv.client_id) return;
      revenueMap[inv.client_id] = (revenueMap[inv.client_id] || 0) + (Number(inv.total) || 0);
    });
    return myClients.map(c => ({
      id: c.id, name: c.contact_name, company: c.company_name,
      status: c.client_status, service: c.service_category || "—",
      monthlyValue: c.contract_value || 0,
      revenue: revenueMap[c.id] || 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [myClients, invoices]);

  // Aging cold leads (14+ days no activity)
  const agingLeads = useMemo(() => {
    return myLeads.filter(l => {
      const lastAct = l.last_activity_at || l.created_at;
      return differenceInDays(now, new Date(lastAct)) >= 14;
    }).length;
  }, [myLeads, now]);

  return {
    loading, isAdmin, refetch: fetchAll,
    clientMetrics, leadMetrics, pipelineStages,
    followUpMetrics, proposalMetrics, revenueMetrics,
    conversionRate, hotLeadsPriority, dailyActivity,
    leaderboard, myAccountsTable, agingLeads,
  };
}
