import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      const result: DashboardStats = { ...stats };

      // Users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      result.totalUsers = usersCount ?? 0;

      // Businesses count (super admin)
      if (isSuperAdmin) {
        const { data: bizData } = await supabase
          .from("businesses")
          .select("id, status");
        result.totalBusinesses = bizData?.length ?? 0;
        result.activeBusinesses = bizData?.filter((b) => b.status === "active").length ?? 0;
        result.suspendedBusinesses = bizData?.filter((b) => b.status === "suspended").length ?? 0;
      }

      // Recent system events (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: eventsCount } = await supabase
        .from("system_events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      result.recentEventsCount = eventsCount ?? 0;

      // Unread notifications
      const { count: notifCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.user_id)
        .eq("is_read", false);
      result.unreadNotifications = notifCount ?? 0;

      // Upcoming calendar events
      const { count: calCount } = await supabase
        .from("calendar_events")
        .select("id", { count: "exact", head: true })
        .gte("start_datetime", new Date().toISOString());
      result.upcomingEvents = calCount ?? 0;

      // Open deals
      const { count: dealsCount } = await supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");
      result.openDeals = dealsCount ?? 0;

      // Calls today
      const { count: callsCount } = await supabase
        .from("call_logs")
        .select("id", { count: "exact", head: true })
        .gte("call_time", today.toISOString());
      result.todayCalls = callsCount ?? 0;

      setStats(result);
      setLoading(false);
    };

    fetchStats();
  }, [profile, isSuperAdmin]);

  return { stats, loading };
}
