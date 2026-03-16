import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";
import { useLeadConversions } from "@/hooks/useLeadConversions";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Search, Target, Phone, Mail, FolderKanban, MessageSquare, ChevronRight, Flame, UserCheck, Zap, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";

type LeadStage = Database["public"]["Enums"]["lead_stage"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

const stageColors: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-accent/10 text-accent",
  meeting_booked: "bg-info/10 text-info",
  proposal_requested: "bg-warning/10 text-warning",
  negotiation: "bg-neon-orange/10 text-neon-orange",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

const LeadsPage = () => {
  const { leads, loading, createLead, updateStage, logActivity, archiveLead, getActivities, updateLead } = useLeads();
  const { createDeal } = useDeals();
  const { requestConversion } = useLeadConversions();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [activityDialog, setActivityDialog] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState("");
  const [activityType, setActivityType] = useState<string>("call");
  const [form, setForm] = useState({ name: "", email: "", phone: "", business_name: "", services_needed: "", notes: "" });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const activeLeads = leads.filter(l => l.status === "active");
  const filtered = activeLeads
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

  const stageCounts = ["new", "contacted", "negotiation", "won"].map(s => ({
    stage: s,
    count: activeLeads.filter(l => l.stage === s).length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leads"
        subtitle={`${activeLeads.length} active leads`}
        icon={Target}
        actions={[{ label: "New Lead", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Active" value={activeLeads.length} icon={Target} gradient="from-primary to-accent" />
        <StatCard label="New" value={stageCounts.find(s => s.stage === "new")?.count || 0} icon={Flame} gradient="from-neon-blue to-info" />
        <StatCard label="Negotiation" value={stageCounts.find(s => s.stage === "negotiation")?.count || 0} icon={Zap} gradient="from-neon-orange to-warning" />
        <StatCard label="Won" value={stageCounts.find(s => s.stage === "won")?.count || 0} icon={UserCheck} gradient="from-neon-green to-success" />
      </div>

      {/* Stage pills */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          <button onClick={() => setStageFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${stageFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            All ({activeLeads.length})
          </button>
          {stageCounts.map(s => (
            <button key={s.stage} onClick={() => setStageFilter(s.stage)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${stageFilter === s.stage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {s.stage.replace(/_/g, " ")} ({s.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {/* Lead Cards */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-16 text-center text-muted-foreground">No leads found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <Card key={lead.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden hover-lift transition-all cursor-pointer" onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{lead.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${stageColors[lead.stage] || ""}`}>
                        {lead.stage.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {lead.business_name && <p className="text-xs text-muted-foreground truncate">{lead.business_name}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {lead.email && <span className="text-xs text-muted-foreground truncate">{lead.email}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50" onClick={e => e.stopPropagation()}>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                  <button onClick={() => { setActivityDialog(lead.id); setActivityType("call"); }} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                    <MessageSquare className="h-3.5 w-3.5" /> Log
                  </button>
                  <button onClick={async () => {
                    await createDeal({
                      deal_name: `${lead.name} – ${lead.services_needed || "New Deal"}`,
                      contact_name: lead.name, email: lead.email, phone: lead.phone,
                      business_name: lead.business_name, service_interest: lead.services_needed,
                      estimated_budget: lead.estimated_budget, lead_id: lead.id,
                    } as any);
                    navigate("/deals");
                  }} className="flex items-center gap-1 text-xs text-accent font-medium ml-auto hover:underline">
                    <FolderKanban className="h-3.5 w-3.5" /> Convert
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadDetailSheet lead={selectedLead} open={detailOpen} onOpenChange={setDetailOpen} onUpdateStage={updateStage} onArchive={archiveLead} onSaveEdit={async (id, updates) => { await updateLead(id, updates); }} getActivities={getActivities} />

      {/* Create Lead Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Business Name</Label><Input value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Services Needed</Label><Input value={form.services_needed} onChange={e => setForm(p => ({ ...p, services_needed: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <Button onClick={handleCreate} className="w-full rounded-xl">Create Lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={!!activityDialog} onOpenChange={() => setActivityDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["call", "email", "whatsapp", "note", "meeting"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Summary</Label><Textarea value={activitySummary} onChange={e => setActivitySummary(e.target.value)} placeholder="What happened?" /></div>
            <Button onClick={handleLogActivity} className="w-full rounded-xl">Log Activity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsPage;
