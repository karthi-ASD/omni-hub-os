import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrgMetrics {
  totalDepartments: number;
  totalEmployees: number;
  activeEmployees: number;
  totalClients: number;
  totalLeads: number;
  openDeals: number;
  openTickets: number;
  totalRevenue: number;
  tasksToday: number;
  tasksCompletedToday: number;
  tasksPending: number;
  ticketsOpenedToday: number;
  ticketsResolvedToday: number;
}

export interface DeptSummary {
  id: string;
  name: string;
  manager_name: string | null;
  employee_count: number;
  active_tasks: number;
  completed_tasks: number;
  open_tickets: number;
}

export interface EmployeeActivity {
  employee_id: string;
  full_name: string;
  employee_code: string;
  department_name: string | null;
  designation: string | null;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_pending: number;
  tickets_handled: number;
}

export function useAdminOperations() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<OrgMetrics>({
    totalDepartments: 0, totalEmployees: 0, activeEmployees: 0,
    totalClients: 0, totalLeads: 0, openDeals: 0, openTickets: 0,
    totalRevenue: 0, tasksToday: 0, tasksCompletedToday: 0,
    tasksPending: 0, ticketsOpenedToday: 0, ticketsResolvedToday: 0,
  });
  const [departments, setDepartments] = useState<DeptSummary[]>([]);
  const [employeeActivities, setEmployeeActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const bid = profile.business_id;
    const today = new Date().toISOString().split("T")[0];

    const [
      { count: deptCount },
      { data: employees },
      { count: clientCount },
      { count: leadCount },
      { count: dealCount },
      { count: ticketCount },
      { data: depts },
      { data: tasks },
    ] = await Promise.all([
      supabase.from("hr_departments").select("*", { count: "exact", head: true }).eq("business_id", bid),
      (supabase.from("hr_employees") as any).select("id, full_name, employee_code, department_id, designation, employment_status, departments:hr_departments(name)").eq("business_id", bid),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("deals").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["new", "discovery", "proposal", "negotiation"]),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["open", "in_progress"]),
      supabase.from("hr_departments").select("id, name, head_employee_id").eq("business_id", bid),
      (supabase.from("project_tasks" as any) as any).select("id, status, assigned_employee_id, created_at").eq("business_id", bid),
    ]);

    const activeEmps = (employees ?? []).filter((e: any) => e.employment_status === "active");

    // Build department summaries
    const deptSummaries: DeptSummary[] = (depts ?? []).map((d: any) => {
      const deptEmps = (employees ?? []).filter((e: any) => e.department_id === d.id);
      const deptTasks = (tasks ?? []).filter((t: any) => {
        const empIds = deptEmps.map((e: any) => e.id);
        return empIds.includes(t.assigned_employee_id);
      });
      const headEmp = deptEmps.find((e: any) => e.id === d.head_employee_id);
      return {
        id: d.id,
        name: d.name,
        manager_name: headEmp?.full_name || null,
        employee_count: deptEmps.length,
        active_tasks: deptTasks.filter((t: any) => t.status !== "completed").length,
        completed_tasks: deptTasks.filter((t: any) => t.status === "completed").length,
        open_tickets: 0,
      };
    });

    // Build employee activity
    const empActivities: EmployeeActivity[] = (employees ?? []).map((e: any) => {
      const empTasks = (tasks ?? []).filter((t: any) => t.assigned_employee_id === e.id);
      return {
        employee_id: e.id,
        full_name: e.full_name,
        employee_code: e.employee_code,
        department_name: e.departments?.name || null,
        designation: e.designation,
        tasks_assigned: empTasks.length,
        tasks_completed: empTasks.filter((t: any) => t.status === "completed").length,
        tasks_pending: empTasks.filter((t: any) => t.status !== "completed").length,
        tickets_handled: 0,
      };
    });

    const todayTasks = (tasks ?? []).filter((t: any) => t.created_at?.startsWith(today));

    setMetrics({
      totalDepartments: deptCount ?? 0,
      totalEmployees: (employees ?? []).length,
      activeEmployees: activeEmps.length,
      totalClients: clientCount ?? 0,
      totalLeads: leadCount ?? 0,
      openDeals: dealCount ?? 0,
      openTickets: ticketCount ?? 0,
      totalRevenue: 0,
      tasksToday: todayTasks.length,
      tasksCompletedToday: todayTasks.filter((t: any) => t.status === "completed").length,
      tasksPending: (tasks ?? []).filter((t: any) => t.status !== "completed").length,
      ticketsOpenedToday: 0,
      ticketsResolvedToday: 0,
    });

    setDepartments(deptSummaries);
    setEmployeeActivities(empActivities);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { metrics, departments, employeeActivities, loading, refresh: fetch };
}
