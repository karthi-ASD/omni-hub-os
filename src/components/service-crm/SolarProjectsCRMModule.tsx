import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSolarProjects, PIPELINE_STAGES, SolarProject, PipelineStage } from "@/hooks/useSolarProjects";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sun, Plus, LayoutGrid, List, Zap, Clock, CheckCircle, AlertTriangle,
  DollarSign, Wrench, ClipboardCheck, Package, BarChart3, Camera,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCallback, useEffect } from "react";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))",
  "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))",
  "hsl(var(--neon-blue))", "hsl(var(--neon-green))", "hsl(var(--neon-orange))",
];

export function SolarProjectsCRMModule() {
  const [mainTab, setMainTab] = useState("pipeline");

  return (
    <div className="space-y-4">
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pipeline" className="text-xs gap-1.5"><Sun className="h-3 w-3" />Pipeline</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs gap-1.5"><Wrench className="h-3 w-3" />Operations</TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4"><PipelineView /></TabsContent>
        <TabsContent value="operations" className="mt-4"><OperationsView /></TabsContent>
        <TabsContent value="dashboard" className="mt-4"><DashboardView /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── PIPELINE VIEW (Kanban + List) ─── */
function PipelineView() {
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

  const activeProjects = projects.filter(p => p.pipeline_stage !== "handover_completed");
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
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Projects" value={projects.length} icon={Sun} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeProjects.length} icon={Zap} gradient="from-neon-blue to-info" />
        <StatCard label="Completed" value={completedProjects.length} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="Total kW" value={`${totalKw.toFixed(1)}`} icon={Zap} gradient="from-warning to-neon-orange" />
        <StatCard label="Pipeline Value" value={`$${(totalValue / 1000).toFixed(0)}k`} icon={DollarSign} gradient="from-success to-neon-green" />
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => setView(v => v === "kanban" ? "list" : "kanban")} className="gap-1.5 text-xs">
          {view === "kanban" ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
          {view === "kanban" ? "List View" : "Kanban View"}
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" />New Project</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : view === "kanban" ? (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: `${PIPELINE_STAGES.length * 260}px` }}>
            {PIPELINE_STAGES.map(stage => (
              <div key={stage.key} className="w-[250px] flex-shrink-0"
                onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, stage.key)}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage.label}</h3>
                  <Badge variant="outline" className="text-[10px]">{projectsByStage[stage.key]?.length || 0}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px] rounded-xl bg-muted/30 p-2">
                  {(projectsByStage[stage.key] || []).map(project => (
                    <Card key={project.id} draggable onDragStart={e => handleDragStart(e, project.id)}
                      onClick={() => setDetailProject(project)}
                      className="rounded-xl border-0 shadow-sm hover-lift cursor-grab active:cursor-grabbing transition-all">
                      <CardContent className="p-3 space-y-1.5">
                        <p className="font-semibold text-xs leading-tight">{project.project_name}</p>
                        {project.contact_name && <p className="text-[10px] text-muted-foreground">{project.contact_name}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          {project.system_size_kw && <Badge variant="outline" className="text-[9px] py-0">{project.system_size_kw} kW</Badge>}
                          {project.estimated_value && <Badge variant="outline" className="text-[9px] py-0">${project.estimated_value.toLocaleString()}</Badge>}
                          <Badge variant="outline" className={`text-[9px] py-0 capitalize ${
                            project.priority === "high" || project.priority === "urgent" ? "border-destructive/50 text-destructive" : ""
                          }`}>{project.priority}</Badge>
                        </div>
                        {project.address && <p className="text-[10px] text-muted-foreground truncate">{project.address}</p>}
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
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">System</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Value</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Priority</th>
            </tr></thead>
            <tbody>
              {projects.map(p => {
                const stageInfo = PIPELINE_STAGES.find(s => s.key === (p.pipeline_stage || "new_project"));
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setDetailProject(p)}>
                    <td className="px-4 py-3 font-medium">{p.project_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.contact_name || "—"}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${stageInfo?.color || ""}`}>{stageInfo?.label || p.pipeline_stage}</Badge></td>
                    <td className="px-4 py-3 hidden lg:table-cell">{p.system_size_kw ? `${p.system_size_kw} kW` : "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{p.estimated_value ? `$${p.estimated_value.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell capitalize">{p.priority}</td>
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
                    <SelectItem value="tile">Tile</SelectItem><SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem><SelectItem value="slate">Slate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
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
          <DialogHeader><DialogTitle>{detailProject?.project_name}</DialogTitle></DialogHeader>
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
}

/* ─── OPERATIONS VIEW ─── */
function OperationsView() {
  const { profile } = useAuth();
  const { projects } = useSolarProjects();
  const businessId = profile?.business_id;
  const [tab, setTab] = useState("inspections");

  const [inspections, setInspections] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [installationOpen, setInstallationOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const [inspForm, setInspForm] = useState({ project_id: "", inspection_date: "", notes: "", roof_condition: "", electrical_panel_status: "" });
  const [instForm, setInstForm] = useState({ project_id: "", scheduled_date: "", installer_team: "" });
  const [matForm, setMatForm] = useState({ project_id: "", material_name: "", quantity: "1", unit_cost: "", supplier: "" });
  const [invForm, setInvForm] = useState({ project_id: "", amount: "", due_date: "", notes: "" });

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const [iR, inR, mR, pR] = await Promise.all([
      supabase.from("site_inspections" as any).select("*, projects(project_name)").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("installations" as any).select("*, projects(project_name)").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("project_materials" as any).select("*, projects(project_name)").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("project_invoices" as any).select("*, projects(project_name)").eq("business_id", businessId).order("created_at", { ascending: false }),
    ]);
    setInspections((iR.data as any[]) || []);
    setInstallations((inR.data as any[]) || []);
    setMaterials((mR.data as any[]) || []);
    setInvoices((pR.data as any[]) || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createInspection = async () => {
    if (!businessId || !inspForm.project_id) return;
    await (supabase.from("site_inspections" as any) as any).insert([{ ...inspForm, business_id: businessId }]);
    toast.success("Inspection scheduled");
    setInspectionOpen(false);
    setInspForm({ project_id: "", inspection_date: "", notes: "", roof_condition: "", electrical_panel_status: "" });
    fetchAll();
  };
  const createInstallation = async () => {
    if (!businessId || !instForm.project_id) return;
    await (supabase.from("installations" as any) as any).insert([{ ...instForm, business_id: businessId }]);
    toast.success("Installation scheduled");
    setInstallationOpen(false);
    setInstForm({ project_id: "", scheduled_date: "", installer_team: "" });
    fetchAll();
  };
  const createMaterial = async () => {
    if (!businessId || !matForm.project_id || !matForm.material_name) return;
    await (supabase.from("project_materials" as any) as any).insert([{
      project_id: matForm.project_id, business_id: businessId,
      material_name: matForm.material_name, quantity: parseInt(matForm.quantity) || 1,
      unit_cost: matForm.unit_cost ? parseFloat(matForm.unit_cost) : null, supplier: matForm.supplier || null,
    }]);
    toast.success("Material added");
    setMaterialOpen(false);
    setMatForm({ project_id: "", material_name: "", quantity: "1", unit_cost: "", supplier: "" });
    fetchAll();
  };
  const createInvoice = async () => {
    if (!businessId || !invForm.project_id || !invForm.amount) return;
    await (supabase.from("project_invoices" as any) as any).insert([{
      project_id: invForm.project_id, business_id: businessId,
      amount: parseFloat(invForm.amount), due_date: invForm.due_date || null, notes: invForm.notes || null,
    }]);
    toast.success("Invoice created");
    setInvoiceOpen(false);
    setInvForm({ project_id: "", amount: "", due_date: "", notes: "" });
    fetchAll();
  };
  const updateStatus = async (table: string, id: string, status: string) => {
    await (supabase.from(table as any) as any).update({ status }).eq("id", id);
    toast.success("Status updated");
    fetchAll();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-success/10 text-success";
      case "in_progress": return "bg-info/10 text-info";
      case "scheduled": return "bg-warning/10 text-warning";
      case "paid": return "bg-success/10 text-success";
      case "partial": return "bg-warning/10 text-warning";
      case "delivered": return "bg-success/10 text-success";
      case "ordered": return "bg-info/10 text-info";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const ProjectSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select project..." /></SelectTrigger>
      <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent>
    </Select>
  );

  if (loading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-1" />Inspections ({inspections.length})</TabsTrigger>
          <TabsTrigger value="installations"><Wrench className="h-4 w-4 mr-1" />Installations ({installations.length})</TabsTrigger>
          <TabsTrigger value="materials"><Package className="h-4 w-4 mr-1" />Materials ({materials.length})</TabsTrigger>
          <TabsTrigger value="invoices"><DollarSign className="h-4 w-4 mr-1" />Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="space-y-4">
          <Button size="sm" onClick={() => setInspectionOpen(true)}><Plus className="h-4 w-4 mr-1" />Schedule Inspection</Button>
          {inspections.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No inspections yet</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {inspections.map((i: any) => (
                <Card key={i.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{i.projects?.project_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.inspection_date ? format(new Date(i.inspection_date), "dd MMM yyyy") : "Date TBD"}
                        {i.roof_condition && ` · Roof: ${i.roof_condition}`}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(i.status)}`}>{i.status}</Badge>
                    <Select value={i.status} onValueChange={v => updateStatus("site_inspections", i.id, v)}>
                      <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="installations" className="space-y-4">
          <Button size="sm" onClick={() => setInstallationOpen(true)}><Plus className="h-4 w-4 mr-1" />Schedule Installation</Button>
          {installations.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No installations yet</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {installations.map((i: any) => (
                <Card key={i.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{i.projects?.project_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.scheduled_date ? format(new Date(i.scheduled_date), "dd MMM yyyy") : "Date TBD"}
                        {i.installer_team && ` · Team: ${i.installer_team}`}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(i.status)}`}>{i.status}</Badge>
                    <Select value={i.status} onValueChange={v => updateStatus("installations", i.id, v)}>
                      <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Button size="sm" onClick={() => setMaterialOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Material</Button>
          {materials.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No materials tracked</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Material</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Cost</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {materials.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{m.projects?.project_name || "—"}</td>
                      <td className="px-4 py-2 font-medium">{m.material_name}</td>
                      <td className="px-4 py-2">{m.quantity}</td>
                      <td className="px-4 py-2 hidden md:table-cell">{m.unit_cost ? `$${m.unit_cost}` : "—"}</td>
                      <td className="px-4 py-2">
                        <Select value={m.status} onValueChange={v => updateStatus("project_materials", m.id, v)}>
                          <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Button size="sm" onClick={() => setInvoiceOpen(true)}><Plus className="h-4 w-4 mr-1" />Create Invoice</Button>
          {invoices.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No invoices yet</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Card key={inv.id} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{inv.projects?.project_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        ${inv.amount?.toLocaleString()} · Due: {inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(inv.status)}`}>{inv.status}</Badge>
                    <Select value={inv.status} onValueChange={v => updateStatus("project_invoices", inv.id, v)}>
                      <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Site Inspection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project *</Label><ProjectSelect value={inspForm.project_id} onChange={v => setInspForm(f => ({ ...f, project_id: v }))} /></div>
            <div><Label>Date</Label><Input type="date" value={inspForm.inspection_date} onChange={e => setInspForm(f => ({ ...f, inspection_date: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Roof Condition</Label><Input value={inspForm.roof_condition} onChange={e => setInspForm(f => ({ ...f, roof_condition: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Electrical Panel</Label><Input value={inspForm.electrical_panel_status} onChange={e => setInspForm(f => ({ ...f, electrical_panel_status: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={inspForm.notes} onChange={e => setInspForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectionOpen(false)}>Cancel</Button>
            <Button onClick={createInspection} disabled={!inspForm.project_id}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={installationOpen} onOpenChange={setInstallationOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Installation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project *</Label><ProjectSelect value={instForm.project_id} onChange={v => setInstForm(f => ({ ...f, project_id: v }))} /></div>
            <div><Label>Scheduled Date</Label><Input type="date" value={instForm.scheduled_date} onChange={e => setInstForm(f => ({ ...f, scheduled_date: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Installer Team</Label><Input value={instForm.installer_team} onChange={e => setInstForm(f => ({ ...f, installer_team: e.target.value }))} className="rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallationOpen(false)}>Cancel</Button>
            <Button onClick={createInstallation} disabled={!instForm.project_id}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={materialOpen} onOpenChange={setMaterialOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project *</Label><ProjectSelect value={matForm.project_id} onChange={v => setMatForm(f => ({ ...f, project_id: v }))} /></div>
            <div><Label>Material Name *</Label><Input value={matForm.material_name} onChange={e => setMatForm(f => ({ ...f, material_name: e.target.value }))} className="rounded-xl" placeholder="e.g., Solar Panels x10" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Quantity</Label><Input type="number" value={matForm.quantity} onChange={e => setMatForm(f => ({ ...f, quantity: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Unit Cost ($)</Label><Input type="number" value={matForm.unit_cost} onChange={e => setMatForm(f => ({ ...f, unit_cost: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Supplier</Label><Input value={matForm.supplier} onChange={e => setMatForm(f => ({ ...f, supplier: e.target.value }))} className="rounded-xl" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialOpen(false)}>Cancel</Button>
            <Button onClick={createMaterial} disabled={!matForm.project_id || !matForm.material_name}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project *</Label><ProjectSelect value={invForm.project_id} onChange={v => setInvForm(f => ({ ...f, project_id: v }))} /></div>
            <div><Label>Amount ($) *</Label><Input type="number" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Due Date</Label><Input type="date" value={invForm.due_date} onChange={e => setInvForm(f => ({ ...f, due_date: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Notes</Label><Textarea value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
            <Button onClick={createInvoice} disabled={!invForm.project_id || !invForm.amount}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── DASHBOARD VIEW ─── */
function DashboardView() {
  const { projects, projectsByStage, loading } = useSolarProjects();

  const activeProjects = projects.filter(p => p.pipeline_stage !== "handover_completed");
  const completedProjects = projects.filter(p => p.pipeline_stage === "handover_completed");
  const totalRevenue = completedProjects.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const totalKw = projects.reduce((s, p) => s + (p.system_size_kw || 0), 0);
  const completedKw = completedProjects.reduce((s, p) => s + (p.system_size_kw || 0), 0);
  const highPriority = projects.filter(p => p.priority === "high" || p.priority === "urgent").length;

  const stageChart = PIPELINE_STAGES.map(s => ({
    short: s.label.split(" ").slice(0, 2).join(" "),
    count: projectsByStage[s.key]?.length || 0,
  }));

  const priorityChart = [
    { name: "Urgent", value: projects.filter(p => p.priority === "urgent").length },
    { name: "High", value: projects.filter(p => p.priority === "high").length },
    { name: "Medium", value: projects.filter(p => p.priority === "medium").length },
    { name: "Low", value: projects.filter(p => p.priority === "low").length },
  ].filter(p => p.value > 0);

  if (loading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Projects" value={projects.length} icon={Sun} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeProjects.length} icon={Clock} gradient="from-neon-blue to-info" />
        <StatCard label="Completed" value={completedProjects.length} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="High Priority" value={highPriority} icon={AlertTriangle} gradient="from-warning to-neon-orange" />
        <StatCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} icon={DollarSign} gradient="from-success to-neon-green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageChart}>
                <XAxis dataKey="short" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Priority Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {priorityChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={priorityChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {priorityChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No projects yet</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <Zap className="h-8 w-8 mx-auto text-warning mb-2" />
            <p className="text-3xl font-bold">{totalKw.toFixed(1)} kW</p>
            <p className="text-xs text-muted-foreground">Total System Capacity</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-3xl font-bold">{completedKw.toFixed(1)} kW</p>
            <p className="text-xs text-muted-foreground">Installed Capacity</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-neon-green mb-2" />
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue from Completed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
