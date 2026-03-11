import { useState } from "react";
import { useProjects, Project, ProjectStatus } from "@/hooks/useProjects";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Briefcase, Plus, FolderOpen, Clock, CheckCircle, Pause } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  in_progress: "bg-accent/10 text-accent",
  on_hold: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
};

const ProjectsPage = () => {
  const { projects, loading, createProject, updateStatus } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ project_name: "", description: "", start_date: "", target_end_date: "" });

  const handleCreate = async () => {
    await createProject({
      project_name: form.project_name,
      description: form.description || undefined,
      start_date: form.start_date || undefined,
      target_end_date: form.target_end_date || undefined,
      createOnboardingTasks: true,
    });
    setCreateOpen(false);
    setForm({ project_name: "", description: "", start_date: "", target_end_date: "" });
  };

  const counts = {
    new: projects.filter(p => p.status === "new").length,
    in_progress: projects.filter(p => p.status === "in_progress").length,
    on_hold: projects.filter(p => p.status === "on_hold").length,
    completed: projects.filter(p => p.status === "completed").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle="Track project delivery and onboarding"
        icon={Briefcase}
        actions={[{ label: "New Project", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New" value={counts.new} icon={FolderOpen} gradient="from-primary to-accent" />
        <StatCard label="In Progress" value={counts.in_progress} icon={Clock} gradient="from-neon-blue to-info" />
        <StatCard label="On Hold" value={counts.on_hold} icon={Pause} gradient="from-warning to-neon-orange" />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle} gradient="from-neon-green to-success" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : projects.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-16 text-center text-muted-foreground">No projects yet. Projects are auto-created when contracts are signed.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <Card key={p.id} className="rounded-2xl border-0 shadow-elevated hover-lift transition-all">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{p.project_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.start_date && `Start: ${format(new Date(p.start_date), "MMM d")} · `}
                    {p.target_end_date && `Due: ${format(new Date(p.target_end_date), "MMM d")} · `}
                    Created {format(new Date(p.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge className={`border-0 ${statusColors[p.status]}`}>{p.status.replace("_", " ")}</Badge>
                <Select value={p.status} onValueChange={v => updateStatus(p.id, v as ProjectStatus)}>
                  <SelectTrigger className="w-36 h-7 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Target End Date</Label><Input type="date" value={form.target_end_date} onChange={e => setForm(p => ({ ...p, target_end_date: e.target.value }))} className="rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.project_name} className="rounded-xl">Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
