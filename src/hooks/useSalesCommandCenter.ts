import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STAGE_PROBABILITY: Record<string, number> = {
  new: 0.1,
  contacted: 0.2,
  meeting_booked: 0.3,
  needs_analysis: 0.4,
  proposal_requested: 0.5,
  negotiation: 0.7,
  won: 1.0,
  lost: 0,
};

export interface SalesCommandData {
  leads: any[];
  deals: any[];
  clients: any[];
  callLogs: any[];
  profiles: any[];
  loading: boolean;
}

export function useSalesCommandCenter() {
  const { profile, user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const isAdmin = isSuperAdmin || isBusinessAdmin;
  const currentUserId = user?.id;

  const [data, setData] = useState<SalesCommandData>({
    leads: [], deals: [], clients: [], callLogs: [], profiles: [], loading: true,
  });

  const fetchAll = useCallback(async () => {
    setData((p) => ({ ...p, loading: true }));

    const [leadsR, dealsR, clientsR, callsR, profilesR] = await Promise.all([
      supabase.from("leads").select("*").eq("is_deleted", false).order("created_at", { ascending: false }).limit(1000),
      supabase.from("deals").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("clients").select("id, contact_name, company_name, client_status, sales_owner_id, salesperson_owner, created_at, contract_value, service_category").order("created_at", { ascending: false }).limit(1000),
      supabase.from("call_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("user_id, full_name, email").limit(200),
    ]);

    setData({
      leads: (leadsR.data as any[]) || [],
      deals: (dealsR.data as any[]) || [],
      clients: (clientsR.data as any[]) || [],
      callLogs: (callsR.data as any[]) || [],
      profiles: (profilesR.data as any[]) || [],
      loading: false,
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter data based on role
  const scopedLeads = useMemo(() => {
    if (isAdmin) return data.leads;
    return data.leads.filter((l) => l.assigned_to_user_id === currentUserId);
  }, [data.leads, isAdmin, currentUserId]);

  const scopedDeals = useMemo(() => {
    if (isAdmin) return data.deals;
    return data.deals.filter((d) => d.owner_user_id === currentUserId);
  }, [data.deals, isAdmin, currentUserId]);

  const scopedClients = useMemo(() => {
    if (isAdmin) return data.clients;
    return data.clients.filter((c) => c.sales_owner_id === currentUserId);
  }, [data.clients, isAdmin, currentUserId]);

  const scopedCalls = useMemo(() => {
    if (isAdmin) return data.callLogs;
    return data.callLogs.filter((c) => c.user_id === currentUserId);
  }, [data.callLogs, isAdmin, currentUserId]);

  const profileMap = useMemo(() => new Map(data.profiles.map((p: any) => [p.user_id, p])), [data.profiles]);

  // --- Top KPIs ---
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const leadsThisMonth = useMemo(() => scopedLeads.filter((l) => new Date(l.created_at) >= monthStart), [scopedLeads, monthStart]);
  const leadsConverted = useMemo(() => scopedLeads.filter((l) => l.stage === "won"), [scopedLeads]);
  const leadsConvertedThisMonth = useMemo(() => leadsConverted.filter((l) => new Date(l.updated_at) >= monthStart), [leadsConverted, monthStart]);
  const conversionRate = leadsThisMonth.length > 0 ? ((leadsConvertedThisMonth.length / leadsThisMonth.length) * 100).toFixed(1) : "0";

  const dealsWonThisMonth = useMemo(() => scopedDeals.filter((d) => d.status === "won" && new Date(d.updated_at) >= monthStart), [scopedDeals, monthStart]);
  const revenueClosed = useMemo(() => dealsWonThisMonth.reduce((s, d) => s + (d.estimated_value || 0), 0), [dealsWonThisMonth]);

  const activeDeals = useMemo(() => scopedDeals.filter((d) => d.status === "open"), [scopedDeals]);
  const pipelineRevenue = useMemo(() => activeDeals.reduce((s, d) => s + (d.estimated_value || 0), 0), [activeDeals]);

  // --- Pipeline by stage ---
  const pipelineByStage = useMemo(() => {
    const stages = ["new", "contacted", "meeting_booked", "needs_analysis", "proposal_requested", "negotiation", "won", "lost"];
    const labels: Record<string, string> = {
      new: "New Lead", contacted: "Contacted", meeting_booked: "Meeting Booked",
      needs_analysis: "Needs Analysis", proposal_requested: "Proposal Sent",
      negotiation: "Negotiation", won: "Closed Won", lost: "Closed Lost",
    };
    return stages.map((stage) => {
      const stageDeals = scopedDeals.filter((d) => d.stage === stage);
      return {
        stage,
        label: labels[stage] || stage,
        deals: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + (d.estimated_value || 0), 0),
      };
    });
  }, [scopedDeals]);

  // --- Forecast ---
  const forecast = useMemo(() => {
    const calcForecast = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      return activeDeals
        .filter((d) => !d.expected_close_date || new Date(d.expected_close_date) <= cutoff)
        .reduce((s, d) => s + (d.estimated_value || 0) * (STAGE_PROBABILITY[d.stage] || 0), 0);
    };
    return { next30: calcForecast(30), next60: calcForecast(60), next90: calcForecast(90) };
  }, [activeDeals]);

  // --- Agent Performance ---
  const agentPerformance = useMemo(() => {
    if (!isAdmin) return [];
    const agentMap: Record<string, { name: string; leads: number; dealsWon: number; revenueClosed: number; calls: number; meetings: number; proposals: number }> = {};

    const ensure = (id: string) => {
      if (!agentMap[id]) {
        const p = profileMap.get(id);
        agentMap[id] = { name: p?.full_name || "Unknown", leads: 0, dealsWon: 0, revenueClosed: 0, calls: 0, meetings: 0, proposals: 0 };
      }
    };

    data.leads.filter((l) => l.assigned_to_user_id).forEach((l) => {
      ensure(l.assigned_to_user_id);
      agentMap[l.assigned_to_user_id].leads++;
    });

    data.deals.forEach((d) => {
      if (!d.owner_user_id) return;
      ensure(d.owner_user_id);
      if (d.status === "won") {
        agentMap[d.owner_user_id].dealsWon++;
        agentMap[d.owner_user_id].revenueClosed += d.estimated_value || 0;
      }
      if (d.stage === "meeting_booked") agentMap[d.owner_user_id].meetings++;
      if (d.stage === "proposal_requested") agentMap[d.owner_user_id].proposals++;
    });

    data.callLogs.forEach((c) => {
      if (!c.user_id) return;
      ensure(c.user_id);
      agentMap[c.user_id].calls++;
    });

    return Object.entries(agentMap).map(([id, a]) => ({
      agentId: id,
      ...a,
      conversionRate: a.leads > 0 ? ((a.dealsWon / a.leads) * 100).toFixed(0) : "0",
    })).sort((a, b) => b.revenueClosed - a.revenueClosed);
  }, [data.leads, data.deals, data.callLogs, profileMap, isAdmin]);

  // --- Lead source breakdown ---
  const leadSourceBreakdown = useMemo(() => {
    const map: Record<string, { leads: number; conversions: number; revenue: number }> = {};
    scopedLeads.forEach((l) => {
      const src = l.source || "other";
      if (!map[src]) map[src] = { leads: 0, conversions: 0, revenue: 0 };
      map[src].leads++;
      if (l.stage === "won") {
        map[src].conversions++;
        map[src].revenue += l.estimated_budget || 0;
      }
    });
    return Object.entries(map).map(([source, d]) => ({ source, ...d })).sort((a, b) => b.leads - a.leads);
  }, [scopedLeads]);

  // --- Service sales breakdown ---
  const serviceSalesBreakdown = useMemo(() => {
    const map: Record<string, { deals: number; revenue: number; pipeline: number }> = {};
    scopedDeals.forEach((d) => {
      const svc = d.service_interest || "Other";
      if (!map[svc]) map[svc] = { deals: 0, revenue: 0, pipeline: 0 };
      map[svc].deals++;
      if (d.status === "won") map[svc].revenue += d.estimated_value || 0;
      if (d.status === "open") map[svc].pipeline += (d.estimated_value || 0) * (STAGE_PROBABILITY[d.stage] || 0);
    });
    return Object.entries(map).map(([service, d]) => ({ service, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [scopedDeals]);

  // --- Top deals ---
  const topDeals = useMemo(() => {
    return activeDeals
      .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        client: d.contact_name,
        business: d.business_name,
        service: d.service_interest || "—",
        value: d.estimated_value || 0,
        stage: d.stage,
        expectedClose: d.expected_close_date,
      }));
  }, [activeDeals]);

  // --- Lead response time ---
  const avgResponseTime = useMemo(() => {
    if (!isAdmin) return [];
    const agentTimes: Record<string, { name: string; totalMs: number; count: number }> = {};
    data.leads.filter((l) => l.assigned_to_user_id && l.last_contacted_at).forEach((l) => {
      const id = l.assigned_to_user_id;
      const created = new Date(l.created_at).getTime();
      const contacted = new Date(l.last_contacted_at).getTime();
      const diff = contacted - created;
      if (diff < 0 || diff > 7 * 24 * 60 * 60 * 1000) return; // skip anomalies
      if (!agentTimes[id]) {
        const p = profileMap.get(id);
        agentTimes[id] = { name: p?.full_name || "Unknown", totalMs: 0, count: 0 };
      }
      agentTimes[id].totalMs += diff;
      agentTimes[id].count++;
    });
    return Object.entries(agentTimes).map(([id, d]) => ({
      agentId: id,
      name: d.name,
      avgMinutes: d.count > 0 ? Math.round(d.totalMs / d.count / 60000) : 0,
    })).sort((a, b) => a.avgMinutes - b.avgMinutes);
  }, [data.leads, profileMap, isAdmin]);

  return {
    loading: data.loading,
    isAdmin,
    // KPIs
    leadsThisMonth: leadsThisMonth.length,
    leadsConvertedThisMonth: leadsConvertedThisMonth.length,
    conversionRate,
    revenueClosed,
    pipelineRevenue,
    // Pipeline
    pipelineByStage,
    // Forecast
    forecast,
    // Agent
    agentPerformance,
    // Sources
    leadSourceBreakdown,
    // Services
    serviceSalesBreakdown,
    // Top deals
    topDeals,
    // Response time
    avgResponseTime,
    // Raw
    activeDeals,
    scopedLeads,
    scopedDeals,
    scopedClients,
    refetch: fetchAll,
  };
}
