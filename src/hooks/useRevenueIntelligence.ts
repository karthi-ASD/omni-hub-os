import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRevenueIntelligence() {
  const { profile } = useAuth();
  const bizId = profile?.business_id;

  const [ledger, setLedger] = useState<any[]>([]);
  const [attribution, setAttribution] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [costRates, setCostRates] = useState<any[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [churnSignals, setChurnSignals] = useState<any[]>([]);
  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [excludeDemo, setExcludeDemo] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bizId) return;
    setLoading(true);

    let ledgerQuery = supabase.from("revenue_ledger_entries").select("*").eq("business_id", bizId).order("invoice_date", { ascending: false }).limit(500);
    if (excludeDemo) ledgerQuery = ledgerQuery.eq("is_demo", false);

    const [ledgerR, attrR, costR, rateR, subR, foreR, cohR, churnR, alertR] = await Promise.all([
      ledgerQuery,
      supabase.from("attribution_events").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(300),
      supabase.from("cost_entries").select("*").eq("business_id", bizId).order("date", { ascending: false }).limit(300),
      supabase.from("employee_cost_rates").select("*").eq("business_id", bizId).order("effective_from", { ascending: false }),
      supabase.from("subscription_metrics_daily").select("*").eq("business_id", bizId).order("date", { ascending: true }).limit(90),
      supabase.from("forecast_snapshots").select("*").eq("business_id", bizId).order("snapshot_date", { ascending: false }).limit(30),
      supabase.from("cohort_memberships").select("*").eq("business_id", bizId).order("cohort_month", { ascending: true }).limit(500),
      supabase.from("churn_signals").select("*").eq("business_id", bizId).order("risk_score", { ascending: false }).limit(50),
      supabase.from("revenue_alert_rules").select("*").eq("business_id", bizId),
    ]);

    setLedger((ledgerR.data as any[]) ?? []);
    setAttribution((attrR.data as any[]) ?? []);
    setCosts((costR.data as any[]) ?? []);
    setCostRates((rateR.data as any[]) ?? []);
    setSubscriptionMetrics((subR.data as any[]) ?? []);
    setForecasts((foreR.data as any[]) ?? []);
    setCohorts((cohR.data as any[]) ?? []);
    setChurnSignals((churnR.data as any[]) ?? []);
    setAlertRules((alertR.data as any[]) ?? []);
    setLoading(false);
  }, [bizId, excludeDemo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createLedgerEntry = async (values: Record<string, any>) => {
    if (!bizId) return;
    await supabase.from("revenue_ledger_entries").insert({ ...values, business_id: bizId } as any);
    toast.success("Ledger entry created");
    fetchAll();
  };

  const createCostEntry = async (values: Record<string, any>) => {
    if (!bizId) return;
    await supabase.from("cost_entries").insert({ ...values, business_id: bizId } as any);
    toast.success("Cost entry recorded");
    fetchAll();
  };

  const createCostRate = async (userId: string, hourlyRate: number) => {
    if (!bizId) return;
    await supabase.from("employee_cost_rates").insert({ business_id: bizId, user_id: userId, hourly_rate: hourlyRate } as any);
    toast.success("Cost rate saved");
    fetchAll();
  };

  const createAlertRule = async (values: Record<string, any>) => {
    if (!bizId) return;
    await supabase.from("revenue_alert_rules").insert({ ...values, business_id: bizId } as any);
    toast.success("Alert rule created");
    fetchAll();
  };

  // Computed metrics
  const totalRevenue = ledger.filter(e => e.status === "PAID").reduce((s, e) => s + Number(e.amount_net || 0), 0);
  const totalCosts = costs.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grossProfit = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";
  const overdueCount = ledger.filter(e => e.status === "PENDING" && e.due_date && new Date(e.due_date) < new Date()).length;
  const latestMrr = subscriptionMetrics.length > 0 ? subscriptionMetrics[subscriptionMetrics.length - 1] : null;
  const latestForecast = forecasts.length > 0 ? forecasts[0] : null;
  const atRiskClients = churnSignals.filter(c => c.risk_score >= 60);

  // Channel breakdown from attribution
  const channelBreakdown = attribution.reduce((acc: Record<string, number>, e) => {
    const ch = e.channel || "Unknown";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});

  return {
    ledger, attribution, costs, costRates, subscriptionMetrics, forecasts,
    cohorts, churnSignals, alertRules, loading,
    excludeDemo, setExcludeDemo,
    createLedgerEntry, createCostEntry, createCostRate, createAlertRule,
    totalRevenue, totalCosts, grossProfit, marginPercent, overdueCount,
    latestMrr, latestForecast, atRiskClients, channelBreakdown,
    refresh: fetchAll,
  };
}
