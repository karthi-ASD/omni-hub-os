import { useState } from "react";
import { useSeoCampaigns } from "@/hooks/useSeo";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Globe, Search, TrendingUp, FileText, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  onboarding: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
  on_hold: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const SeoDashboardPage = () => {
  const { campaigns, loading, createCampaign, updateStatus } = useSeoCampaigns();
  const { clients } = useClients();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", project_id: "", primary_domain: "", business_name: "",
    package_type: "basic", monthly_fee: "", contract_duration_months: "12",
    billing_type: "recurring", service_areas: "", target_services: "",
  });

  const handleCreate = async () => {
    if (!form.primary_domain) return;
    await createCampaign({
      client_id: form.client_id || undefined,
      project_id: form.project_id || undefined,
      primary_domain: form.primary_domain,
      service_areas: form.service_areas ? form.service_areas.split(",").map((s) => s.trim()) : [],
      target_services: form.target_services ? form.target_services.split(",").map((s) => s.trim()) : [],
    });
    setOpen(false);
    setForm({ client_id: "", project_id: "", primary_domain: "", business_name: "", package_type: "basic", monthly_fee: "", contract_duration_months: "12", billing_type: "recurring", service_areas: "", target_services: "" });
  };

  const getClientName = (id: string | null) => {
    if (!id) return "—";
    return clients.find((c) => c.id === id)?.contact_name || "Unknown";
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const onboardingCampaigns = campaigns.filter((c) => c.status === "onboarding").length;
  const totalRevenue = (campaigns as any[]).reduce((sum, c) => sum + (Number(c.monthly_fee) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SEO Operations"
        subtitle="Manage SEO campaigns, keywords, rankings & content"
        icon={Globe}
        actions={[{ label: "New Campaign", icon: Plus, onClick: () => setOpen(true) }]}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={Globe} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeCampaigns} icon={TrendingUp} gradient="from-success to-emerald-500" />
        <StatCard label="Onboarding" value={onboardingCampaigns} icon={Search} gradient="from-warning to-orange-500" />
        <StatCard label="Completed" value={campaigns.filter((c) => c.status === "completed").length} icon={FileText} gradient="from-primary to-violet-500" />
        <StatCard label="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} gradient="from-success to-teal-500" />
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No SEO campaigns yet. Create one to get started.</CardContent></Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Fee/mo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c: any) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/seo/${c.id}`)}>
                  <TableCell className="font-medium">{c.primary_domain || "—"}</TableCell>
                  <TableCell>{getClientName(c.client_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{c.package_type || "basic"}</Badge></TableCell>
                  <TableCell>${Number(c.monthly_fee || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColors[c.status] || ""} variant="secondary">{c.status}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{c.payment_status || "pending"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {c.status === "onboarding" && <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "active")}>Activate</Button>}
                      {c.status === "active" && <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "paused")}>Pause</Button>}
                      {c.status === "paused" && <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, "active")}>Resume</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create SEO Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Primary Domain *</Label><Input value={form.primary_domain} onChange={(e) => setForm({ ...form, primary_domain: e.target.value })} placeholder="example.com.au" /></div>
            <div><Label>Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
            <div><Label>Client</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Package Type</Label>
                <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["basic", "standard", "premium", "custom"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Monthly Fee</Label><Input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} /></div>
            </div>
            <div><Label>Service Areas (comma-separated)</Label><Input value={form.service_areas} onChange={(e) => setForm({ ...form, service_areas: e.target.value })} placeholder="Sydney, Melbourne" /></div>
            <div><Label>Target Services (comma-separated)</Label><Input value={form.target_services} onChange={(e) => setForm({ ...form, target_services: e.target.value })} /></div>
            <Button onClick={handleCreate} className="w-full">Create Campaign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeoDashboardPage;
