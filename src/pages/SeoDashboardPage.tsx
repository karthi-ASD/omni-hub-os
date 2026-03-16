import { useState } from "react";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useClients } from "@/hooks/useClients";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Globe, Search, TrendingUp, FileText, DollarSign, Users, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  ACTIVE: "bg-success/10 text-success",
  onboarding: "bg-warning/10 text-warning",
  ONBOARDING: "bg-warning/10 text-warning",
  paused: "bg-muted text-muted-foreground",
  PAUSED: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
  COMPLETED: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const SeoDashboardPage = () => {
  const { projects, loading, create, updateProject } = useSeoProjects();
  const { clients } = useClients();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", website_domain: "", project_name: "", target_location: "",
    primary_keyword: "", service_package: "basic", contract_start: "", contract_end: "",
  });

  const handleCreate = async () => {
    if (!form.website_domain || !form.project_name) return;
    await create({
      client_id: form.client_id || undefined,
      website_domain: form.website_domain,
      project_name: form.project_name,
      target_location: form.target_location || undefined,
      primary_keyword: form.primary_keyword || undefined,
      service_package: form.service_package,
      contract_start: form.contract_start || undefined,
      contract_end: form.contract_end || undefined,
    });
    setOpen(false);
    setForm({ client_id: "", website_domain: "", project_name: "", target_location: "", primary_keyword: "", service_package: "basic", contract_start: "", contract_end: "" });
  };

  const getClientName = (id: string | null) => {
    if (!id) return "—";
    return clients.find(c => c.id === id)?.contact_name || "Unknown";
  };

  const active = projects.filter(p => ["active", "ACTIVE"].includes(p.project_status)).length;
  const onboarding = projects.filter(p => ["onboarding", "ONBOARDING"].includes(p.project_status)).length;
  const totalRevenue = projects.reduce((sum, p: any) => sum + (Number(p.monthly_fee) || 0), 0);
  const uniqueClients = new Set(projects.filter(p => p.client_id).map(p => p.client_id)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SEO Dashboard"
        subtitle="Unified SEO project management, keywords, rankings & content"
        icon={Globe}
        actions={[{ label: "New SEO Project", icon: Plus, onClick: () => setOpen(true) }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon={FolderKanban} gradient="from-primary to-accent" />
        <StatCard label="Active" value={active} icon={TrendingUp} gradient="from-success to-emerald-500" />
        <StatCard label="Onboarding" value={onboarding} icon={Search} gradient="from-warning to-orange-500" />
        <StatCard label="SEO Clients" value={uniqueClients} icon={Users} gradient="from-violet-500 to-purple-500" />
        <StatCard label="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} gradient="from-success to-teal-500" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : projects.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No SEO projects yet. Create one to get started.</CardContent></Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/seo/${p.id}`)}>
                  <TableCell className="font-medium">{p.project_name}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Globe className="h-3 w-3 text-muted-foreground" />{p.website_domain}</div></TableCell>
                  <TableCell>{getClientName(p.client_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.service_package}</Badge></TableCell>
                  <TableCell>{p.target_location || "—"}</TableCell>
                  <TableCell><Badge className={statusColors[p.project_status] || ""} variant="secondary">{p.project_status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {["onboarding", "ONBOARDING"].includes(p.project_status) && (
                        <Button size="sm" variant="outline" onClick={() => updateProject(p.id, { project_status: "active" })}>Activate</Button>
                      )}
                      {["active", "ACTIVE"].includes(p.project_status) && (
                        <Button size="sm" variant="outline" onClick={() => updateProject(p.id, { project_status: "paused" })}>Pause</Button>
                      )}
                      {["paused", "PAUSED"].includes(p.project_status) && (
                        <Button size="sm" variant="outline" onClick={() => updateProject(p.id, { project_status: "active" })}>Resume</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create SEO Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="Client Name – SEO Campaign" /></div>
            <div><Label>Website Domain *</Label><Input value={form.website_domain} onChange={e => setForm({ ...form, website_domain: e.target.value })} placeholder="example.com.au" /></div>
            <div><Label>Client</Label>
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Target Location</Label><Input value={form.target_location} onChange={e => setForm({ ...form, target_location: e.target.value })} placeholder="Sydney, NSW" /></div>
            <div><Label>Primary Keyword</Label><Input value={form.primary_keyword} onChange={e => setForm({ ...form, primary_keyword: e.target.value })} /></div>
            <div><Label>Service Package</Label>
              <Select value={form.service_package} onValueChange={v => setForm({ ...form, service_package: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["basic", "standard", "premium", "enterprise"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contract Start</Label><Input type="date" value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} /></div>
              <div><Label>Contract End</Label><Input type="date" value={form.contract_end} onChange={e => setForm({ ...form, contract_end: e.target.value })} /></div>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeoDashboardPage;
