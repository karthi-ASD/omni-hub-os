import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CEOMetrics {
  totalEmployees: number;
  totalDepartments: number;
  activeClients: number;
  totalLeads: number;
  openDeals: number;
  dealsClosedMonth: number;
  revenueMonth: number;
  pipelineValue: number;
  openTickets: number;
  ticketsResolvedToday: number;
  tasksCompletedToday: number;
  tasksPending: number;
  renewalsDue: number;
  avgCSAT: number;
  employeesPresent: number;
  leavePending: number;
}

export interface DeptProductivity {
  name: string;
  completed: number;
  pending: number;
  employees: number;
}

export interface EmployeeLeader {
  name: string;
  code: string;
  department: string;
  completed: number;
  pending: number;
}

export interface AIInsight {
  category: string;
  severity: string;
  title: string;
  description: string;
  recommended_action: string;
}

export interface CEOInsightsResult {
  insights: AIInsight[];
  executive_summary: string;
  health_score: number;
}

export function useCEODashboard() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<CEOMetrics>({
    totalEmployees: 0, totalDepartments: 0, activeClients: 0, totalLeads: 0,
    openDeals: 0, dealsClosedMonth: 0, revenueMonth: 0, pipelineValue: 0,
    openTickets: 0, ticketsResolvedToday: 0, tasksCompletedToday: 0, tasksPending: 0,
    renewalsDue: 0, avgCSAT: 0, employeesPresent: 0, leavePending: 0,
  });
  const [deptProductivity, setDeptProductivity] = useState<DeptProductivity[]>([]);
  const [topEmployees, setTopEmployees] = useState<EmployeeLeader[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<CEOInsightsResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    const bid = profile.business_id;
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.slice(0, 8) + "01";

    const [
      { count: empCount },
      { count: deptCount },
      { count: clientCount },
      { count: leadCount },
      { count: openDealCount },
      { data: wonDeals },
      { count: openTicketCount },
      { data: depts },
      { data: employees },
      { data: tasks },
      { data: events },
      { count: renewalCount },
      { count: leavePendCount },
    ] = await Promise.all([
      (supabase.from("hr_employees" as any) as any).select("*", { count: "exact", head: true }).eq("business_id", bid).eq("employment_status", "active"),
      (supabase.from("hr_departments" as any) as any).select("*", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("deals").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["open"] as any),
      supabase.from("deals").select("id, value").eq("business_id", bid).eq("status", "won" as any).gte("created_at", monthStart),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("business_id", bid).in("status", ["open", "in_progress"]),
      (supabase.from("hr_departments" as any) as any).select("id, name, head_employee_id").eq("business_id", bid),
      (supabase.from("hr_employees" as any) as any).select("id, full_name, employee_code, department_id, employment_status, departments:hr_departments(name)").eq("business_id", bid).eq("employment_status", "active"),
      (supabase.from("project_tasks" as any) as any).select("id, status, assigned_employee_id, created_at").eq("business_id", bid),
      supabase.from("system_events").select("id, event_type, payload_json, created_at").eq("business_id", bid).order("created_at", { ascending: false }).limit(20),
      (supabase.from("renewals" as any) as any).select("*", { count: "exact", head: true }).eq("business_id", bid).eq("renewal_status", "upcoming"),
      (supabase.from("hr_leave_requests" as any) as any).select("*", { count: "exact", head: true }).eq("business_id", bid).eq("status", "pending"),
    ]);

    const revenueMonth = (wonDeals ?? []).reduce((s: number, d: any) => s + (d.value || 0), 0);
    const todayTasks = (tasks ?? []).filter((t: any) => t.created_at?.startsWith(today));
    const completedToday = todayTasks.filter((t: any) => t.status === "completed").length;

    // Dept productivity
    const deptProd: DeptProductivity[] = (depts ?? []).map((d: any) => {
      const deptEmps = (employees ?? []).filter((e: any) => e.department_id === d.id);
      const empIds = deptEmps.map((e: any) => e.id);
      const deptTasks = (tasks ?? []).filter((t: any) => empIds.includes(t.assigned_employee_id));
      return {
        name: d.name,
        completed: deptTasks.filter((t: any) => t.status === "completed").length,
        pending: deptTasks.filter((t: any) => t.status !== "completed").length,
        employees: deptEmps.length,
      };
    }).sort((a, b) => b.completed - a.completed);

    // Top employees by task completion
    const empMap: Record<string, EmployeeLeader> = {};
    (employees ?? []).forEach((e: any) => {
      empMap[e.id] = { name: e.full_name, code: e.employee_code, department: e.departments?.name || "—", completed: 0, pending: 0 };
    });
    (tasks ?? []).forEach((t: any) => {
      if (empMap[t.assigned_employee_id]) {
        if (t.status === "completed") empMap[t.assigned_employee_id].completed++;
        else empMap[t.assigned_employee_id].pending++;
      }
    });
    const topEmps = Object.values(empMap).sort((a, b) => b.completed - a.completed).slice(0, 10);

    setMetrics({
      totalEmployees: empCount ?? 0,
      totalDepartments: deptCount ?? 0,
      activeClients: clientCount ?? 0,
      totalLeads: leadCount ?? 0,
      openDeals: openDealCount ?? 0,
      dealsClosedMonth: (wonDeals ?? []).length,
      revenueMonth,
      pipelineValue: 0,
      openTickets: openTicketCount ?? 0,
      ticketsResolvedToday: 0,
      tasksCompletedToday: completedToday,
      tasksPending: (tasks ?? []).filter((t: any) => t.status !== "completed").length,
      renewalsDue: renewalCount ?? 0,
      avgCSAT: 0,
      employeesPresent: empCount ?? 0,
      leavePending: leavePendCount ?? 0,
    });
    setDeptProductivity(deptProd);
    setTopEmployees(topEmps);
    setRecentEvents(events ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAIInsights = useCallback(async () => {
    if (!profile?.business_id) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: {
          task_type: "ceo_insights",
          payload: {
            metrics,
            department_productivity: deptProductivity.slice(0, 8),
            top_employees: topEmployees.slice(0, 5),
          },
        },
      });
      if (error) throw error;
      if (data?.result) setAiInsights(data.result as CEOInsightsResult);
    } catch (e) {
      console.error("AI insights error:", e);
    } finally {
      setAiLoading(false);
    }
  }, [profile?.business_id, metrics, deptProductivity, topEmployees]);

  return { metrics, deptProductivity, topEmployees, recentEvents, loading, aiInsights, aiLoading, fetchAIInsights, refresh: fetchData };
}
