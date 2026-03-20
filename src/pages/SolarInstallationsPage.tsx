import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSolarProjects } from "@/hooks/useSolarProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus, Camera, ClipboardCheck, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SolarInstallationsPage() {
  const { profile } = useAuth();
  const { projects } = useSolarProjects();
  const businessId = profile?.business_id;
  const [tab, setTab] = useState("inspections");

  // Inspections state
  const [inspections, setInspections] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [installationOpen, setInstallationOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  // Forms
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
      <SelectContent>
        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Installations & Operations" subtitle="Manage inspections, installations, materials & invoicing" icon={Wrench} />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Installations & Operations" subtitle="Inspections, installations, materials & invoicing" icon={Wrench} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-1" />Inspections ({inspections.length})</TabsTrigger>
          <TabsTrigger value="installations"><Wrench className="h-4 w-4 mr-1" />Installations ({installations.length})</TabsTrigger>
          <TabsTrigger value="materials"><Package className="h-4 w-4 mr-1" />Materials ({materials.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        {/* INSPECTIONS */}
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
                      <p className="font-medium text-sm">{(i as any).projects?.project_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.inspection_date ? format(new Date(i.inspection_date), "dd MMM yyyy") : "Date TBD"}
                        {i.roof_condition && ` · Roof: ${i.roof_condition}`}
                        {i.electrical_panel_status && ` · Panel: ${i.electrical_panel_status}`}
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

        {/* INSTALLATIONS */}
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
                      <p className="font-medium text-sm">{(i as any).projects?.project_name || "—"}</p>
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

        {/* MATERIALS */}
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
                      <td className="px-4 py-2">{(m as any).projects?.project_name || "—"}</td>
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

        {/* INVOICES */}
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
                      <p className="font-medium text-sm">{(inv as any).projects?.project_name || "—"}</p>
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

      {/* DIALOGS */}
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
          <DialogHeader><DialogTitle>Create Project Invoice</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Project *</Label><ProjectSelect value={invForm.project_id} onChange={v => setInvForm(f => ({ ...f, project_id: v }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($) *</Label><Input type="number" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>Due Date</Label><Input type="date" value={invForm.due_date} onChange={e => setInvForm(f => ({ ...f, due_date: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
            <Button onClick={createInvoice} disabled={!invForm.project_id || !invForm.amount}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
