import { useManagerDashboard } from "@/hooks/useManagerDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ListChecks, CalendarDays, Plus, Check, X, TrendingUp, Clock, AlertTriangle, BarChart2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    department, teamMembers, tasks, leaveRequests,
    loading, stats,
    createTask, updateTask, approveLeave, rejectLeave,
  } = useManagerDashboard();

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", employee_id: "", priority: "medium", start_date: "", deadline: "",
  });

  const handleAddTask = async () => {
    if (!taskForm.title || !taskForm.employee_id) { toast.error("Title and employee required"); return; }
    await createTask(taskForm);
    toast.success("Task assigned");
    setTaskOpen(false);
    setTaskForm({ title: "", description: "", employee_id: "", priority: "medium", start_date: "", deadline: "" });
  };

  const statusColor = (s: string) => {
    switch (s) { case "completed": return "default"; case "in_progress": return "secondary"; case "overdue": return "destructive"; default: return "outline"; }
  };
  const priorityColor = (p: string) => p === "urgent" ? "destructive" : p === "high" ? "default" : "outline";
  const leaveStatusColor = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!department) return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold">No Department Assigned</h2>
      <p className="text-muted-foreground mt-2">You are not assigned as head of any department. Contact HR or an administrator.</p>
    </div>
  );

  const activeTeam = teamMembers.filter(e => e.employment_status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{department.name} Department</h1>
          <p className="text-muted-foreground">Team management & task assignment dashboard</p>
        </div>
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Assign Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Task to Team Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
              <div><Label>Assign To *</Label>
                <Select value={taskForm.employee_id} onValueChange={v => setTaskForm({ ...taskForm, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>{activeTeam.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={taskForm.start_date} onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })} /></div>
                <div><Label>Deadline</Label><Input type="date" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} /></div>
              </div>
              <Button onClick={handleAddTask} className="w-full">Assign Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Team Size</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.activeMembers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Pending Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.completed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.overdue}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><ListChecks className="h-4 w-4" /> In Progress</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Pending Leaves</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pendingLeaves}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><BarChart2 className="h-4 w-4" /> Total Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalTasks}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Completion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalTasks > 0 ? Math.round((stats.completed / stats.totalTasks) * 100) : 0}%</div></CardContent></Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks"><ListChecks className="h-4 w-4 mr-1" /> Tasks</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1" /> Team</TabsTrigger>
          <TabsTrigger value="leaves"><CalendarDays className="h-4 w-4 mr-1" /> Leave Requests</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Task</TableHead><TableHead>Assigned To</TableHead><TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tasks yet</TableCell></TableRow>
                ) : tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                    <TableCell>{t.hr_employees?.full_name}</TableCell>
                    <TableCell><Badge variant={priorityColor(t.priority)}>{t.priority}</Badge></TableCell>
                    <TableCell>{t.deadline || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(t.status)}>{t.status?.replace("_", " ")}</Badge></TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={v => { updateTask(t.id, { status: v }); toast.success("Updated"); }}>
                        <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Designation</TableHead>
                <TableHead>Status</TableHead><TableHead>Location</TableHead><TableHead>Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No team members</TableCell></TableRow>
                ) : teamMembers.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.designation || "—"}</TableCell>
                    <TableCell><Badge variant={e.employment_status === "active" ? "default" : "secondary"}>{e.employment_status}</Badge></TableCell>
                    <TableCell>{e.work_location || "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/hr/employee/${e.id}`)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value="leaves">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead>
                <TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {leaveRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                ) : leaveRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                    <TableCell>{r.hr_leave_types?.name}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.num_days}</TableCell>
                    <TableCell><Badge variant={leaveStatusColor(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="text-green-600" onClick={() => { approveLeave(r.id); toast.success("Approved"); }}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { rejectLeave(r.id); toast.success("Rejected"); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboardPage;
