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
  // aggregated stats
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

    // 1. Fetch all businesses
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, status, created_at, crm_access_status, mobile_access_status, mobile_subscription_start, mobile_subscription_expiry, mobile_app_downloads")
      .order("name");

    if (!businesses) { setLoading(false); return; }

    // 2. Fetch business_admin role assignments
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id, business_id")
      .eq("role", "business_admin");

    // 3. Fetch profiles for admin users
    const adminUserIds = adminRoles?.map(r => r.user_id) ?? [];
    const { data: adminProfiles } = adminUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, full_name, email, business_id").in("user_id", adminUserIds)
      : { data: [] as any[] };

    // 4. Fetch department counts per business
    const { data: departments } = await supabase
      .from("hr_departments")
      .select("id, business_id, name");

    // 5. Fetch employee counts per business
    const { data: employees } = await supabase
      .from("hr_employees")
      .select("id, business_id, department_id");

    // 6. Fetch client counts per business
    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_id");

    // Build records
    const result: BusinessAdminRecord[] = businesses.map(biz => {
      const admin = (adminProfiles ?? []).find(p => p.business_id === biz.id);
      const bizDepts = (departments ?? []).filter(d => d.business_id === biz.id);
      const bizEmps = (employees ?? []).filter(e => e.business_id === biz.id);
      const bizClients = (clients ?? []).filter(c => c.business_id === biz.id);

      const deptBreakdown = bizDepts.map(dept => ({
        name: dept.name,
        employee_count: bizEmps.filter(e => e.department_id === dept.id).length,
      }));

      return {
        business_id: biz.id,
        business_name: biz.name,
        business_status: biz.status,
        crm_access_status: (biz as any).crm_access_status ?? "active",
        mobile_access_status: (biz as any).mobile_access_status ?? "active",
        mobile_subscription_start: (biz as any).mobile_subscription_start,
        mobile_subscription_expiry: (biz as any).mobile_subscription_expiry,
        mobile_app_downloads: (biz as any).mobile_app_downloads ?? 0,
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
      total_mobile_downloads: businesses.reduce((s, b) => s + ((b as any).mobile_app_downloads ?? 0), 0),
      total_crm_active: businesses.filter(b => (b as any).crm_access_status === "active").length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateBusinessAccess = async (
    businessId: string,
    updates: { crm_access_status?: string; mobile_access_status?: string; mobile_subscription_expiry?: string | null; mobile_subscription_start?: string | null; mobile_app_downloads?: number }
  ) => {
    await supabase.from("businesses").update(updates as any).eq("id", businessId);
    await fetchData();
  };

  const updateBusinessStatus = async (businessId: string, status: string) => {
    await supabase.from("businesses").update({ status }).eq("id", businessId);
    await fetchData();
  };

  return { records, health, loading, refetch: fetchData, updateBusinessAccess, updateBusinessStatus };
}
