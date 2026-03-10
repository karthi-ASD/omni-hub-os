import { useClientProjects } from "@/hooks/useClientProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SERVICE_TYPES = [
  { value: "seo", label: "SEO" },
  { value: "google_ads", label: "Google Ads" },
  { value: "website_development", label: "Website Development" },
  { value: "website_maintenance", label: "Website Maintenance" },
  { value: "social_media", label: "Social Media Marketing" },
  { value: "branding", label: "Branding" },
  { value: "video_marketing", label: "Video Marketing" },
  { value: "content_marketing", label: "Content Marketing" },
];

const STATUS_OPTIONS = ["onboarding", "in_progress", "on_hold", "completed", "cancelled"];

const ClientProjectsPage = () => {
  const { projects, departments, loading, create, update } = useClientProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: "", company_name: "", service_type: "seo", start_date: "",
    contract_duration_months: "", description: "", assigned_department_id: "",
  });
  const [filter, setFilter] = useState("");

  const handleCreate = async () => {
    if (!form.client_name) { toast.error("Client name required"); return; }
    await create({
      ...form,
      contract_duration_months: form.contract_duration_months ? parseInt(form.contract_duration_months) : null,
      assigned_department_id: form.assigned_department_id || null,
    });
    toast.success("Project created");
    setOpen(false);
    setForm({ client_name: "", company_name: "", service_type: "seo", start_date: "", contract_duration_months: "", description: "", assigned_department_id: "" });
  };

  const statusColor = (s: string) => {
    switch (s) { case "completed": return "default"; case "in_progress": return "secondary"; case "cancelled": return "destructive"; default: return "outline"; }
  };

  const filtered = filter ? projects.filter(p => p.service_type === filter) : projects;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Projects</h1>
          <p className="text-muted-foreground">Manage all client engagements and service deliverables</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Client Project</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div><Label>Client Name *</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
              <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
              <div><Label>Service Type</Label>
                <Select value={form.service_type} onValueChange={v => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Department</Label>
                <Select value={form.assigned_department_id} onValueChange={v => setForm({ ...form, assigned_department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Auto-assign from service type" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Duration (months)</Label><Input type="number" value={form.contract_duration_months} onChange={e => setForm({ ...form, contract_duration_months: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full">Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filter === "" ? "default" : "outline"} onClick={() => setFilter("")}>All ({projects.length})</Button>
        {SERVICE_TYPES.map(s => {
          const count = projects.filter(p => p.service_type === s.value).length;
          return count > 0 ? <Button key={s.value} size="sm" variant={filter === s.value ? "default" : "outline"} onClick={() => setFilter(s.value)}>{s.label} ({count})</Button> : null;
        })}
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead>Service</TableHead>
            <TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Start</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No projects found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.client_name}</TableCell>
                <TableCell>{p.company_name || "—"}</TableCell>
                <TableCell>{SERVICE_TYPES.find(s => s.value === p.service_type)?.label || p.service_type}</TableCell>
                <TableCell>{p.departments?.name || "—"}</TableCell>
                <TableCell>
                  <Select value={p.status} onValueChange={v => { update(p.id, { status: v }); toast.success("Updated"); }}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{p.start_date || "—"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/task-pipeline?project=${p.id}`)}><Eye className="h-4 w-4 mr-1" /> Tasks</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default ClientProjectsPage;
