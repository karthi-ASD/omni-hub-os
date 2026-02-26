import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Target, Filter, Archive, Phone, Mail } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type LeadStage = Database["public"]["Enums"]["lead_stage"];

const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500",
  contacted: "bg-purple-500/10 text-purple-500",
  meeting_booked: "bg-indigo-500/10 text-indigo-500",
  proposal_requested: "bg-orange-500/10 text-orange-500",
  negotiation: "bg-yellow-500/10 text-yellow-500",
  won: "bg-emerald-500/10 text-emerald-500",
  lost: "bg-destructive/10 text-destructive",
};

const LeadsPage = () => {
  const { leads, loading, createLead, updateStage, logActivity, archiveLead } = useLeads();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [activityDialog, setActivityDialog] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState("");
  const [activityType, setActivityType] = useState<string>("call");
  const [form, setForm] = useState({ name: "", email: "", phone: "", business_name: "", services_needed: "", notes: "" });

  const filtered = leads
    .filter(l => l.status === "active")
    .filter(l => {
      const matchesSearch = !search || [l.name, l.email, l.phone, l.business_name].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchesStage = stageFilter === "all" || l.stage === stageFilter;
      return matchesSearch && matchesStage;
    });

  const handleCreate = async () => {
    if (!form.name || !form.email) return;
    await createLead({
      name: form.name, email: form.email, phone: form.phone || null,
      business_name: form.business_name || null, services_needed: form.services_needed || null,
      notes: form.notes || null, assigned_to_user_id: profile?.user_id || null,
    });
    setForm({ name: "", email: "", phone: "", business_name: "", services_needed: "", notes: "" });
    setCreateOpen(false);
  };

  const handleLogActivity = async () => {
    if (!activityDialog || !activitySummary) return;
    await logActivity(activityDialog, activityType as Database["public"]["Enums"]["lead_activity_type"], activitySummary);
    setActivityDialog(null);
    setActivitySummary("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-6 w-6" /> Leads</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Lead</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Business Name</Label><Input value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} /></div>
              <div><Label>Services Needed</Label><Input value={form.services_needed} onChange={e => setForm(p => ({ ...p, services_needed: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {["new", "contacted", "meeting_booked", "proposal_requested", "negotiation", "won", "lost"].map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No leads found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Business</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden md:table-cell">Follow-up</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.business_name || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{lead.phone || "—"}</TableCell>
                    <TableCell>
                      <Select value={lead.stage} onValueChange={(v) => updateStage(lead.id, v as LeadStage)}>
                        <SelectTrigger className="h-7 w-auto border-0 p-0">
                          <Badge className={stageColors[lead.stage] || ""}>{lead.stage.replace(/_/g, " ")}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["new", "contacted", "meeting_booked", "proposal_requested", "negotiation", "won", "lost"].map(s => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {lead.next_follow_up_at ? format(new Date(lead.next_follow_up_at), "MMM d, HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setActivityDialog(lead.id); setActivityType("call"); }} title="Log Activity">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => archiveLead(lead.id)} title="Archive">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Activity Dialog */}
      <Dialog open={!!activityDialog} onOpenChange={() => setActivityDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["call", "email", "whatsapp", "note", "meeting"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Summary</Label><Textarea value={activitySummary} onChange={e => setActivitySummary(e.target.value)} placeholder="What happened?" /></div>
            <Button onClick={handleLogActivity} className="w-full">Log Activity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
