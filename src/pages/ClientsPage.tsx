import { useState } from "react";
import { useClients, Client, OnboardingStatus } from "@/hooks/useClients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Mail, Phone, Building2, Search, ChevronRight } from "lucide-react";

const onboardingColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
};

const ClientsPage = () => {
  const { clients, loading, createClient, updateOnboardingStatus } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ contact_name: "", email: "", phone: "", company_name: "", address: "" });

  const filtered = clients.filter(c =>
    !search || [c.contact_name, c.email, c.company_name, c.phone]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

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

  // Summary stats
  const statusCounts = {
    pending: clients.filter(c => c.onboarding_status === "pending").length,
    in_progress: clients.filter(c => c.onboarding_status === "in_progress").length,
    completed: clients.filter(c => c.onboarding_status === "completed").length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Clients
        </h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 shrink-0">
          <span className="text-lg font-bold text-amber-600">{statusCounts.pending}</span>
          <span className="text-xs text-amber-600 font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 shrink-0">
          <span className="text-lg font-bold text-blue-600">{statusCounts.in_progress}</span>
          <span className="text-xs text-blue-600 font-medium">In Progress</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 shrink-0">
          <span className="text-lg font-bold text-green-600">{statusCounts.completed}</span>
          <span className="text-xs text-green-600 font-medium">Completed</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {/* Client cards */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No clients found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className="rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{c.contact_name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${onboardingColors[c.onboarding_status]}`}>
                        {c.onboarding_status.replace("_", " ")}
                      </Badge>
                    </div>
                    {c.company_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {c.company_name}
                      </p>
                    )}
                  </div>
                  <Select value={c.onboarding_status} onValueChange={v => updateOnboardingStatus(c.id, v as OnboardingStatus)}>
                    <SelectTrigger className="w-28 h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Client */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
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
            <Button onClick={handleCreate} disabled={!form.contact_name || !form.email}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
