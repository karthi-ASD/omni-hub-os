import { useState } from "react";
import { usePackageSeoTasks, TASK_CATEGORIES, TASK_STATUSES, TASK_PRIORITIES, PackageSeoTask } from "@/hooks/usePackageSeoTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, ListTodo, Clock, CheckCircle2, AlertCircle, AlertTriangle,
  Play, Check, MoreHorizontal,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  packageId: string;
  clientId?: string;
  isReadOnly?: boolean;
}

const priorityBadge = (p: string) => {
  const colors: Record<string, string> = {
    URGENT: "bg-red-500/15 text-red-700 border-red-500/30",
    HIGH: "bg-orange-500/15 text-orange-700 border-orange-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    LOW: "bg-muted text-muted-foreground",
  };
  return <Badge className={colors[p] || colors.LOW}>{p}</Badge>;
};

const statusBadge = (s: string) => {
  const colors: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    IN_PROGRESS: "bg-primary/15 text-primary border-primary/30",
    BLOCKED: "bg-red-500/15 text-red-700 border-red-500/30",
    PENDING: "bg-muted text-muted-foreground",
  };
  return <Badge className={colors[s] || colors.PENDING}>{TASK_STATUSES.find(ts => ts.value === s)?.label || s}</Badge>;
};

export default function PackageSeoTasksTab({ packageId, clientId, isReadOnly = false }: Props) {
  const { tasks, loading, stats, createTask, updateTask, deleteTask } = usePackageSeoTasks(packageId, clientId);
  const [createDialog, setCreateDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [form, setForm] = useState({
    task_title: "",
    task_category: "TECHNICAL_SEO",
    task_description: "",
    priority: "MEDIUM",
    deadline: "",
  });

  const handleCreate = async () => {
    if (!form.task_title) return;
    await createTask({
      task_title: form.task_title,
      task_category: form.task_category,
      task_description: form.task_description || undefined,
      priority: form.priority,
      deadline: form.deadline || undefined,
    });
    setForm({ task_title: "", task_category: "TECHNICAL_SEO", task_description: "", priority: "MEDIUM", deadline: "" });
    setCreateDialog(false);
  };

  const filtered = tasks.filter(t => {
    if (search && !t.task_title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.task_category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Tasks" value={stats.total} icon={ListTodo} gradient="from-primary to-accent" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} gradient="from-amber-500 to-orange-500" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Play} gradient="from-blue-500 to-cyan-500" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} gradient="from-emerald-500 to-green-500" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} gradient="from-red-500 to-rose-500" alert={stats.overdue > 0} />
      </div>

      {/* Toolbar */}
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> SEO Tasks
          </CardTitle>
          {!isReadOnly && (
            <Button size="sm" onClick={() => setCreateDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Task
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {TASK_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {TASK_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TASK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                {tasks.length === 0 ? "No SEO tasks yet" : "No tasks match your filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    {!isReadOnly && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{task.task_title}</p>
                          {task.task_description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{task.task_description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {TASK_CATEGORIES.find(c => c.value === task.task_category)?.label || task.task_category}
                        </span>
                      </TableCell>
                      <TableCell>{priorityBadge(task.priority)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {task.assigned_employee_name || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {task.deadline ? (
                          <span className={`text-sm ${isPast(parseISO(task.deadline)) && task.status !== "COMPLETED" ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {format(parseISO(task.deadline), "dd MMM yyyy")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(task.status)}</TableCell>
                      {!isReadOnly && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {task.status === "PENDING" && (
                                <DropdownMenuItem onClick={() => updateTask(task.id, { status: "IN_PROGRESS" })}>
                                  <Play className="h-3.5 w-3.5 mr-2" /> Start
                                </DropdownMenuItem>
                              )}
                              {task.status === "IN_PROGRESS" && (
                                <DropdownMenuItem onClick={() => updateTask(task.id, { status: "COMPLETED" })}>
                                  <Check className="h-3.5 w-3.5 mr-2" /> Complete
                                </DropdownMenuItem>
                              )}
                              {task.status !== "PENDING" && (
                                <DropdownMenuItem onClick={() => updateTask(task.id, { status: "PENDING" })}>
                                  <Clock className="h-3.5 w-3.5 mr-2" /> Reset to Pending
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => updateTask(task.id, { status: "BLOCKED" })}>
                                <AlertCircle className="h-3.5 w-3.5 mr-2" /> Mark Blocked
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create SEO Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.task_title} onChange={e => setForm(p => ({ ...p, task_title: e.target.value }))} placeholder="e.g. Keyword Research" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.task_category} onValueChange={v => setForm(p => ({ ...p, task_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.task_description} onChange={e => setForm(p => ({ ...p, task_description: e.target.value }))} placeholder="Optional details..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.task_title}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
