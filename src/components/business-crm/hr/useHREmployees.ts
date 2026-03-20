import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHREmployees() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("hr_employees")
      .select("*, departments(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const code = `EMP-${String(employees.length + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("hr_employees").insert([{
      ...values,
      employee_code: code,
      business_id: profile.business_id,
      employment_status: "active",
    }]);
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_employees").update(values).eq("id", id);
    await fetch();
  };

  const deactivate = async (id: string, reason: string) => {
    await supabase.from("hr_employees").update({
      employment_status: "terminated",
      deactivated_at: new Date().toISOString(),
      deactivation_reason: reason,
    }).eq("id", id);
    await fetch();
  };

  return { employees, loading, create, update, deactivate, refresh: fetch };
}
