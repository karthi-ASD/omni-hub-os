import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for department heads / managers.
 * Resolves the manager's department from their hr_employees record,
 * then fetches only that department's employees, tasks, and leave requests.
 */
export function useManagerDashboard() {
  const { user, profile } = useAuth();
  const [managerEmployee, setManagerEmployee] = useState<any>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [department, setDepartment] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Find the manager's own employee record + their department
  const resolveManager = useCallback(async () => {
    if (!user || !profile?.business_id) return;

    // Check if user is head of any department
    const { data: dept } = await supabase
      .from("departments")
      .select("*")
      .eq("business_id", profile.business_id)
      .eq("head_user_id", user.id)
      .maybeSingle();

    if (dept) {
      setDepartment(dept);
      setDepartmentId(dept.id);
    } else {
      // Fallback: find employee record's department
      const { data: emp } = await supabase
        .from("hr_employees")
        .select("*, departments(id, name)")
        .eq("user_id", user.id)
        .maybeSingle();
      setManagerEmployee(emp);
      if (emp?.department_id) {
        setDepartmentId(emp.department_id);
        setDepartment(emp.departments);
      }
    }
  }, [user, profile?.business_id]);

  // 2. Once we know the department, load team data
  const fetchTeamData = useCallback(async () => {
    if (!departmentId || !profile?.business_id) return;

    const [empRes, taskRes, leaveRes] = await Promise.all([
      supabase
        .from("hr_employees")
        .select("*, departments(name)")
        .eq("business_id", profile.business_id)
        .eq("department_id", departmentId)
        .order("full_name"),
      supabase
        .from("hr_employee_tasks")
        .select("*, hr_employees(full_name, employee_code)")
        .eq("business_id", profile.business_id)
        .eq("department_id", departmentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("hr_leave_requests")
        .select("*, hr_employees!inner(full_name, employee_code, department_id), hr_leave_types(name)")
        .eq("business_id", profile.business_id)
        .eq("hr_employees.department_id", departmentId)
        .order("created_at", { ascending: false }),
    ]);

    setTeamMembers(empRes.data ?? []);
    setTasks(taskRes.data ?? []);
    setLeaveRequests(leaveRes.data ?? []);
    setLoading(false);
  }, [departmentId, profile?.business_id]);

  useEffect(() => { resolveManager(); }, [resolveManager]);
  useEffect(() => { if (departmentId) fetchTeamData(); }, [departmentId, fetchTeamData]);

  // Task helpers
  const createTask = async (values: Record<string, any>) => {
    if (!profile?.business_id || !departmentId) return;
    await supabase.from("hr_employee_tasks").insert([{
      ...values,
      department_id: departmentId,
      business_id: profile.business_id,
      assigned_by_name: managerEmployee?.full_name || "Manager",
    } as any]);
    fetchTeamData();
  };

  const updateTask = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_employee_tasks").update(values as any).eq("id", id);
    fetchTeamData();
  };

  const approveLeave = async (id: string) => {
    if (!user) return;
    await supabase.from("hr_leave_requests").update({
      status: "approved", approved_by: user.id, approved_at: new Date().toISOString(),
    } as any).eq("id", id);
    fetchTeamData();
  };

  const rejectLeave = async (id: string) => {
    await supabase.from("hr_leave_requests").update({ status: "rejected" } as any).eq("id", id);
    fetchTeamData();
  };

  // Task update / notes
  const addTaskNote = async (taskId: string, employeeId: string, note: string, statusChange?: string) => {
    if (!profile?.business_id) return;
    await supabase.from("hr_task_updates").insert([{
      business_id: profile.business_id,
      task_id: taskId,
      employee_id: employeeId,
      note,
      status_change: statusChange || null,
    } as any]);
    if (statusChange) {
      await supabase.from("hr_employee_tasks").update({ status: statusChange } as any).eq("id", taskId);
    }
    fetchTeamData();
  };

  // Stats
  const stats = useMemo(() => {
    const activeMembers = teamMembers.filter(e => e.employment_status === "active").length;
    const pendingTasks = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;
    const pendingLeaves = leaveRequests.filter(r => r.status === "pending").length;
    return { activeMembers, pendingTasks, inProgress, completed, overdue, pendingLeaves, totalTasks: tasks.length };
  }, [teamMembers, tasks, leaveRequests]);

  return {
    department, departmentId, teamMembers, tasks, leaveRequests,
    loading, stats,
    createTask, updateTask, approveLeave, rejectLeave, addTaskNote,
    refresh: fetchTeamData,
  };
}
