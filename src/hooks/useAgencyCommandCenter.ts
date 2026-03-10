import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAgencyCommandCenter() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [slaItems, setSlaItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const bid = profile.business_id;
    const pRes = await (supabase.from("client_projects" as any) as any).select("*, departments(name)").eq("business_id", bid);
    const tRes = await (supabase.from("project_tasks" as any) as any).select("*, departments(name), hr_employees(full_name)").eq("business_id", bid);
    const sRes = await (supabase.from("sla_tracking" as any) as any).select("*, client_projects(client_name), project_tasks(title), departments(name)").eq("business_id", bid);
    const eRes = await (supabase.from("hr_employees") as any).select("id, full_name, employee_code, department_id, employment_status, departments(name)").eq("business_id", bid).eq("employment_status", "active");
    setProjects(pRes.data ?? []);
    setTasks(tRes.data ?? []);
    setSlaItems(sRes.data ?? []);
    setEmployees(eRes.data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === "in_progress").length;
    const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
    const tasksOverdue = tasks.filter(t => t.status === "overdue" || (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")).length;
    const tasksCompleted = tasks.filter(t => t.status === "completed").length;
    const slaBreached = slaItems.filter(s => s.status === "breached").length;
    const slaAtRisk = slaItems.filter(s => s.status === "at_risk").length;
    const deptMap: Record<string, number> = {};
    projects.forEach(p => { const n = p.departments?.name || "Unassigned"; deptMap[n] = (deptMap[n] || 0) + 1; });
    return {
      totalProjects: projects.length, activeProjects, tasksInProgress, tasksOverdue, tasksCompleted,
      slaBreached, slaAtRisk, totalEmployees: employees.length, totalTasks: tasks.length,
      projectsByDepartment: Object.entries(deptMap).map(([name, count]) => ({ name, count })),
    };
  }, [projects, tasks, slaItems, employees]);

  return { projects, tasks, slaItems, employees, loading, stats, refresh: fetch };
}
