import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemHealthData {
  // Platform overview
  totalBusinesses: number;
  totalEmployees: number;
  totalClients: number;
  totalMobileUsers: number;
  totalMobileDownloads: number;
  // Active vs inactive
  activeBusinesses: number;
  inactiveBusinesses: number;
  // This month
  newBusinessesThisMonth: number;
  newEmployeesThisMonth: number;
  newClientsThisMonth: number;
  // Last 30 days
  businessesLast30: number;
  employeesLast30: number;
  clientsLast30: number;
  // Mobile distribution
  mobileEnabled: number;
  mobileExpired: number;
  mobileDisabled: number;
  // CRM
  totalCrmUsers: number;
  crmActiveBusinesses: number;
  crmDisabledBusinesses: number;
  // Department distribution
  departmentDistribution: { name: string; count: number }[];
  // Alerts
  alerts: { type: string; message: string; count: number }[];
}

export function useSystemHealth() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Parallel fetches
    const [
      { data: businesses },
      { data: employees },
      { data: clients },
      { data: departments },
      { data: profiles },
    ] = await Promise.all([
      supabase.from("businesses").select("id, status, created_at, crm_access_status, mobile_access_status, mobile_subscription_expiry, mobile_app_downloads").order("created_at") as any,
      supabase.from("hr_employees" as any).select("id, business_id, department_id, created_at") as any,
      supabase.from("clients").select("id, business_id, created_at").neq("client_status", "reverted") as any,
      supabase.from("hr_departments" as any).select("id, business_id, name") as any,
      supabase.from("profiles").select("id, user_id, created_at") as any,
    ]);

    const biz = (businesses ?? []) as any[];
    const emps = (employees ?? []) as any[];
    const cls = (clients ?? []) as any[];
    const depts = (departments ?? []) as any[];
    const profs = (profiles ?? []) as any[];

    const activeBiz = biz.filter(b => b.status === "active");
    const inactiveBiz = biz.filter(b => b.status !== "active");

    // Mobile distribution
    const mobileEnabled = biz.filter(b => b.mobile_access_status === "active").length;
    const mobileExpired = biz.filter(b => {
      if (!b.mobile_subscription_expiry) return false;
      return new Date(b.mobile_subscription_expiry) < now && b.mobile_access_status === "active";
    }).length;
    const mobileDisabled = biz.filter(b => b.mobile_access_status === "disabled").length;

    // Department distribution - aggregate across all businesses
    const deptMap = new Map<string, number>();
    depts.forEach((d: any) => {
      const name = (d.name || "Unknown").trim();
      deptMap.set(name, (deptMap.get(name) || 0) + 1);
    });
    const departmentDistribution = Array.from(deptMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Alerts
    const alerts: { type: string; message: string; count: number }[] = [];
    const expiredMobileSubs = biz.filter(b => b.mobile_subscription_expiry && new Date(b.mobile_subscription_expiry) < now);
    if (expiredMobileSubs.length > 0) {
      alerts.push({ type: "warning", message: "Businesses with expired mobile subscriptions", count: expiredMobileSubs.length });
    }
    const disabledCrm = biz.filter(b => b.crm_access_status === "disabled");
    if (disabledCrm.length > 0) {
      alerts.push({ type: "warning", message: "Businesses with disabled CRM access", count: disabledCrm.length });
    }
    // Inactive 30+ days - businesses created before 30 days ago and inactive
    const inactive30 = inactiveBiz.filter(b => new Date(b.created_at) < new Date(thirtyDaysAgo));
    if (inactive30.length > 0) {
      alerts.push({ type: "info", message: "Businesses inactive for 30+ days", count: inactive30.length });
    }

    setData({
      totalBusinesses: biz.length,
      totalEmployees: emps.length,
      totalClients: cls.length,
      totalMobileUsers: mobileEnabled,
      totalMobileDownloads: biz.reduce((s, b) => s + (b.mobile_app_downloads ?? 0), 0),
      activeBusinesses: activeBiz.length,
      inactiveBusinesses: inactiveBiz.length,
      newBusinessesThisMonth: biz.filter(b => b.created_at >= startOfMonth).length,
      newEmployeesThisMonth: emps.filter((e: any) => e.created_at >= startOfMonth).length,
      newClientsThisMonth: cls.filter((c: any) => c.created_at >= startOfMonth).length,
      businessesLast30: biz.filter(b => b.created_at >= thirtyDaysAgo).length,
      employeesLast30: emps.filter((e: any) => e.created_at >= thirtyDaysAgo).length,
      clientsLast30: cls.filter((c: any) => c.created_at >= thirtyDaysAgo).length,
      mobileEnabled,
      mobileExpired,
      mobileDisabled,
      totalCrmUsers: profs.length,
      crmActiveBusinesses: biz.filter(b => b.crm_access_status === "active").length,
      crmDisabledBusinesses: disabledCrm.length,
      departmentDistribution,
      alerts,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  return { data, loading, refetch: fetchHealth };
}
