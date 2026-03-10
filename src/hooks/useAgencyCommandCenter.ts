import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAgencyCommandCenter() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [slaItems, setSlaItems] = useState<any[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const [pRes, tRes, sRes, wRes, eRes] = await Promise.all([
      supabase.from("client_projects").select("*, departments(name)").eq("business_id", profile.business_id),
      supabase.from("project_tasks").select("*, departments(name), hr_employees(full_name)").eq("business_id", profile.business_id),
      supabase.from("sla_tracking").select("*, client_projects(client_name), project_tasks(title), departments(name)").eq("business_id", profile.business_id),
      supabase.from("employee_workloads").select("*, hr_employees(full_name, employee_code, department_id, departments(name))").eq("business_id", profile.business_id),
      supabase.from("hr_employees").select("id, full_name, employee_code, department_id, employment_status, departments(name)").eq("business_id", profile.business_id).eq("employment_status", "active"),
    ]);
    setProjects((pRes.data as any[]) ?? []);
    setTasks((tRes.data as any[]) ?? []);
    setSlaItems((sRes.data as any[]) ?? []);
    setWorkloads((wRes.data as any[]) ?? []);
    setEmployees((eRes.data as any[]) ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === "in_progress").length;
    const totalProjects = projects.length;
    const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
    const tasksOverdue = tasks.filter(t => t.status === "overdue" || (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")).length;
    const tasksCompleted = tasks.filter(t => t.status === "completed").length;
    const slaBreached = slaItems.filter(s => s.status === "breached").length;
    const slaAtRisk = slaItems.filter(s => s.status === "at_risk").length;
    const totalEmployees = employees.length;

    // Department breakdown
    const deptMap: Record<string, number> = {};
    projects.forEach(p => {
      const name = p.departments?.name || "Unassigned";
      deptMap[name] = (deptMap[name] || 0) + 1;
    });

    return {
      totalProjects, activeProjects, tasksInProgress, tasksOverdue, tasksCompleted,
      slaBreached, slaAtRisk, totalEmployees,
      totalTasks: tasks.length,
      projectsByDepartment: Object.entries(deptMap).map(([name, count]) => ({ name, count })),
    };
  }, [projects, tasks, slaItems, employees]);

  return { projects, tasks, slaItems, workloads, employees, loading, stats, refresh: fetch };
}
