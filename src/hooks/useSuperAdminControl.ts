import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessAdminRecord {
  business_id: string;
  business_name: string;
  business_status: string;
  crm_access_status: string;
  mobile_access_status: string;
  mobile_subscription_start: string | null;
  mobile_subscription_expiry: string | null;
  mobile_app_downloads: number;
  created_at: string;
  admin_user_id: string;
  admin_name: string;
  admin_email: string;
  total_departments: number;
  total_employees: number;
  total_clients: number;
  department_breakdown: { name: string; employee_count: number }[];
}

export interface PlatformHealth {
  total_businesses: number;
  total_employees: number;
  total_clients: number;
  total_mobile_downloads: number;
  total_crm_active: number;
}

export function useSuperAdminControl() {
  const [records, setRecords] = useState<BusinessAdminRecord[]>([]);
  const [health, setHealth] = useState<PlatformHealth>({
    total_businesses: 0, total_employees: 0, total_clients: 0,
    total_mobile_downloads: 0, total_crm_active: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, status, created_at, crm_access_status, mobile_access_status, mobile_subscription_start, mobile_subscription_expiry, mobile_app_downloads")
      .order("name") as { data: any[] | null };

    if (!businesses) { setLoading(false); return; }

    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id, business_id")
      .eq("role", "business_admin") as { data: any[] | null };

    const adminUserIds = adminRoles?.map((r: any) => r.user_id) ?? [];
    const { data: adminProfiles } = adminUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, email, business_id").in("user_id", adminUserIds) as { data: any[] | null }
      : { data: [] as any[] };

    const { data: departments } = await supabase
      .from("hr_departments" as any)
      .select("id, business_id, name") as { data: any[] | null };

    const { data: employees } = await supabase
      .from("hr_employees" as any)
      .select("id, business_id, department_id") as { data: any[] | null };

    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_id") as { data: any[] | null };

    const result: BusinessAdminRecord[] = businesses.map((biz: any) => {
      const admin = (adminProfiles ?? []).find((p: any) => p.business_id === biz.id);
      const bizDepts = (departments ?? []).filter((d: any) => d.business_id === biz.id);
      const bizEmps = (employees ?? []).filter((e: any) => e.business_id === biz.id);
      const bizClients = (clients ?? []).filter((c: any) => c.business_id === biz.id);

      const deptBreakdown = bizDepts.map((dept: any) => ({
        name: dept.name,
        employee_count: bizEmps.filter((e: any) => e.department_id === dept.id).length,
      }));

      return {
        business_id: biz.id,
        business_name: biz.name,
        business_status: biz.status,
        crm_access_status: biz.crm_access_status ?? "active",
        mobile_access_status: biz.mobile_access_status ?? "active",
        mobile_subscription_start: biz.mobile_subscription_start,
        mobile_subscription_expiry: biz.mobile_subscription_expiry,
        mobile_app_downloads: biz.mobile_app_downloads ?? 0,
        created_at: biz.created_at,
        admin_user_id: admin?.user_id ?? "",
        admin_name: admin?.full_name ?? "No admin",
        admin_email: admin?.email ?? "",
        total_departments: bizDepts.length,
        total_employees: bizEmps.length,
        total_clients: bizClients.length,
        department_breakdown: deptBreakdown,
      };
    });

    setRecords(result);
    setHealth({
      total_businesses: businesses.length,
      total_employees: (employees ?? []).length,
      total_clients: (clients ?? []).length,
      total_mobile_downloads: businesses.reduce((s: number, b: any) => s + (b.mobile_app_downloads ?? 0), 0),
      total_crm_active: businesses.filter((b: any) => b.crm_access_status === "active").length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateBusinessAccess = async (
    businessId: string,
    updates: Record<string, any>
  ) => {
    await supabase.from("businesses").update(updates as any).eq("id", businessId);
    await fetchData();
  };

  const updateBusinessStatus = async (businessId: string, status: string) => {
    await supabase.from("businesses").update({ status: status as any }).eq("id", businessId);
    await fetchData();
  };

  return { records, health, loading, refetch: fetchData, updateBusinessAccess, updateBusinessStatus };
}
