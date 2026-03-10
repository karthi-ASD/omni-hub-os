import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useEmployeeWorkloads() {
  const { profile } = useAuth();
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const bid = profile.business_id;
    const { data: employees } = await (supabase.from("hr_employees") as any)
      .select("id, full_name, employee_code, department_id, employment_status, designation, departments(name)")
      .eq("business_id", bid).eq("employment_status", "active");
    if (!employees) { setLoading(false); return; }
    const { data: tasks } = await (supabase.from("project_tasks" as any) as any)
      .select("assigned_employee_id, status").eq("business_id", bid);
    const { data: storedWorkloads } = await (supabase.from("employee_workloads" as any) as any)
      .select("employee_id, task_capacity").eq("business_id", bid);
    const taskMap: Record<string, { current: number; completed: number; overdue: number }> = {};
    (tasks ?? []).forEach((t: any) => {
      if (!t.assigned_employee_id) return;
      if (!taskMap[t.assigned_employee_id]) taskMap[t.assigned_employee_id] = { current: 0, completed: 0, overdue: 0 };
      if (t.status === "completed") taskMap[t.assigned_employee_id].completed++;
      else if (t.status === "overdue") taskMap[t.assigned_employee_id].overdue++;
      else taskMap[t.assigned_employee_id].current++;
    });
    const capacityMap: Record<string, number> = {};
    (storedWorkloads ?? []).forEach((w: any) => { capacityMap[w.employee_id] = w.task_capacity; });
    const computed = employees.map((e: any) => {
      const t = taskMap[e.id] || { current: 0, completed: 0, overdue: 0 };
      const capacity = capacityMap[e.id] || 10;
      const total = t.current + t.completed + t.overdue;
      return {
        ...e, task_capacity: capacity, current_tasks: t.current, completed_tasks: t.completed,
        overdue_tasks: t.overdue, available_capacity: Math.max(0, capacity - t.current),
        productivity_score: total > 0 ? Math.round((t.completed / total) * 100) : 0,
      };
    });
    setWorkloads(computed);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateCapacity = async (employeeId: string, capacity: number) => {
    if (!profile?.business_id) return;
    await (supabase.from("employee_workloads" as any) as any).upsert({
      business_id: profile.business_id, employee_id: employeeId, task_capacity: capacity,
    }, { onConflict: "employee_id" });
    fetch();
  };

  return { workloads, loading, updateCapacity, refresh: fetch };
}
