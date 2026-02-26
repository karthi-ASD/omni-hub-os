import { useState } from "react";
import { useProjects, Project, ProjectStatus } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Plus } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-cyan-500/10 text-cyan-600",
  on_hold: "bg-amber-500/10 text-amber-600",
  completed: "bg-green-500/10 text-green-600",
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6" /> Projects</h1>
          <p className="text-muted-foreground">Track project delivery and onboarding</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No projects yet. Projects are auto-created when contracts are signed.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {projects.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.project_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.start_date && `Start: ${format(new Date(p.start_date), "MMM d")} · `}
                    {p.target_end_date && `Due: ${format(new Date(p.target_end_date), "MMM d")} · `}
                    Created {format(new Date(p.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge className={statusColors[p.status]}>{p.status.replace("_", " ")}</Badge>
                <Select value={p.status} onValueChange={v => updateStatus(p.id, v as ProjectStatus)}>
                  <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
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

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["new", "in_progress", "on_hold", "completed"] as const).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-sm capitalize text-muted-foreground">{s.replace("_", " ")}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{projects.filter(p => p.status === s).length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div><Label>Target End Date</Label><Input type="date" value={form.target_end_date} onChange={e => setForm(p => ({ ...p, target_end_date: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.project_name}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
