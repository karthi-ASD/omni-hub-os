import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdminControl, BusinessAdminRecord } from "@/hooks/useSuperAdminControl";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2, Users, Smartphone, Shield, Eye, Pencil,
  CheckCircle, Ban, KeyRound, BarChart3, Globe, Monitor,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

const SuperAdminBusinessManagementPage = () => {
  const { isSuperAdmin } = useAuth();
  const { records, health, loading, updateBusinessAccess, updateBusinessStatus } = useSuperAdminControl();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [crmFilter, setCrmFilter] = useState("all");
  const [mobileFilter, setMobileFilter] = useState("all");

  const [selectedBiz, setSelectedBiz] = useState<BusinessAdminRecord | null>(null);
  const [editBiz, setEditBiz] = useState<BusinessAdminRecord | null>(null);
  const [subDuration, setSubDuration] = useState("3");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.business_name.toLowerCase().includes(q) && !r.admin_name.toLowerCase().includes(q) && !r.admin_email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all" && r.business_status !== statusFilter) return false;
      if (crmFilter !== "all" && r.crm_access_status !== crmFilter) return false;
      if (mobileFilter !== "all" && r.mobile_access_status !== mobileFilter) return false;
      return true;
    });
  }, [records, search, statusFilter, crmFilter, mobileFilter]);

  const handleToggleCRM = async (biz: BusinessAdminRecord) => {
    const next = biz.crm_access_status === "active" ? "disabled" : "active";
    await updateBusinessAccess(biz.business_id, { crm_access_status: next });
    toast.success(`CRM access ${next}`);
  };

  const handleToggleMobile = async (biz: BusinessAdminRecord) => {
    const next = biz.mobile_access_status === "active" ? "disabled" : "active";
    await updateBusinessAccess(biz.business_id, { mobile_access_status: next });
    toast.success(`Mobile access ${next}`);
  };

  const handleSetSubscription = async () => {
    if (!editBiz) return;
    setSaving(true);
    const months = parseInt(subDuration);
    const start = new Date().toISOString();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    await updateBusinessAccess(editBiz.business_id, {
      mobile_access_status: "active",
      mobile_subscription_start: start,
      mobile_subscription_expiry: expiry.toISOString(),
    });
    toast.success(`Subscription set for ${months} months`);
    setSaving(false);
    setEditBiz(null);
  };

  const handleToggleStatus = async (biz: BusinessAdminRecord) => {
    const next = biz.business_status === "active" ? "suspended" : "active";
    await updateBusinessStatus(biz.business_id, next);
    toast.success(`Account ${next}`);
  };

  if (!isSuperAdmin) return <p className="text-muted-foreground p-6">Access denied – Super Admin only</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Business Admin Management" subtitle="Manage all business accounts, access controls & subscriptions" icon={Building2} />

      {/* System Health */}
      <Tabs defaultValue="management">
        <TabsList>
          <TabsTrigger value="management">Business Admins</TabsTrigger>
          <TabsTrigger value="health">Platform Health</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="Total Businesses" value={health.total_businesses} icon={Building2} />
            <StatCard title="Total Employees" value={health.total_employees} icon={Users} />
            <StatCard title="Total Clients" value={health.total_clients} icon={Globe} />
            <StatCard title="Mobile Downloads" value={health.total_mobile_downloads} icon={Smartphone} />
            <StatCard title="CRM Active" value={health.total_crm_active} icon={Monitor} />
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4 mt-4">
          {/* Filters */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="flex flex-wrap gap-3 py-4">
              <Input placeholder="Search name, email, company..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={crmFilter} onValueChange={setCrmFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="CRM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CRM</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={mobileFilter} onValueChange={setMobileFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Mobile" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mobile</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CRM</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Sub. Expiry</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.business_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.admin_name}</p>
                            <p className="text-xs text-muted-foreground">{r.admin_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{r.business_name}</TableCell>
                        <TableCell>
                          <Badge variant={r.business_status === "active" ? "default" : "destructive"} className="capitalize text-xs">{r.business_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.crm_access_status === "active" ? "default" : "secondary"} className="capitalize text-xs">{r.crm_access_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.mobile_access_status === "active" ? "default" : "secondary"} className="capitalize text-xs">{r.mobile_access_status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.mobile_subscription_expiry ? new Date(r.mobile_subscription_expiry).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedBiz(r)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleCRM(r)} title="Toggle CRM"><Monitor className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditBiz(r); setSubDuration("3"); }} title="Manage Subscription"><Smartphone className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(r)} title={r.business_status === "active" ? "Suspend" : "Activate"}>
                              {r.business_status === "active" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No businesses found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* View Stats Dialog */}
      <Dialog open={!!selectedBiz} onOpenChange={open => !open && setSelectedBiz(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedBiz?.business_name} – Overview</DialogTitle></DialogHeader>
          {selectedBiz && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Departments" value={selectedBiz.total_departments} icon={Building2} />
                <StatCard title="Employees" value={selectedBiz.total_employees} icon={Users} />
                <StatCard title="Clients" value={selectedBiz.total_clients} icon={Globe} />
                <StatCard title="App Downloads" value={selectedBiz.mobile_app_downloads} icon={Smartphone} />
              </div>
              {selectedBiz.department_breakdown.length > 0 && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-sm">Department Breakdown</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Department</TableHead><TableHead className="text-right">Employees</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {selectedBiz.department_breakdown.map(d => (
                          <TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className="text-right">{d.employee_count}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Admin: {selectedBiz.admin_name} ({selectedBiz.admin_email})</p>
                <p>Created: {new Date(selectedBiz.created_at).toLocaleDateString()}</p>
                <p>CRM: {selectedBiz.crm_access_status} | Mobile: {selectedBiz.mobile_access_status}</p>
                {selectedBiz.mobile_subscription_expiry && <p>Mobile Expiry: {new Date(selectedBiz.mobile_subscription_expiry).toLocaleDateString()}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={!!editBiz} onOpenChange={open => !open && setEditBiz(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Mobile Subscription – {editBiz?.business_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subscription Duration</Label>
              <Select value={subDuration} onValueChange={setSubDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditBiz(null)}>Cancel</Button>
              <Button onClick={handleSetSubscription} disabled={saving}>{saving ? "Saving..." : "Set Subscription"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminBusinessManagementPage;
