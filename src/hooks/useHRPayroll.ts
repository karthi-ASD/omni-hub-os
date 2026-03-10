import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHRPayroll() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_payroll_records")
      .select("*, hr_employees(full_name, employee_code, departments(name))")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const net = (Number(values.basic_salary) || 0) + (Number(values.hra) || 0) +
      (Number(values.allowances) || 0) + (Number(values.overtime) || 0) + (Number(values.bonus) || 0) -
      (Number(values.deductions) || 0) - (Number(values.pf_tax) || 0);
    await supabase.from("hr_payroll_records").insert([{
      ...values, net_salary: net, business_id: profile.business_id,
    } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_payroll_records").update(values as any).eq("id", id);
    fetch();
  };

  const approve = async (id: string) => {
    await supabase.from("hr_payroll_records").update({ status: "approved" } as any).eq("id", id);
    fetch();
  };

  const lock = async (id: string) => {
    await supabase.from("hr_payroll_records").update({ status: "locked" } as any).eq("id", id);
    fetch();
  };

  return { records, loading, create, update, approve, lock, refresh: fetch };
}
