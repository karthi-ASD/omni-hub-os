import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useClientProjects } from "@/hooks/useClientProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STAGES = [
  { key: "new", label: "New Tasks", color: "bg-blue-500" },
  { key: "assigned", label: "Assigned", color: "bg-yellow-500" },
  { key: "in_progress", label: "In Progress", color: "bg-primary" },
  { key: "under_review", label: "Under Review", color: "bg-purple-500" },
  { key: "completed", label: "Completed", color: "bg-green-500" },
];

const TaskPipelinePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || undefined;
  const { tasksByStatus, loading, create, update } = useProjectTasks(projectId);
  const { projects, departments } = useClientProjects();
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", project_id: projectId || "", department_id: "",
    assigned_employee_id: "", priority: "medium", deadline: "", start_date: "",
  });

  useEffect(() => {
    if (!profile?.business_id) return;
    (supabase.from("hr_employees") as any)
      .select("id, full_name, employee_code, department_id")
      .eq("business_id", profile.business_id)
      .eq("employment_status", "active")
      .then(({ data }: any) => setEmployees(data ?? []));
  }, [profile?.business_id]);

  const handleCreate = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    await create({
      ...form,
      project_id: form.project_id || null,
      department_id: form.department_id || null,
      assigned_employee_id: form.assigned_employee_id || null,
    });
    toast.success("Task created");
    setOpen(false);
    setForm({ title: "", description: "", project_id: projectId || "", department_id: "", assigned_employee_id: "", priority: "medium", deadline: "", start_date: "" });
  };

  const moveTask = (taskId: string, newStatus: string) => {
    update(taskId, { status: newStatus });
    toast.success("Task moved");
  };

  const priorityColor = (p: string) => p === "urgent" ? "destructive" : p === "high" ? "default" : "outline";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Pipeline</h1>
          <p className="text-muted-foreground">Kanban view of project tasks across departments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Project</Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.client_name} – {p.service_type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Assign To</Label>
                <Select value={form.assigned_employee_id} onValueChange={v => setForm({ ...form, assigned_employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {STAGES.map(stage => {
          const stageTasks = tasksByStatus[stage.key as keyof typeof tasksByStatus] || [];
          return (
            <div key={stage.key} className="min-w-[240px]">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{stageTasks.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                {stageTasks.map(task => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/task/${task.id}`)}>
                    <CardContent className="p-3 space-y-2">
                      {task.task_number && <span className="text-[10px] font-mono text-muted-foreground">{task.task_number}</span>}
                      <p className="font-medium text-sm leading-tight">{task.title}</p>
                      {task.client_projects?.client_name && (
                        <p className="text-xs text-muted-foreground">{task.client_projects.client_name}</p>
                      )}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant={priorityColor(task.priority)} className="text-[10px]">{task.priority}</Badge>
                        {task.hr_employees?.full_name && <Badge variant="outline" className="text-[10px]">{task.hr_employees.full_name}</Badge>}
                      </div>
                      {task.deadline && <p className="text-[10px] text-muted-foreground">Due: {task.deadline}</p>}
                      <div className="flex gap-1 flex-wrap">
                        {STAGES.filter(s => s.key !== stage.key).map(s => (
                          <Button key={s.key} size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => moveTask(task.id, s.key)}>
                            → {s.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stageTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskPipelinePage;
