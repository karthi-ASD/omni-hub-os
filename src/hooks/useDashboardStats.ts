import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesDataAutoRefresh } from "@/lib/salesDataSync";

interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  recentEventsCount: number;
  unreadNotifications: number;
  upcomingEvents: number;
  openDeals: number;
  todayCalls: number;
  openInvoices: number;
  revenueThisMonth: number;
  totalLeads: number;
}

export function useDashboardStats() {
  const { isSuperAdmin, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    activeBusinesses: 0,
    suspendedBusinesses: 0,
    recentEventsCount: 0,
    unreadNotifications: 0,
    upcomingEvents: 0,
    openDeals: 0,
    todayCalls: 0,
    openInvoices: 0,
    revenueThisMonth: 0,
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!profile) return;

    const result: DashboardStats = {
      totalUsers: 0,
      totalBusinesses: 0,
      activeBusinesses: 0,
      suspendedBusinesses: 0,
      recentEventsCount: 0,
      unreadNotifications: 0,
      upcomingEvents: 0,
      openDeals: 0,
      todayCalls: 0,
      openInvoices: 0,
      revenueThisMonth: 0,
      totalLeads: 0,
    };

    const { count: usersCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    result.totalUsers = usersCount ?? 0;

    const { count: leadsCount } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false);
    result.totalLeads = leadsCount ?? 0;

    if (isSuperAdmin) {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("id, status");
      result.totalBusinesses = bizData?.length ?? 0;
      result.activeBusinesses = bizData?.filter((b) => b.status === "active").length ?? 0;
      result.suspendedBusinesses = bizData?.filter((b) => b.status === "suspended").length ?? 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: eventsCount } = await supabase
      .from("system_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString());
    result.recentEventsCount = eventsCount ?? 0;

    const { count: notifCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.user_id)
      .eq("is_read", false);
    result.unreadNotifications = notifCount ?? 0;

    const { count: calCount } = await supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .gte("start_datetime", new Date().toISOString());
    result.upcomingEvents = calCount ?? 0;

    const { count: dealsCount } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    result.openDeals = dealsCount ?? 0;

    const { count: callsCount } = await supabase
      .from("call_logs")
      .select("id", { count: "exact", head: true })
      .gte("call_time", today.toISOString());
    result.todayCalls = callsCount ?? 0;

    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "overdue"]);
    result.openInvoices = invoiceCount ?? 0;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: paidPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "approved")
      .gte("paid_at", monthStart);
    result.revenueThisMonth = paidPayments?.reduce((s, p) => s + Number((p as any).amount), 0) || 0;

    setStats(result);
    setLoading(false);
  }, [profile, isSuperAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useSalesDataAutoRefresh(fetchStats, ["all", "dashboard", "leads", "clients", "deals", "proposals", "follow-ups"]);

  return { stats, loading };
}
