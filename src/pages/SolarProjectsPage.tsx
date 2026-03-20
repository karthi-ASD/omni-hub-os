import { useState } from "react";
import { useSolarProjects, PIPELINE_STAGES, SolarProject, PipelineStage } from "@/hooks/useSolarProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sun, Plus, LayoutGrid, List, Zap, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { format } from "date-fns";

const SolarProjectsPage = () => {
  const { projects, projectsByStage, loading, createProject, updateStage } = useSolarProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [detailProject, setDetailProject] = useState<SolarProject | null>(null);
  const [form, setForm] = useState({
    project_name: "", address: "", contact_name: "", contact_phone: "", contact_email: "",
    system_size_kw: "", estimated_value: "", roof_type: "", consumption_kwh: "", notes: "", priority: "medium",
    start_date: "", target_end_date: "",
  });

  const handleCreate = async () => {
    if (!form.project_name) return;
    await createProject({
      project_name: form.project_name,
      address: form.address || undefined,
      contact_name: form.contact_name || undefined,
      contact_phone: form.contact_phone || undefined,
      contact_email: form.contact_email || undefined,
      system_size_kw: form.system_size_kw ? parseFloat(form.system_size_kw) : undefined,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : undefined,
      roof_type: form.roof_type || undefined,
      consumption_kwh: form.consumption_kwh ? parseFloat(form.consumption_kwh) : undefined,
      notes: form.notes || undefined,
      priority: form.priority,
      start_date: form.start_date || undefined,
      target_end_date: form.target_end_date || undefined,
    } as any);
    setCreateOpen(false);
    setForm({ project_name: "", address: "", contact_name: "", contact_phone: "", contact_email: "",
      system_size_kw: "", estimated_value: "", roof_type: "", consumption_kwh: "", notes: "", priority: "medium",
      start_date: "", target_end_date: "" });
  };

  const activeProjects = projects.filter(p => !["handover_completed"].includes(p.pipeline_stage || ""));
  const completedProjects = projects.filter(p => p.pipeline_stage === "handover_completed");
  const totalValue = projects.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const totalKw = projects.reduce((s, p) => s + (p.system_size_kw || 0), 0);

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("projectId", projectId);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("projectId");
    if (projectId) updateStage(projectId, stage);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Solar Projects"
        subtitle="Track installations from lead to handover"
        icon={Sun}
        actions={[
          { label: view === "kanban" ? "List View" : "Kanban View", icon: view === "kanban" ? List : LayoutGrid, onClick: () => setView(v => v === "kanban" ? "list" : "kanban"), variant: "outline" as any },
          { label: "New Project", icon: Plus, onClick: () => setCreateOpen(true) },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon={Sun} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeProjects.length} icon={Zap} gradient="from-neon-blue to-info" />
        <StatCard label="Completed" value={completedProjects.length} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="Total kW" value={`${totalKw.toFixed(1)}`} icon={Zap} gradient="from-warning to-neon-orange" />
        <StatCard label="Pipeline Value" value={`$${(totalValue / 1000).toFixed(0)}k`} icon={DollarSign} gradient="from-success to-neon-green" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : view === "kanban" ? (
        /* KANBAN VIEW */
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: `${PIPELINE_STAGES.length * 260}px` }}>
            {PIPELINE_STAGES.map(stage => (
              <div
                key={stage.key}
                className="w-[250px] flex-shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage.label}</h3>
                  <Badge variant="outline" className="text-[10px]">{projectsByStage[stage.key]?.length || 0}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px] rounded-xl bg-muted/30 p-2">
                  {(projectsByStage[stage.key] || []).map(project => (
                    <Card
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, project.id)}
                      onClick={() => setDetailProject(project)}
                      className="rounded-xl border-0 shadow-sm hover-lift cursor-grab active:cursor-grabbing transition-all"
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <p className="font-semibold text-xs leading-tight">{project.project_name}</p>
                        {project.contact_name && (
                          <p className="text-[10px] text-muted-foreground">{project.contact_name}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {project.system_size_kw && (
                            <Badge variant="outline" className="text-[9px] py-0">{project.system_size_kw} kW</Badge>
                          )}
                          {project.estimated_value && (
                            <Badge variant="outline" className="text-[9px] py-0">${project.estimated_value.toLocaleString()}</Badge>
                          )}
                          <Badge variant="outline" className={`text-[9px] py-0 capitalize ${
                            project.priority === "high" ? "border-destructive/50 text-destructive" :
                            project.priority === "urgent" ? "border-destructive text-destructive" : ""
                          }`}>{project.priority}</Badge>
                        </div>
                        {project.address && (
                          <p className="text-[10px] text-muted-foreground truncate">{project.address}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        /* LIST VIEW */
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">System</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Value</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const stageInfo = PIPELINE_STAGES.find(s => s.key === (p.pipeline_stage || "new_project"));
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setDetailProject(p)}>
                    <td className="px-4 py-3 font-medium">{p.project_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.contact_name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${stageInfo?.color || ""}`}>{stageInfo?.label || p.pipeline_stage}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{p.system_size_kw ? `${p.system_size_kw} kW` : "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell capitalize">{p.priority}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Solar Project</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Phone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>System (kW)</Label><Input type="number" value={form.system_size_kw} onChange={e => setForm(f => ({ ...f, system_size_kw: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Est. Value ($)</Label><Input type="number" value={form.estimated_value} onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Consumption (kWh)</Label><Input type="number" value={form.consumption_kwh} onChange={e => setForm(f => ({ ...f, consumption_kwh: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Roof Type</Label>
                <Select value={form.roof_type} onValueChange={v => setForm(f => ({ ...f, roof_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tile">Tile</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="slate">Slate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Target End Date</Label><Input type="date" value={form.target_end_date} onChange={e => setForm(f => ({ ...f, target_end_date: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.project_name} className="rounded-xl">Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailProject} onOpenChange={() => setDetailProject(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailProject?.project_name}</DialogTitle>
          </DialogHeader>
          {detailProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Stage</span>
                  <Select value={detailProject.pipeline_stage || "new_project"} onValueChange={v => { updateStage(detailProject.id, v as PipelineStage); setDetailProject({ ...detailProject, pipeline_stage: v as PipelineStage }); }}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><span className="text-muted-foreground text-xs">Priority</span><p className="font-medium capitalize">{detailProject.priority}</p></div>
                <div><span className="text-muted-foreground text-xs">System Size</span><p className="font-medium">{detailProject.system_size_kw ? `${detailProject.system_size_kw} kW` : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Estimated Value</span><p className="font-medium">{detailProject.estimated_value ? `$${detailProject.estimated_value.toLocaleString()}` : "—"}</p></div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contact Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Name</span><p>{detailProject.contact_name || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Phone</span><p>{detailProject.contact_phone || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Email</span><p>{detailProject.contact_email || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Address</span><p>{detailProject.address || "—"}</p></div>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Solar Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Roof Type</span><p className="capitalize">{detailProject.roof_type || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Consumption</span><p>{detailProject.consumption_kwh ? `${detailProject.consumption_kwh} kWh` : "—"}</p></div>
                </div>
              </div>

              {detailProject.notes && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</h4>
                  <p className="text-sm">{detailProject.notes}</p>
                </div>
              )}

              <div className="border-t pt-3 text-xs text-muted-foreground">
                Created {format(new Date(detailProject.created_at), "dd MMM yyyy, HH:mm")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolarProjectsPage;
