import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MapsStatRow {
  id: string;
  project_id: string | null;
  client_id: string | null;
  business_id: string;
  snapshot_date: string;
  views_total: number;
  views_search: number;
  views_maps: number;
  website_clicks: number;
  direction_requests: number;
  phone_calls: number;
  messages: number;
  reviews_count: number;
  average_rating: number;
  created_at: string;
}

export interface MapsSyncStatus {
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
}

export function useGoogleMapsStats(opts: { projectId?: string; clientId?: string }) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<MapsStatRow[]>([]);
  const [syncStatus, setSyncStatus] = useState<MapsSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let projectIds: string[] = [];

    if (opts.projectId) {
      projectIds = [opts.projectId];
    } else if (opts.clientId) {
      const { data } = await (supabase as any)
        .from("seo_projects")
        .select("id")
        .eq("client_id", opts.clientId)
        .eq("project_status", "active");
      projectIds = (data || []).map((p: any) => p.id);
    }

    if (projectIds.length === 0) { setLoading(false); return; }

    const { data: rows } = await (supabase as any)
      .from("google_maps_daily_stats")
      .select("*")
      .in("project_id", projectIds)
      .order("snapshot_date", { ascending: false })
      .limit(180);

    setStats((rows as MapsStatRow[]) || []);

    const { data: sync } = await (supabase as any)
      .from("analytics_sync_status")
      .select("last_sync_at, next_sync_at, sync_status, error_message")
      .in("project_id", projectIds)
      .eq("source", "google_maps")
      .order("last_sync_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSyncStatus(sync || null);
    setLoading(false);
  }, [opts.projectId, opts.clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const aggregated = useMemo(() => {
    const now = new Date();
    const thirtyAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyAgo = new Date(now.getTime() - 60 * 86400000);

    const last30 = stats.filter(s => new Date(s.snapshot_date) >= thirtyAgo);
    const prev30 = stats.filter(s => new Date(s.snapshot_date) >= sixtyAgo && new Date(s.snapshot_date) < thirtyAgo);

    const sum = (arr: MapsStatRow[], k: keyof MapsStatRow) => arr.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const avg = (arr: MapsStatRow[], k: keyof MapsStatRow) => arr.length ? sum(arr, k) / arr.length : 0;

    const totalViews = sum(last30, "views_total");
    const prevViews = sum(prev30, "views_total");
    const viewsGrowth = prevViews > 0 ? ((totalViews - prevViews) / prevViews) * 100 : 0;

    const latestRating = last30.length > 0 ? Number(last30[0].average_rating) : 0;
    const latestReviews = last30.length > 0 ? last30[0].reviews_count : 0;

    return {
      totalViews,
      viewsSearch: sum(last30, "views_search"),
      viewsMaps: sum(last30, "views_maps"),
      totalCalls: sum(last30, "phone_calls"),
      totalDirections: sum(last30, "direction_requests"),
      totalWebClicks: sum(last30, "website_clicks"),
      totalMessages: sum(last30, "messages"),
      viewsGrowth,
      latestRating,
      latestReviews,
      prevCalls: sum(prev30, "phone_calls"),
      prevDirections: sum(prev30, "direction_requests"),
      prevWebClicks: sum(prev30, "website_clicks"),
      chartData: last30.slice(0, 30).reverse().map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
        views: s.views_total,
        viewsSearch: s.views_search,
        viewsMaps: s.views_maps,
        calls: s.phone_calls,
        directions: s.direction_requests,
        webClicks: s.website_clicks,
        rating: Number(s.average_rating),
        reviews: s.reviews_count,
      })),
    };
  }, [stats]);

  return { stats, aggregated, syncStatus, loading, refetch: fetch };
}
