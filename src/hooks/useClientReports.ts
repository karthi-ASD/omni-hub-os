import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthlyReport {
  id: string;
  report_month: string;
  generated_at: string;
  report_data_json: any;
  report_pdf_url: string | null;
  seo_project_id: string;
  client_id: string | null;
}

export interface SeoReport {
  id: string;
  report_month: string;
  is_published: boolean;
  published_at: string | null;
  summary_json: any;
  campaign_id: string;
}

export interface DailyMetric {
  id: string;
  date: string;
  sessions: number | null;
  users_count: number | null;
  leads_count: number | null;
  gsc_clicks: number | null;
  gsc_impressions: number | null;
  gsc_avg_position: number | null;
  gsc_ctr: number | null;
  gbp_calls: number | null;
  gbp_direction_requests: number | null;
  gbp_website_clicks: number | null;
  ads_clicks: number | null;
  ads_impressions: number | null;
  ads_spend: number | null;
  calls_count: number | null;
}

export interface KeywordData {
  id: string;
  keyword: string;
  keyword_type: string | null;
  current_ranking: number | null;
  previous_ranking: number | null;
  location: string | null;
  priority: string | null;
  status: string | null;
}

export function useClientReports() {
  const { profile } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [seoReports, setSeoReports] = useState<SeoReport[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = profile?.business_id;

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    const [monthlyRes, seoRes, metricsRes, kwRes] = await Promise.all([
      supabase
        .from("seo_monthly_reports")
        .select("id, report_month, generated_at, report_data_json, report_pdf_url, seo_project_id, client_id")
        .eq("business_id", businessId)
        .order("report_month", { ascending: false })
        .limit(50),
      supabase
        .from("seo_reports")
        .select("id, report_month, is_published, published_at, summary_json, campaign_id")
        .eq("business_id", businessId)
        .order("report_month", { ascending: false })
        .limit(50),
      supabase
        .from("analytics_daily_metrics")
        .select("id, date, sessions, users_count, leads_count, gsc_clicks, gsc_impressions, gsc_avg_position, gsc_ctr, gbp_calls, gbp_direction_requests, gbp_website_clicks, ads_clicks, ads_impressions, ads_spend, calls_count")
        .eq("business_id", businessId)
        .order("date", { ascending: true })
        .limit(365),
      supabase
        .from("seo_keywords")
        .select("id, keyword, keyword_type, current_ranking, previous_ranking, location, priority, status")
        .eq("business_id", businessId)
        .order("current_ranking", { ascending: true })
        .limit(200),
    ]);

    setMonthlyReports((monthlyRes.data ?? []) as MonthlyReport[]);
    setSeoReports((seoRes.data ?? []) as SeoReport[]);
    setDailyMetrics((metricsRes.data ?? []) as DailyMetric[]);
    setKeywords((kwRes.data ?? []) as KeywordData[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { monthlyReports, seoReports, dailyMetrics, keywords, loading, refresh: fetchAll };
}
