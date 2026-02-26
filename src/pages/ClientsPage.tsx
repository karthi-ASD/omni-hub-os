import { useState } from "react";
import { useClients, Client, OnboardingStatus } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";

const onboardingColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
};

const ClientsPage = () => {
  const { clients, loading, createClient, updateOnboardingStatus } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ contact_name: "", email: "", phone: "", company_name: "", address: "" });

  const handleCreate = async () => {
    await createClient({
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone || undefined,
      company_name: form.company_name || undefined,
      address: form.address || undefined,
    });
    setCreateOpen(false);
    setForm({ contact_name: "", email: "", phone: "", company_name: "", address: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Clients</h1>
          <p className="text-muted-foreground">Manage your client base</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Client</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No clients yet. Clients are created when contracts are signed.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {clients.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.contact_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {c.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{c.company_name}</span>}
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  </div>
                </div>
                <Badge className={onboardingColors[c.onboarding_status]}>{c.onboarding_status.replace("_", " ")}</Badge>
                <Select value={c.onboarding_status} onValueChange={v => updateOnboardingStatus(c.id, v as OnboardingStatus)}>
                  <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["pending", "in_progress", "completed"] as const).map(s => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-sm capitalize text-muted-foreground">{s.replace("_", " ")}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{clients.filter(c => c.onboarding_status === s).length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Contact Name *</Label><Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.contact_name || !form.email}>Create Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
