import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ListChecks, CheckCircle, Clock, AlertTriangle, Users, BarChart3 } from "lucide-react";

const DepartmentDashboardPage = () => {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch departments
  useEffect(() => {
    if (!profile?.business_id) return;
    (supabase.from("departments") as any)
      .select("id, name")
      .eq("business_id", profile.business_id)
      .order("name")
      .then(({ data }: any) => {
        setDepartments(data ?? []);
        if (data?.length && !selectedDeptId) setSelectedDeptId(data[0].id);
      });
  }, [profile?.business_id]);

  // Fetch tasks & employees for selected dept
  useEffect(() => {
    if (!profile?.business_id || !selectedDeptId) return;
    setLoading(true);
    Promise.all([
      (supabase.from("project_tasks" as any) as any)
        .select("*, hr_employees(full_name, employee_code), client_projects(client_name)")
        .eq("business_id", profile.business_id)
        .eq("department_id", selectedDeptId),
      (supabase.from("hr_employees") as any)
        .select("id, full_name, employee_code, designation")
        .eq("business_id", profile.business_id)
        .eq("department_id", selectedDeptId)
        .eq("employment_status", "active"),
    ]).then(([taskRes, empRes]: any[]) => {
      setTasks(taskRes.data ?? []);
      setEmployees(empRes.data ?? []);
      setLoading(false);
    });
  }, [profile?.business_id, selectedDeptId]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const newTasks = tasks.filter(t => t.status === "new").length;
    const assigned = tasks.filter(t => t.status === "assigned").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const review = tasks.filter(t => t.status === "under_review").length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length;
    return { total, newTasks, assigned, inProgress, review, completed, overdue };
  }, [tasks]);

  // Workload per employee
  const workload = useMemo(() => {
    return employees.map(emp => ({
      ...emp,
      taskCount: tasks.filter(t => t.assigned_employee_id === emp.id && t.status !== "completed").length,
    })).sort((a, b) => b.taskCount - a.taskCount);
  }, [employees, tasks]);

  const maxTasks = Math.max(...workload.map(w => w.taskCount), 1);
  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name || "Department";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Department Dashboard</h1>
          <p className="text-muted-foreground">Task overview and team workload per department</p>
        </div>
        <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Total", value: stats.total, icon: ListChecks, color: "text-foreground" },
              { label: "New", value: stats.newTasks, icon: ListChecks, color: "text-blue-500" },
              { label: "Assigned", value: stats.assigned, icon: ListChecks, color: "text-yellow-500" },
              { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-primary" },
              { label: "Review", value: stats.review, icon: Clock, color: "text-purple-500" },
              { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-green-500" },
              { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-destructive" },
            ].map(s => (
              <Card key={s.label} className="glass-card">
                <CardContent className="p-3 text-center">
                  <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Workload */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" /> {selectedDeptName} – Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workload.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No employees in this department.</p>}
              {workload.map(emp => (
                <div key={emp.id} className="flex items-center gap-3">
                  <div className="w-36 truncate">
                    <p className="text-sm font-medium">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.designation || "Member"}</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={(emp.taskCount / maxTasks) * 100} className={`h-3 ${emp.taskCount > 8 ? "[&>div]:bg-destructive" : emp.taskCount > 5 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} />
                  </div>
                  <Badge variant={emp.taskCount > 8 ? "destructive" : "outline"} className="text-xs min-w-[60px] justify-center">
                    {emp.taskCount} tasks
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.slice(0, 15).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 text-sm">
                    {task.task_number && <span className="font-mono text-xs text-muted-foreground w-24">{task.task_number}</span>}
                    <span className="flex-1 truncate">{task.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{task.status?.replace(/_/g, " ")}</Badge>
                    <Badge variant={task.priority === "urgent" ? "destructive" : "outline"} className="text-[10px]">{task.priority}</Badge>
                    <span className="text-xs text-muted-foreground w-20 truncate">{task.hr_employees?.full_name || "—"}</span>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tasks in this department.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DepartmentDashboardPage;
