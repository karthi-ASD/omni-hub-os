import { useHRTasks } from "@/hooks/useHRTasks";
import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const HRTaskTrackingPage = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { tasks, loading, create, update } = useHRTasks();
  const { employees } = useHREmployees();
  const { departments } = useHRDepartments();
  const canManage = isSuperAdmin || isBusinessAdmin;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", employee_id: "", department_id: "", priority: "medium", start_date: "", deadline: "" });

  const handleAdd = async () => {
    if (!form.title || !form.employee_id) { toast.error("Title and employee required"); return; }
    await create(form);
    toast.success("Task created");
    setAddOpen(false);
    setForm({ title: "", description: "", employee_id: "", department_id: "", priority: "medium", start_date: "", deadline: "" });
  };

  const statusColor = (s: string) => {
    switch (s) { case "completed": return "default"; case "in_progress": return "secondary"; case "overdue": return "destructive"; default: return "outline"; }
  };
  const priorityColor = (p: string) => {
    switch (p) { case "urgent": return "destructive"; case "high": return "default"; default: return "outline"; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Tasks</h1>
          <p className="text-muted-foreground">Track and manage employee tasks across departments</p>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Assign Task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign New Task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Assign To *</Label>
                  <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.employment_status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Department</Label>
                  <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
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
                <Button onClick={handleAdd} className="w-full">Assign Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Tasks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.filter(t => t.status === "pending").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.filter(t => t.status === "in_progress").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === "overdue").length}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Task</TableHead><TableHead>Employee</TableHead><TableHead>Dept</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Action</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tasks</TableCell></TableRow>
            ) : tasks.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                <TableCell>{t.hr_employees?.full_name}</TableCell>
                <TableCell>{t.departments?.name || "—"}</TableCell>
                <TableCell><Badge variant={priorityColor(t.priority)}>{t.priority}</Badge></TableCell>
                <TableCell>{t.deadline || "—"}</TableCell>
                <TableCell><Badge variant={statusColor(t.status)}>{t.status?.replace("_", " ")}</Badge></TableCell>
                {canManage && (
                  <TableCell>
                    <Select value={t.status} onValueChange={v => { update(t.id, { status: v }); toast.success("Updated"); }}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem><SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default HRTaskTrackingPage;
