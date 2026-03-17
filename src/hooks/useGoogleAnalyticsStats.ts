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

export interface SyncStatus {
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
}

/**
 * Fetches GA stats.
 * For client users: resolves linked seo_project(s) via client_id, then reads stats by project_id.
 * For staff: reads directly by projectId.
 */
export function useGoogleAnalyticsStats(projectId?: string, clientId?: string) {
  const [stats, setStats] = useState<GADailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId && !clientId) {
      setLoading(false);
      setStats([]);
      return;
    }
    setLoading(true);
    try {
      let resolvedProjectId = projectId;

      // Client path: resolve project_id from seo_projects via client_id
      if (!resolvedProjectId && clientId) {
        const { data: proj } = await supabase
          .from("seo_projects")
          .select("id")
          .eq("client_id", clientId)
          .in("project_status", ["active", "ACTIVE", "Active"])
          .limit(1)
          .maybeSingle();
        resolvedProjectId = proj?.id || undefined;
      }

      // Fetch stats by project_id (primary) or fallback to client_id
      let query = supabase
        .from("google_analytics_daily_stats" as any)
        .select("*")
        .order("snapshot_date", { ascending: true });

      if (resolvedProjectId) {
        query = query.eq("project_id", resolvedProjectId);
      } else if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) console.error("GA stats fetch error:", error);
      setStats((data as any[]) ?? []);

      // Fetch sync status
      const syncQuery = supabase
        .from("analytics_sync_status" as any)
        .select("last_sync_at, next_sync_at, sync_status, error_message");

      if (resolvedProjectId) {
        syncQuery.eq("project_id", resolvedProjectId);
      } else if (clientId) {
        syncQuery.eq("client_id", clientId);
      }

      const { data: syncData } = await syncQuery.limit(1).maybeSingle();
      setSyncStatus(syncData as SyncStatus | null);
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

  /**
   * AGGREGATION LOGIC (corrected):
   * - "Latest" KPIs come from the most recent snapshot
   * - Period totals are sums within specified date ranges
   * - Growth % compares last 30 days vs previous 30 days
   * - Averages (bounce rate, session duration) use mean over snapshots
   */
  const aggregates = useMemo(() => {
    if (stats.length === 0) return null;

    const latest = stats[stats.length - 1];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    // Period-based filtering
    const last7 = stats.filter(s => new Date(s.snapshot_date) >= sevenDaysAgo);
    const last30 = stats.filter(s => new Date(s.snapshot_date) >= thirtyDaysAgo);
    const prev30 = stats.filter(
      s => new Date(s.snapshot_date) >= sixtyDaysAgo && new Date(s.snapshot_date) < thirtyDaysAgo
    );
    const last90 = stats.filter(s => new Date(s.snapshot_date) >= ninetyDaysAgo);

    // Sum helpers for a period
    const sumField = (arr: GADailyStat[], field: keyof GADailyStat) =>
      arr.reduce((s, r) => s + (Number(r[field]) || 0), 0);

    const avgField = (arr: GADailyStat[], field: keyof GADailyStat) =>
      arr.length > 0 ? arr.reduce((s, r) => s + (Number(r[field]) || 0), 0) / arr.length : 0;

    // Last 30 day totals (primary display)
    const periodUsers = sumField(last30, "users_count");
    const periodSessions = sumField(last30, "sessions");
    const periodPageviews = sumField(last30, "pageviews");
    const periodConversions = sumField(last30, "conversions");

    // Previous 30 day totals (for growth comparison)
    const prevUsers = sumField(prev30, "users_count");

    // Growth percentage
    const growthPct = prevUsers > 0
      ? Math.round(((periodUsers - prevUsers) / prevUsers) * 1000) / 10
      : 0;

    // Averages from last 30 days
    const avgBounce = Math.round(avgField(last30, "bounce_rate") * 100) / 100;
    const avgDuration = Math.round(avgField(last30, "avg_session_duration"));

    // Conversion rate over period
    const conversionRate = periodSessions > 0
      ? Math.round((periodConversions / periodSessions) * 10000) / 100
      : 0;

    // Traffic source totals (last 30 days)
    const organicTotal = sumField(last30, "organic_traffic");
    const directTotal = sumField(last30, "direct_traffic");
    const paidTotal = sumField(last30, "paid_traffic");
    const referralTotal = sumField(last30, "referral_traffic");

    return {
      // Latest snapshot values
      latest,
      // Period totals (last 30 days by default)
      totalUsers: periodUsers,
      totalSessions: periodSessions,
      totalPageviews: periodPageviews,
      totalConversions: periodConversions,
      // Averages
      avgBounce,
      avgDuration,
      // Rates
      conversionRate,
      growthPct,
      // Traffic sources
      organicTotal,
      directTotal,
      paidTotal,
      referralTotal,
      // Period-specific data for charts
      last7,
      last30,
      last90,
      recentUsers: periodUsers,
    };
  }, [stats]);

  // AI-style insights (based on last 30 days)
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
        message: `${sources[0].name} is your strongest traffic channel`,
      });
    }

    if (aggregates.avgDuration > 120) {
      result.push({
        icon: "up", color: "green",
        message: `Visitors are spending quality time on your site (avg ${Math.round(aggregates.avgDuration / 60)} min)`,
      });
    }

    if (aggregates.avgBounce < 50) {
      result.push({
        icon: "up", color: "green",
        message: `Bounce rate is healthy at ${aggregates.avgBounce}% — users are engaging well`,
      });
    } else if (aggregates.avgBounce > 70) {
      result.push({
        icon: "down", color: "red",
        message: `Bounce rate is high at ${aggregates.avgBounce}% — consider improving engagement`,
      });
    }

    if (aggregates.totalConversions > 0) {
      result.push({
        icon: "up", color: "green",
        message: `Your site is converting at ${aggregates.conversionRate}% — conversions are being tracked`,
      });
    }

    if (aggregates.totalPageviews > aggregates.totalSessions * 2) {
      result.push({
        icon: "up", color: "blue",
        message: "Your top pages are attracting steady engagement with multiple pageviews per session",
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

  // Pie chart data (last 30 days)
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
    syncStatus,
    refetch: fetchStats,
  };
}
