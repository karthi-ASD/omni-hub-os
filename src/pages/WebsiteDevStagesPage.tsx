import { usePageTitle } from "@/hooks/usePageTitle";
import { useWebsiteProjectStages, WEBSITE_STAGES, WebsiteProjectStage } from "@/hooks/useWebsiteProjectStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Globe, ArrowRight, Rocket, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const getStageIndex = (stage: string) => WEBSITE_STAGES.findIndex(s => s.key === stage);
const getStageProgress = (stage: string) => {
  const idx = getStageIndex(stage);
  return idx >= 0 ? Math.round(((idx + 1) / WEBSITE_STAGES.length) * 100) : 0;
};

const WebsiteDevStagesPage = () => {
  usePageTitle("Website Development", "Track website builds through requirement gathering to launch.");
  const { projects, loading, create, advanceStage } = useWebsiteProjectStages();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ project_name: "", client_id: "", start_date: "", target_launch_date: "" });

  const handleCreate = async () => {
    if (!form.project_name || !form.client_id) return;
    await create(form);
    setForm({ project_name: "", client_id: "", start_date: "", target_launch_date: "" });
    setDialog(false);
  };

  if (loading) return <div className="p-4 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-60 w-full" /></div>;

  const launched = projects.filter(p => p.current_stage === "launch").length;
  const inDev = projects.filter(p => p.current_stage === "development").length;
  const inDesign = projects.filter(p => ["wireframe", "ui_design"].includes(p.current_stage)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Development Tracker</h1>
          <p className="text-sm text-muted-foreground">Stage-based tracking from requirements to launch</p>
        </div>
        <Button onClick={() => setDialog(true)}><Plus className="h-4 w-4 mr-2" />New Project</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Projects", value: projects.length, gradient: "from-primary to-accent" },
          { label: "In Design", value: inDesign, gradient: "from-purple-500 to-pink-500" },
          { label: "In Development", value: inDev, gradient: "from-orange-500 to-amber-500" },
          { label: "Launched", value: launched, gradient: "from-green-500 to-emerald-500" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Legend */}
      <div className="flex flex-wrap gap-2">
        {WEBSITE_STAGES.map(s => (
          <Badge key={s.key} variant="outline" className="gap-1">
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            {s.label}
          </Badge>
        ))}
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <Card className="col-span-full rounded-xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              No website projects yet. Click "New Project" to start tracking.
            </CardContent>
          </Card>
        ) : projects.map(project => {
          const stageIdx = getStageIndex(project.current_stage);
          const stageInfo = WEBSITE_STAGES[stageIdx] || WEBSITE_STAGES[0];
          const progress = getStageProgress(project.current_stage);
          const nextStage = stageIdx < WEBSITE_STAGES.length - 1 ? WEBSITE_STAGES[stageIdx + 1] : null;

          return (
            <Card key={project.id} className="rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{project.project_name}</CardTitle>
                  {project.current_stage === "launch" ? (
                    <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Launched</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <span className={`h-2 w-2 rounded-full ${stageInfo.color}`} />
                      {stageInfo.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete — Stage {stageIdx + 1} of {WEBSITE_STAGES.length}</p>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Start: {project.start_date ? format(new Date(project.start_date), "dd MMM") : "—"}</span>
                  <span>Target: {project.target_launch_date ? format(new Date(project.target_launch_date), "dd MMM") : "—"}</span>
                </div>

                {nextStage && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => advanceStage(project.id, nextStage.key)}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1" /> Advance to {nextStage.label}
                  </Button>
                )}
                {project.actual_launch_date && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Rocket className="h-3 w-3" /> Launched on {format(new Date(project.actual_launch_date), "dd MMM yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Website Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="Client Website Redesign" /></div>
            <div><Label>Client ID *</Label><Input value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} placeholder="Paste client UUID" /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><Label>Target Launch Date</Label><Input type="date" value={form.target_launch_date} onChange={e => setForm(f => ({ ...f, target_launch_date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create Project</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebsiteDevStagesPage;
