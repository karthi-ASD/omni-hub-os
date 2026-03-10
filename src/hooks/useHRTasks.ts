import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHRTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_employee_tasks")
      .select("*, hr_employees(full_name, employee_code), departments(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("hr_employee_tasks").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_employee_tasks").update(values as any).eq("id", id);
    fetch();
  };

  return { tasks, loading, create, update, refresh: fetch };
}
