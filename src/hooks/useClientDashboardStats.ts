import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientDashboardStats {
  totalLeads: number;
  totalDeals: number;
  openDeals: number;
  totalCustomers: number;
  todayCalls: number;
  openTickets: number;
  openInvoices: number;
  outstandingAmount: number;
  seoKeywords: number;
  upcomingEvents: number;
}

export function useClientDashboardStats() {
  const { profile, clientId } = useAuth();
  const [stats, setStats] = useState<ClientDashboardStats>({
    totalLeads: 0, totalDeals: 0, openDeals: 0, totalCustomers: 0,
    todayCalls: 0, openTickets: 0, openInvoices: 0, outstandingAmount: 0,
    seoKeywords: 0, upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profile?.business_id) return;
    const bid = profile.business_id;

    const result: ClientDashboardStats = {
      totalLeads: 0, totalDeals: 0, openDeals: 0, totalCustomers: 0,
      todayCalls: 0, openTickets: 0, openInvoices: 0, outstandingAmount: 0,
      seoKeywords: 0, upcomingEvents: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [leads, deals, clients, calls, tickets, invoices, events] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("is_deleted", false),
      supabase.from("deals").select("id, status", { count: "exact" }).eq("business_id", bid),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("call_logs").select("id", { count: "exact", head: true }).eq("business_id", bid).gte("call_time", today.toISOString()),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("business_id", bid).in("status", ["open", "in_progress"]),
      supabase.from("invoices").select("id, total_amount, status").eq("business_id", bid).in("status", ["open", "overdue"]),
      supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("business_id", bid).gte("start_datetime", new Date().toISOString()),
    ]);

    result.totalLeads = leads.count ?? 0;
    result.totalDeals = deals.count ?? 0;
    result.openDeals = deals.data?.filter(d => d.status === "open").length ?? 0;
    result.totalCustomers = clients.count ?? 0;
    result.todayCalls = calls.count ?? 0;
    result.openTickets = tickets.count ?? 0;
    result.openInvoices = invoices.data?.length ?? 0;
    result.outstandingAmount = invoices.data?.reduce((s, i) => s + Number((i as any).total_amount || 0), 0) ?? 0;
    result.upcomingEvents = events.count ?? 0;

    // SEO keywords count (via client_id if available)
    if (clientId) {
      const { count: kwCount } = await supabase
        .from("seo_keywords")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId);
      result.seoKeywords = kwCount ?? 0;
    }

    setStats(result);
    setLoading(false);
  }, [profile?.business_id, clientId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
