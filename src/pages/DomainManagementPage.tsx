import { useState } from "react";
import { useDomains, CreateDomainInput } from "@/hooks/useDomains";
import { useWebsites } from "@/hooks/useWebsites";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Plus, AlertTriangle, CheckCircle, Clock, Trash2, Pencil } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

function getExpiryStatus(expiryDate: string | null): { label: string; className: string; icon: typeof CheckCircle } {
  if (!expiryDate) return { label: "Unknown", className: "bg-muted text-muted-foreground", icon: Clock };
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return { label: "Expired", className: "bg-destructive/10 text-destructive", icon: AlertTriangle };
  if (days <= 7) return { label: `${days}d left`, className: "bg-destructive/10 text-destructive", icon: AlertTriangle };
  if (days <= 30) return { label: `${days}d left`, className: "bg-amber-500/10 text-amber-600", icon: AlertTriangle };
  return { label: `${days}d left`, className: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle };
}

const emptyForm: CreateDomainInput = {
  domain_name: "",
  registrar_name: "",
  registrar_account_reference: "",
  registration_date: "",
  expiry_date: "",
  auto_renew_status: false,
  dns_provider: "",
  nameservers: [],
  linked_website_id: "",
  client_id: "",
  notes: "",
};

const DomainManagementPage = () => {
  const { domains, loading, createDomain, updateDomain, deleteDomain } = useDomains();
  const { websites } = useWebsites();
  const { clients } = useClients();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDomainInput>({ ...emptyForm });
  const [nsInput, setNsInput] = useState("");

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setNsInput("");
    setFormOpen(true);
  };

  const openEdit = (d: any) => {
    setEditId(d.id);
    setForm({
      domain_name: d.domain_name,
      registrar_name: d.registrar_name || "",
      registrar_account_reference: d.registrar_account_reference || "",
      registration_date: d.registration_date || "",
      expiry_date: d.expiry_date || "",
      auto_renew_status: d.auto_renew_status || false,
      dns_provider: d.dns_provider || "",
      nameservers: d.nameservers || [],
      linked_website_id: d.linked_website_id || "",
      client_id: d.client_id || "",
      notes: d.notes || "",
    });
    setNsInput((d.nameservers || []).join(", "));
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.domain_name) return;
    const payload = {
      ...form,
      nameservers: nsInput ? nsInput.split(",").map(s => s.trim()).filter(Boolean) : [],
      linked_website_id: form.linked_website_id || undefined,
      client_id: form.client_id || undefined,
    };
    if (editId) {
      await updateDomain(editId, payload);
    } else {
      await createDomain(payload);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" /> Domain Management
        </h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add Domain
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 shrink-0">
          <span className="text-lg font-bold text-primary">{domains.length}</span>
          <span className="text-xs text-primary font-medium">Total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 shrink-0">
          <span className="text-lg font-bold text-destructive">
            {domains.filter(d => d.expiry_date && differenceInDays(parseISO(d.expiry_date), new Date()) <= 30).length}
          </span>
          <span className="text-xs text-destructive font-medium">Expiring Soon</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 shrink-0">
          <span className="text-lg font-bold text-emerald-600">
            {domains.filter(d => d.auto_renew_status).length}
          </span>
          <span className="text-xs text-emerald-600 font-medium">Auto-Renew</span>
        </div>
      </div>

      {/* Domain list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : domains.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No domains registered yet.</div>
      ) : (
        <div className="space-y-2">
          {domains.map(d => {
            const status = getExpiryStatus(d.expiry_date);
            const StatusIcon = status.icon;
            const linkedWebsite = websites.find(w => w.id === d.linked_website_id);
            const linkedClient = clients.find(c => c.id === d.client_id);

            return (
              <Card key={d.id} className="rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{d.domain_name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                          <StatusIcon className="h-3 w-3 mr-0.5" />
                          {status.label}
                        </Badge>
                        {d.auto_renew_status && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Auto-Renew</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                        {d.registrar_name && <p>Registrar: <span className="text-foreground">{d.registrar_name}</span></p>}
                        {d.dns_provider && <p>DNS: <span className="text-foreground">{d.dns_provider}</span></p>}
                        {d.expiry_date && <p>Expires: <span className="text-foreground">{format(parseISO(d.expiry_date), "dd MMM yyyy")}</span></p>}
                        {linkedWebsite && <p>Website: <span className="text-foreground">{linkedWebsite.website_name}</span></p>}
                        {linkedClient && <p>Client: <span className="text-foreground">{linkedClient.contact_name}</span></p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDomain(d.id)}>
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
            <DialogTitle>{editId ? "Edit Domain" : "Add Domain"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Domain Name *</Label>
              <Input value={form.domain_name} onChange={e => setForm(f => ({ ...f, domain_name: e.target.value }))} placeholder="example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Registrar</Label>
                <Input value={form.registrar_name} onChange={e => setForm(f => ({ ...f, registrar_name: e.target.value }))} placeholder="GoDaddy, Namecheap..." />
              </div>
              <div>
                <Label>Account Reference</Label>
                <Input value={form.registrar_account_reference} onChange={e => setForm(f => ({ ...f, registrar_account_reference: e.target.value }))} placeholder="Account ID or email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Registration Date</Label>
                <Input type="date" value={form.registration_date} onChange={e => setForm(f => ({ ...f, registration_date: e.target.value }))} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>DNS Provider</Label>
                <Input value={form.dns_provider} onChange={e => setForm(f => ({ ...f, dns_provider: e.target.value }))} placeholder="Cloudflare, Route53..." />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.auto_renew_status || false} onCheckedChange={v => setForm(f => ({ ...f, auto_renew_status: v }))} />
                <Label className="pb-0.5">Auto-Renew</Label>
              </div>
            </div>
            <div>
              <Label>Nameservers (comma-separated)</Label>
              <Input value={nsInput} onChange={e => setNsInput(e.target.value)} placeholder="ns1.example.com, ns2.example.com" />
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
              {editId ? "Update Domain" : "Add Domain"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DomainManagementPage;
