import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProjectTasks(projectId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    let q = supabase
      .from("project_tasks")
      .select("*, client_projects(client_name, service_type), departments(name), hr_employees(full_name, employee_code)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data } = await q;
    setTasks((data as any[]) ?? []);
    setLoading(false);
  }, [profile?.business_id, projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("project_tasks").insert([{
      ...values,
      business_id: profile.business_id,
    } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("project_tasks").update(values as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("project_tasks").delete().eq("id", id);
    fetch();
  };

  // Group by status for kanban
  const tasksByStatus = {
    new: tasks.filter(t => t.status === "new"),
    assigned: tasks.filter(t => t.status === "assigned"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    under_review: tasks.filter(t => t.status === "under_review"),
    completed: tasks.filter(t => t.status === "completed"),
  };

  return { tasks, tasksByStatus, loading, create, update, remove, refresh: fetch };
}
