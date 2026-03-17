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
 * Fetches GA stats with multi-project support.
 * - For staff: reads by projectId
 * - For client: resolves ALL active seo_projects for client, aggregates across them
 */
export function useGoogleAnalyticsStats(projectId?: string, clientId?: string) {
  const [stats, setStats] = useState<GADailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [projectCount, setProjectCount] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!projectId && !clientId) {
      setLoading(false);
      setStats([]);
      return;
    }
    setLoading(true);
    try {
      let resolvedProjectIds: string[] = [];

      if (projectId) {
        resolvedProjectIds = [projectId];
      } else if (clientId) {
        // Multi-project: fetch ALL active projects for this client
        const { data: projects } = await supabase
          .from("seo_projects")
          .select("id")
          .eq("client_id", clientId)
          .in("project_status", ["active", "ACTIVE", "Active"]);
        resolvedProjectIds = (projects || []).map((p: any) => p.id);
      }

      setProjectCount(resolvedProjectIds.length);

      if (resolvedProjectIds.length === 0) {
        setStats([]);
        setLoading(false);
        return;
      }

      // Fetch stats for all projects
      const { data, error } = await supabase
        .from("google_analytics_daily_stats" as any)
        .select("*")
        .in("project_id", resolvedProjectIds)
        .order("snapshot_date", { ascending: true });

      if (error) console.error("GA stats fetch error:", error);

      // Aggregate by snapshot_date across multiple projects
      const rawStats = (data as any[]) ?? [];
      const aggregated = aggregateByDate(rawStats);
      setStats(aggregated);

      // Fetch sync status for the first project (representative)
      const { data: syncData } = await supabase
        .from("analytics_sync_status" as any)
        .select("last_sync_at, next_sync_at, sync_status, error_message")
        .in("project_id", resolvedProjectIds)
        .order("last_sync_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSyncStatus((syncData as unknown as SyncStatus) || null);
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
   * AGGREGATION LOGIC:
   * - Latest KPIs from most recent snapshot
   * - Period totals: sums within 7/30/90 day ranges
   * - Growth %: last 30 vs previous 30
   * - Averages for bounce rate, session duration
   */
  const aggregates = useMemo(() => {
    if (stats.length === 0) return null;

    const latest = stats[stats.length - 1];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const last7 = stats.filter(s => new Date(s.snapshot_date) >= sevenDaysAgo);
    const last30 = stats.filter(s => new Date(s.snapshot_date) >= thirtyDaysAgo);
    const prev30 = stats.filter(
      s => new Date(s.snapshot_date) >= sixtyDaysAgo && new Date(s.snapshot_date) < thirtyDaysAgo
    );
    const last90 = stats.filter(s => new Date(s.snapshot_date) >= ninetyDaysAgo);

    const sumField = (arr: GADailyStat[], field: keyof GADailyStat) =>
      arr.reduce((s, r) => s + (Number(r[field]) || 0), 0);
    const avgField = (arr: GADailyStat[], field: keyof GADailyStat) =>
      arr.length > 0 ? arr.reduce((s, r) => s + (Number(r[field]) || 0), 0) / arr.length : 0;

    const periodUsers = sumField(last30, "users_count");
    const periodSessions = sumField(last30, "sessions");
    const periodPageviews = sumField(last30, "pageviews");
    const periodConversions = sumField(last30, "conversions");
    const prevUsers = sumField(prev30, "users_count");
    const prevSessions = sumField(prev30, "sessions");
    const prevConversions = sumField(prev30, "conversions");

    const growthPct = prevUsers > 0
      ? Math.round(((periodUsers - prevUsers) / prevUsers) * 1000) / 10
      : 0;

    const avgBounce = Math.round(avgField(last30, "bounce_rate") * 100) / 100;
    const avgDuration = Math.round(avgField(last30, "avg_session_duration"));
    const conversionRate = periodSessions > 0
      ? Math.round((periodConversions / periodSessions) * 10000) / 100
      : 0;

    const organicTotal = sumField(last30, "organic_traffic");
    const directTotal = sumField(last30, "direct_traffic");
    const paidTotal = sumField(last30, "paid_traffic");
    const referralTotal = sumField(last30, "referral_traffic");

    // Previous period comparisons for enhanced insights
    const prevOrganic = sumField(prev30, "organic_traffic");
    const organicGrowthPct = prevOrganic > 0
      ? Math.round(((organicTotal - prevOrganic) / prevOrganic) * 1000) / 10
      : 0;
    const sessionGrowthPct = prevSessions > 0
      ? Math.round(((periodSessions - prevSessions) / prevSessions) * 1000) / 10
      : 0;
    const convGrowthPct = prevConversions > 0
      ? Math.round(((periodConversions - prevConversions) / prevConversions) * 1000) / 10
      : 0;

    return {
      latest,
      totalUsers: periodUsers,
      totalSessions: periodSessions,
      totalPageviews: periodPageviews,
      totalConversions: periodConversions,
      avgBounce,
      avgDuration,
      conversionRate,
      growthPct,
      organicTotal,
      directTotal,
      paidTotal,
      referralTotal,
      // Enhanced comparison data
      organicGrowthPct,
      sessionGrowthPct,
      convGrowthPct,
      prevUsers,
      prevSessions,
      // Period arrays
      last7,
      last30,
      last90,
      recentUsers: periodUsers,
    };
  }, [stats]);

  // Enhanced AI-style insights
  const insights = useMemo((): GAInsight[] => {
    if (!aggregates || stats.length < 2) return [];
    const result: GAInsight[] = [];

    // Traffic growth
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

    // Organic growth (enhanced)
    if (aggregates.organicGrowthPct > 0 && aggregates.organicTotal > 0) {
      result.push({
        icon: "up", color: "green",
        message: `Organic traffic increased by ${aggregates.organicGrowthPct}%`,
      });
    } else if (aggregates.organicGrowthPct < -5 && aggregates.organicTotal > 0) {
      result.push({
        icon: "down", color: "red",
        message: `Organic traffic declined by ${Math.abs(aggregates.organicGrowthPct)}% — review SEO strategy`,
      });
    }

    // Top traffic source
    const sources = [
      { name: "Organic search", val: aggregates.organicTotal },
      { name: "Direct", val: aggregates.directTotal },
      { name: "Paid", val: aggregates.paidTotal },
      { name: "Referral", val: aggregates.referralTotal },
    ].sort((a, b) => b.val - a.val);
    const totalTraffic = sources.reduce((s, x) => s + x.val, 0);

    if (sources[0].val > 0 && totalTraffic > 0) {
      const pct = Math.round((sources[0].val / totalTraffic) * 100);
      result.push({
        icon: "up", color: "blue",
        message: `${sources[0].name} is your strongest channel at ${pct}% of total traffic`,
      });
    }

    // Top page contribution (enhanced)
    if (aggregates.latest?.top_pages_json && Array.isArray(aggregates.latest.top_pages_json)) {
      const topPages = aggregates.latest.top_pages_json as any[];
      if (topPages.length > 0 && aggregates.totalPageviews > 0) {
        const topPageViews = topPages[0]?.views || 0;
        const topPct = Math.round((topPageViews / aggregates.totalPageviews) * 100);
        if (topPct > 0) {
          result.push({
            icon: "up", color: "blue",
            message: `Top page contributes ${topPct}% of total traffic`,
          });
        }
      }
    }

    // Conversion trend (enhanced)
    if (aggregates.totalConversions > 0) {
      if (aggregates.convGrowthPct > 0) {
        result.push({
          icon: "up", color: "green",
          message: `Conversion trend improving — up ${aggregates.convGrowthPct}% vs previous period`,
        });
      } else if (aggregates.convGrowthPct < 0) {
        result.push({
          icon: "down", color: "red",
          message: `Conversion trend declining — down ${Math.abs(aggregates.convGrowthPct)}% vs previous period`,
        });
      } else {
        result.push({
          icon: "up", color: "green",
          message: `Conversions tracked at ${aggregates.conversionRate}% rate`,
        });
      }
    }

    // Session quality
    if (aggregates.avgDuration > 120) {
      result.push({
        icon: "up", color: "green",
        message: `Visitors spending quality time (avg ${Math.round(aggregates.avgDuration / 60)} min) — strong engagement`,
      });
    }

    // Bounce rate
    if (aggregates.avgBounce < 50 && aggregates.avgBounce > 0) {
      result.push({
        icon: "up", color: "green",
        message: `Bounce rate is healthy at ${aggregates.avgBounce}%`,
      });
    } else if (aggregates.avgBounce > 70) {
      result.push({
        icon: "down", color: "red",
        message: `Bounce rate is high at ${aggregates.avgBounce}% — consider improving engagement`,
      });
    }

    // Multi-page engagement
    if (aggregates.totalPageviews > aggregates.totalSessions * 2 && aggregates.totalSessions > 0) {
      const pagesPerSession = (aggregates.totalPageviews / aggregates.totalSessions).toFixed(1);
      result.push({
        icon: "up", color: "blue",
        message: `Users viewing ${pagesPerSession} pages per session — strong content engagement`,
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
    projectCount,
    refetch: fetchStats,
  };
}

/**
 * Aggregates stats from multiple projects by snapshot_date.
 * Sums additive metrics, averages rate-based metrics.
 */
function aggregateByDate(raw: any[]): GADailyStat[] {
  if (raw.length === 0) return [];

  const dateMap = new Map<string, GADailyStat[]>();
  for (const r of raw) {
    const date = r.snapshot_date;
    if (!dateMap.has(date)) dateMap.set(date, []);
    dateMap.get(date)!.push(r);
  }

  const result: GADailyStat[] = [];
  for (const [date, rows] of dateMap.entries()) {
    if (rows.length === 1) {
      result.push(rows[0]);
      continue;
    }
    // Aggregate across projects for same date
    const merged: GADailyStat = {
      id: rows[0].id,
      project_id: null, // multi-project
      client_id: rows[0].client_id,
      business_id: rows[0].business_id,
      snapshot_date: date,
      users_count: rows.reduce((s, r) => s + (r.users_count || 0), 0),
      sessions: rows.reduce((s, r) => s + (r.sessions || 0), 0),
      pageviews: rows.reduce((s, r) => s + (r.pageviews || 0), 0),
      bounce_rate: rows.reduce((s, r) => s + (r.bounce_rate || 0), 0) / rows.length,
      avg_session_duration: rows.reduce((s, r) => s + (r.avg_session_duration || 0), 0) / rows.length,
      organic_traffic: rows.reduce((s, r) => s + (r.organic_traffic || 0), 0),
      direct_traffic: rows.reduce((s, r) => s + (r.direct_traffic || 0), 0),
      paid_traffic: rows.reduce((s, r) => s + (r.paid_traffic || 0), 0),
      referral_traffic: rows.reduce((s, r) => s + (r.referral_traffic || 0), 0),
      conversions: rows.reduce((s, r) => s + (r.conversions || 0), 0),
      // Merge top_pages from all projects
      top_pages_json: rows
        .flatMap((r) => (Array.isArray(r.top_pages_json) ? r.top_pages_json : []))
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 10),
      created_at: rows[0].created_at,
    };
    result.push(merged);
  }

  return result.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
}
