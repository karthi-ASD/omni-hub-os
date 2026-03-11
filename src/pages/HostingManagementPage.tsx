import { useState } from "react";
import { useHosting, CreateHostingInput } from "@/hooks/useHosting";
import { useWebsites } from "@/hooks/useWebsites";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Server, Plus, Shield, AlertTriangle, CheckCircle, Clock, Trash2, Pencil, HardDrive } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

function getDateStatus(date: string | null, label: string): { text: string; className: string } {
  if (!date) return { text: "Unknown", className: "bg-muted text-muted-foreground" };
  const days = differenceInDays(parseISO(date), new Date());
  if (days < 0) return { text: `${label} expired`, className: "bg-destructive/10 text-destructive" };
  if (days <= 7) return { text: `${days}d left`, className: "bg-destructive/10 text-destructive" };
  if (days <= 30) return { text: `${days}d left`, className: "bg-amber-500/10 text-amber-600" };
  return { text: `${days}d left`, className: "bg-emerald-500/10 text-emerald-600" };
}

const sslStatusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-destructive/10 text-destructive",
  pending: "bg-amber-500/10 text-amber-600",
  unknown: "bg-muted text-muted-foreground",
};

const backupStatusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  failed: "bg-destructive/10 text-destructive",
  disabled: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
};

const emptyForm: CreateHostingInput = {
  hosting_provider: "",
  hosting_plan: "",
  control_panel_type: "",
  server_location: "",
  ssl_status: "unknown",
  ssl_expiry_date: "",
  backup_status: "unknown",
  renewal_date: "",
  linked_website_id: "",
  client_id: "",
  notes: "",
};

const HostingManagementPage = () => {
  const { hostingAccounts, loading, createHosting, updateHosting, deleteHosting } = useHosting();
  const { websites } = useWebsites();
  const { clients } = useClients();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateHostingInput>({ ...emptyForm });

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setFormOpen(true); };

  const openEdit = (h: any) => {
    setEditId(h.id);
    setForm({
      hosting_provider: h.hosting_provider,
      hosting_plan: h.hosting_plan || "",
      control_panel_type: h.control_panel_type || "",
      server_location: h.server_location || "",
      ssl_status: h.ssl_status || "unknown",
      ssl_expiry_date: h.ssl_expiry_date || "",
      backup_status: h.backup_status || "unknown",
      renewal_date: h.renewal_date || "",
      linked_website_id: h.linked_website_id || "",
      client_id: h.client_id || "",
      notes: h.notes || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.hosting_provider) return;
    const payload = {
      ...form,
      linked_website_id: form.linked_website_id || undefined,
      client_id: form.client_id || undefined,
    };
    if (editId) await updateHosting(editId, payload);
    else await createHosting(payload);
    setFormOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" /> Hosting Management
        </h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add Hosting
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 shrink-0">
          <span className="text-lg font-bold text-primary">{hostingAccounts.length}</span>
          <span className="text-xs text-primary font-medium">Total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 shrink-0">
          <span className="text-lg font-bold text-emerald-600">
            {hostingAccounts.filter(h => h.ssl_status === "active").length}
          </span>
          <span className="text-xs text-emerald-600 font-medium">SSL Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 shrink-0">
          <span className="text-lg font-bold text-destructive">
            {hostingAccounts.filter(h => h.backup_status === "failed").length}
          </span>
          <span className="text-xs text-destructive font-medium">Backup Issues</span>
        </div>
      </div>

      {/* Hosting list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : hostingAccounts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No hosting accounts yet.</div>
      ) : (
        <div className="space-y-2">
          {hostingAccounts.map(h => {
            const sslDate = getDateStatus(h.ssl_expiry_date, "SSL");
            const renewalDate = getDateStatus(h.renewal_date, "Hosting");
            const linkedWebsite = websites.find(w => w.id === h.linked_website_id);
            const linkedClient = clients.find(c => c.id === h.client_id);

            return (
              <Card key={h.id} className="rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm">{h.hosting_provider}</p>
                        {h.hosting_plan && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{h.hosting_plan}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-[10px] px-1.5 py-0 ${sslStatusColors[h.ssl_status] || sslStatusColors.unknown}`}>
                          <Shield className="h-3 w-3 mr-0.5" /> SSL: {h.ssl_status}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 ${backupStatusColors[h.backup_status] || backupStatusColors.unknown}`}>
                          <HardDrive className="h-3 w-3 mr-0.5" /> Backup: {h.backup_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                        {h.control_panel_type && <p>Panel: <span className="text-foreground">{h.control_panel_type}</span></p>}
                        {h.server_location && <p>Location: <span className="text-foreground">{h.server_location}</span></p>}
                        {h.ssl_expiry_date && (
                          <p>SSL Expires: <span className={differenceInDays(parseISO(h.ssl_expiry_date), new Date()) <= 30 ? "text-destructive font-medium" : "text-foreground"}>
                            {format(parseISO(h.ssl_expiry_date), "dd MMM yyyy")}
                          </span></p>
                        )}
                        {h.renewal_date && (
                          <p>Renewal: <span className={differenceInDays(parseISO(h.renewal_date), new Date()) <= 30 ? "text-destructive font-medium" : "text-foreground"}>
                            {format(parseISO(h.renewal_date), "dd MMM yyyy")}
                          </span></p>
                        )}
                        {linkedWebsite && <p>Website: <span className="text-foreground">{linkedWebsite.website_name}</span></p>}
                        {linkedClient && <p>Client: <span className="text-foreground">{linkedClient.contact_name}</span></p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(h)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteHosting(h.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Hosting" : "Add Hosting Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hosting Provider *</Label>
                <Input value={form.hosting_provider} onChange={e => setForm(f => ({ ...f, hosting_provider: e.target.value }))} placeholder="AWS, SiteGround..." />
              </div>
              <div>
                <Label>Hosting Plan</Label>
                <Input value={form.hosting_plan} onChange={e => setForm(f => ({ ...f, hosting_plan: e.target.value }))} placeholder="Shared, VPS, Dedicated..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Control Panel</Label>
                <Input value={form.control_panel_type} onChange={e => setForm(f => ({ ...f, control_panel_type: e.target.value }))} placeholder="cPanel, Plesk, Custom..." />
              </div>
              <div>
                <Label>Server Location</Label>
                <Input value={form.server_location} onChange={e => setForm(f => ({ ...f, server_location: e.target.value }))} placeholder="Sydney, US-East..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SSL Status</Label>
                <Select value={form.ssl_status || "unknown"} onValueChange={v => setForm(f => ({ ...f, ssl_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SSL Expiry Date</Label>
                <Input type="date" value={form.ssl_expiry_date} onChange={e => setForm(f => ({ ...f, ssl_expiry_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Backup Status</Label>
                <Select value={form.backup_status || "unknown"} onValueChange={v => setForm(f => ({ ...f, backup_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Linked Website</Label>
                <Select value={form.linked_website_id || "none"} onValueChange={v => setForm(f => ({ ...f, linked_website_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select website" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {websites.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.website_name} ({w.domain})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client</Label>
                <Select value={form.client_id || "none"} onValueChange={v => setForm(f => ({ ...f, client_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editId ? "Update Hosting" : "Add Hosting Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostingManagementPage;
