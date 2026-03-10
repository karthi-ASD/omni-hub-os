import { useState } from "react";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Globe, TrendingUp, Search, Users, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ONBOARDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PAUSED: "bg-muted text-muted-foreground",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const SeoOperationsPage = () => {
  const { projects, loading, create } = useSeoProjects();
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

  const active = projects.filter(p => p.project_status === "ACTIVE").length;
  const onboarding = projects.filter(p => p.project_status === "ONBOARDING").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">SEO Operations</h1>
          <p className="text-muted-foreground">Manage client SEO projects, tasks, rankings & content</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New SEO Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create SEO Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Project Name *</Label><Input value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="SEO for Client X" /></div>
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
                  <SelectContent>
                    {["basic", "standard", "premium", "enterprise"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle><FolderKanban className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{projects.length}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{active}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Onboarding</CardTitle><Search className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{onboarding}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{new Set(projects.filter(p => p.client_id).map(p => p.client_id)).size}</p></CardContent></Card>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : projects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No SEO projects yet. Create one to get started.</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/seo-ops/${p.id}`)}>
                  <TableCell className="font-medium">{p.project_name}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Globe className="h-3 w-3 text-muted-foreground" />{p.website_domain}</div></TableCell>
                  <TableCell>{getClientName(p.client_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{p.service_package}</Badge></TableCell>
                  <TableCell>{p.target_location || "—"}</TableCell>
                  <TableCell><Badge className={statusColors[p.project_status] || ""} variant="secondary">{p.project_status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default SeoOperationsPage;
