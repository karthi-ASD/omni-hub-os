import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: any;
  created_at: string;
}

interface AnalyticsSummary {
  totalLeads: number;
  totalDeals: number;
  wonDeals: number;
  conversionRate: number;
  totalInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  activeCampaigns: number;
}

export function useAnalytics() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLeads: 0, totalDeals: 0, wonDeals: 0, conversionRate: 0,
    totalInvoices: 0, paidInvoices: 0, totalRevenue: 0, activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const [eventsRes, leadsRes, dealsRes, invoicesRes, campaignsRes] = await Promise.all([
      supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id, stage, estimated_value"),
      supabase.from("invoices").select("id, status, total"),
      supabase.from("seo_campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    setEvents((eventsRes.data as any) || []);

    const deals = (dealsRes.data as any) || [];
    const wonDeals = deals.filter((d: any) => d.stage === "won");
    const invoices = (invoicesRes.data as any) || [];
    const paidInvoices = invoices.filter((i: any) => i.status === "paid");

    setSummary({
      totalLeads: leadsRes.count || 0,
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      conversionRate: deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      totalRevenue: paidInvoices.reduce((sum: number, i: any) => sum + Number(i.total || 0), 0),
      activeCampaigns: campaignsRes.count || 0,
    });

    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const trackEvent = async (event_type: string, entity_type?: string, entity_id?: string, metadata?: any) => {
    if (!profile?.business_id) return;
    await supabase.from("analytics_events").insert({
      business_id: profile.business_id,
      event_type,
      entity_type,
      entity_id,
      metadata_json: metadata || {},
    } as any);
  };

  return { events, summary, loading, trackEvent, refetch: fetchAll };
}
