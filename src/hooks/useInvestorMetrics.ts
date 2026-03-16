import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvestorMetrics {
  mrr: number;
  arr: number;
  activeTenants: number;
  avgRevenuePerTenant: number;
  totalLeads: number;
  totalDeals: number;
  conversionRate: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  aiTasksRun: number;
  activeCampaigns: number;
}

export function useInvestorMetrics() {
  const [metrics, setMetrics] = useState<InvestorMetrics>({
    mrr: 0, arr: 0, activeTenants: 0, avgRevenuePerTenant: 0,
    totalLeads: 0, totalDeals: 0, conversionRate: 0,
    totalInvoices: 0, paidInvoices: 0, overdueInvoices: 0,
    aiTasksRun: 0, activeCampaigns: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    const [
      businessRes, platformInvRes, leadsRes, dealsRes, invoicesRes, aiRes, seoRes,
    ] = await Promise.all([
      supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("platform_invoices").select("total, status"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id, stage"),
      supabase.from("invoices").select("id, status, total"),
      supabase.from("ai_tasks").select("id", { count: "exact", head: true }),
      supabase.from("seo_projects").select("id", { count: "exact", head: true }).eq("project_status", "active"),
    ]);

    const platformInvoices = (platformInvRes.data as any) || [];
    const paidPlatform = platformInvoices.filter((i: any) => i.status === "paid");
    const totalPlatformRevenue = paidPlatform.reduce((s: number, i: any) => s + Number(i.total || 0), 0);
    const activeTenants = businessRes.count || 1;

    const deals = (dealsRes.data as any) || [];
    const wonDeals = deals.filter((d: any) => d.stage === "won");

    const invoices = (invoicesRes.data as any) || [];

    setMetrics({
      mrr: Math.round(totalPlatformRevenue / Math.max(1, 1)),
      arr: totalPlatformRevenue * 12,
      activeTenants,
      avgRevenuePerTenant: Math.round(totalPlatformRevenue / activeTenants),
      totalLeads: leadsRes.count || 0,
      totalDeals: deals.length,
      conversionRate: deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((i: any) => i.status === "paid").length,
      overdueInvoices: invoices.filter((i: any) => i.status === "overdue").length,
      aiTasksRun: aiRes.count || 0,
      activeCampaigns: seoRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
}
