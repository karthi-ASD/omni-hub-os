import { usePageTitle } from "@/hooks/usePageTitle";
import { useContentTasks, CONTENT_TYPES, ContentTask } from "@/hooks/useContentTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Palette, Video, PenTool, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    in_progress: "bg-blue-500/10 text-blue-600",
    review: "bg-purple-500/10 text-purple-600",
    completed: "bg-green-500/10 text-green-600",
    published: "bg-teal-500/10 text-teal-600",
  };
  return m[s] || "bg-muted text-muted-foreground";
};

const priorityBadge = (p: string) => {
  const m: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-500/10 text-blue-600",
    high: "bg-orange-500/10 text-orange-600",
    urgent: "bg-red-500/10 text-red-600",
  };
  return m[p] || "bg-muted text-muted-foreground";
};

const typeIcon = (t: string) => {
  if (t === "blog") return <FileText className="h-4 w-4" />;
  if (t === "creative_design" || t === "infographic") return <Palette className="h-4 w-4" />;
  if (t === "video") return <Video className="h-4 w-4" />;
  return <PenTool className="h-4 w-4" />;
};

const ContentManagementPage = () => {
  usePageTitle("Content Management", "Track blog writing, creative design, and video production tasks.");
  const { tasks, loading, create, update, remove, stats } = useContentTasks();
  const [dialog, setDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<Partial<ContentTask>>({
    title: "", content_type: "blog", priority: "medium", description: "", target_keyword: "",
  });

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.content_type === filter);

  const handleCreate = async () => {
    if (!form.title) return;
    await create(form);
    setForm({ title: "", content_type: "blog", priority: "medium", description: "", target_keyword: "" });
    setDialog(false);
  };

  if (loading) return <div className="p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-60 w-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground">Blog writing, creative design & video production</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4 mr-2" />New Content Task</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, icon: BarChart3, gradient: "from-primary to-accent" },
          { label: "Pending", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-orange-500" },
          { label: "In Progress", value: stats.inProgress, icon: PenTool, gradient: "from-blue-500 to-indigo-500" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, gradient: "from-green-500 to-emerald-500" },
          { label: "Blogs", value: stats.blogs, icon: FileText, gradient: "from-purple-500 to-pink-500" },
          { label: "Designs", value: stats.designs, icon: Palette, gradient: "from-teal-500 to-cyan-500" },
          { label: "Videos", value: stats.videos, icon: Video, gradient: "from-red-500 to-rose-500" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl overflow-hidden">
            <CardContent className="p-3 text-center">
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.gradient} text-white mb-1`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "all", label: "All" }, ...CONTENT_TYPES].map(t => (
          <Button key={t.value} size="sm" variant={filter === t.value ? "default" : "outline"} onClick={() => setFilter(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No content tasks found</TableCell></TableRow>
              ) : filtered.map(task => (
                <TableRow key={task.id}>
                  <TableCell><div className="flex items-center gap-2">{typeIcon(task.content_type)}<span className="text-xs">{CONTENT_TYPES.find(t => t.value === task.content_type)?.label || task.content_type}</span></div></TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{task.title}</TableCell>
                  <TableCell><Badge className={priorityBadge(task.priority)}>{task.priority}</Badge></TableCell>
                  <TableCell><Badge className={statusBadge(task.status)}>{task.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm">{task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.target_keyword || "—"}</TableCell>
                  <TableCell>
                    <Select value={task.status} onValueChange={(v) => update(task.id, { status: v })}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pending", "in_progress", "review", "completed", "published"].map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Content Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.content_type} onValueChange={v => setForm(f => ({ ...f, content_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Target Keyword</Label><Input value={form.target_keyword || ""} onChange={e => setForm(f => ({ ...f, target_keyword: e.target.value }))} /></div>
            <div><Label>Due Date</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementPage;
