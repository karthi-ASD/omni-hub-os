import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GADailyStat {
  id: string;
  project_id: string | null;
  client_id: string | null;
  business_id: string;
  snapshot_date: string;
  users_count: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number;
  avg_session_duration: number;
  organic_traffic: number;
  direct_traffic: number;
  paid_traffic: number;
  referral_traffic: number;
  conversions: number;
  top_pages_json: any;
  created_at: string;
}

export interface GAInsight {
  icon: "up" | "down" | "neutral";
  message: string;
  color: "green" | "red" | "blue";
}

export function useGoogleAnalyticsStats(projectId?: string, clientId?: string) {
  const [stats, setStats] = useState<GADailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!projectId && !clientId) {
      setLoading(false);
      setStats([]);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from("google_analytics_daily_stats" as any)
        .select("*")
        .order("snapshot_date", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) console.error("GA stats fetch error:", error);
      setStats((data as any[]) ?? []);
    } catch (err) {
      console.error("GA stats error:", err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, clientId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Computed aggregates
  const aggregates = useMemo(() => {
    if (stats.length === 0) return null;

    const latest = stats[stats.length - 1];
    const totalUsers = stats.reduce((s, r) => s + (r.users_count || 0), 0);
    const totalSessions = stats.reduce((s, r) => s + (r.sessions || 0), 0);
    const totalPageviews = stats.reduce((s, r) => s + (r.pageviews || 0), 0);
    const totalConversions = stats.reduce((s, r) => s + (r.conversions || 0), 0);
    const avgBounce = stats.length > 0
      ? stats.reduce((s, r) => s + (r.bounce_rate || 0), 0) / stats.length
      : 0;
    const avgDuration = stats.length > 0
      ? stats.reduce((s, r) => s + (r.avg_session_duration || 0), 0) / stats.length
      : 0;

    // Traffic source totals
    const organicTotal = stats.reduce((s, r) => s + (r.organic_traffic || 0), 0);
    const directTotal = stats.reduce((s, r) => s + (r.direct_traffic || 0), 0);
    const paidTotal = stats.reduce((s, r) => s + (r.paid_traffic || 0), 0);
    const referralTotal = stats.reduce((s, r) => s + (r.referral_traffic || 0), 0);

    // Growth calculation (compare last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

    const recent = stats.filter((s) => new Date(s.snapshot_date) >= thirtyDaysAgo);
    const previous = stats.filter(
      (s) => new Date(s.snapshot_date) >= sixtyDaysAgo && new Date(s.snapshot_date) < thirtyDaysAgo
    );

    const recentUsers = recent.reduce((s, r) => s + (r.users_count || 0), 0);
    const previousUsers = previous.reduce((s, r) => s + (r.users_count || 0), 0);
    const growthPct = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;

    const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;

    return {
      totalUsers,
      totalSessions,
      totalPageviews,
      totalConversions,
      avgBounce: Math.round(avgBounce * 100) / 100,
      avgDuration: Math.round(avgDuration),
      organicTotal,
      directTotal,
      paidTotal,
      referralTotal,
      growthPct: Math.round(growthPct * 10) / 10,
      conversionRate: Math.round(conversionRate * 100) / 100,
      latest,
      recentUsers,
    };
  }, [stats]);

  // AI-style insights
  const insights = useMemo((): GAInsight[] => {
    if (!aggregates || stats.length < 2) return [];
    const result: GAInsight[] = [];

    if (aggregates.growthPct > 0) {
      result.push({
        icon: "up", color: "green",
        message: `Traffic increased ${aggregates.growthPct}% compared to the previous period`,
      });
    } else if (aggregates.growthPct < 0) {
      result.push({
        icon: "down", color: "red",
        message: `Traffic decreased ${Math.abs(aggregates.growthPct)}% compared to the previous period`,
      });
    }

    const sources = [
      { name: "Organic search", val: aggregates.organicTotal },
      { name: "Direct", val: aggregates.directTotal },
      { name: "Paid", val: aggregates.paidTotal },
      { name: "Referral", val: aggregates.referralTotal },
    ].sort((a, b) => b.val - a.val);

    if (sources[0].val > 0) {
      result.push({
        icon: "up", color: "blue",
        message: `${sources[0].name} is your top traffic source`,
      });
    }

    if (aggregates.avgDuration > 120) {
      result.push({
        icon: "up", color: "green",
        message: "Users are spending quality time on your site (avg " + Math.round(aggregates.avgDuration / 60) + " min)",
      });
    }

    if (aggregates.avgBounce < 50) {
      result.push({
        icon: "up", color: "green",
        message: "Bounce rate is healthy at " + aggregates.avgBounce + "%",
      });
    } else if (aggregates.avgBounce > 70) {
      result.push({
        icon: "down", color: "red",
        message: "Bounce rate is high at " + aggregates.avgBounce + "% — consider improving engagement",
      });
    }

    return result;
  }, [aggregates, stats]);

  // Chart data for traffic trend
  const trendData = useMemo(() => {
    return stats.map((s) => ({
      date: new Date(s.snapshot_date).toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
      users: s.users_count,
      sessions: s.sessions,
      pageviews: s.pageviews,
    }));
  }, [stats]);

  // Pie chart data
  const sourceData = useMemo(() => {
    if (!aggregates) return [];
    return [
      { name: "Organic", value: aggregates.organicTotal, fill: "hsl(var(--chart-1))" },
      { name: "Direct", value: aggregates.directTotal, fill: "hsl(var(--chart-2))" },
      { name: "Paid", value: aggregates.paidTotal, fill: "hsl(var(--chart-3))" },
      { name: "Referral", value: aggregates.referralTotal, fill: "hsl(var(--chart-4))" },
    ].filter((d) => d.value > 0);
  }, [aggregates]);

  return {
    stats,
    loading,
    aggregates,
    insights,
    trendData,
    sourceData,
    refetch: fetchStats,
  };
}
