import { useState, useMemo } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format as fmtDate } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Search, Phone, Mail, MessageSquare, StickyNote,
  Calendar, UserPlus, ArrowRight, Clock, AlertTriangle,
  MapPin, Zap, FileText, ChevronRight, Send,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { ServiceLeadDetail } from "./ServiceLeadDetail";

const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "ads", label: "Ads" },
  { value: "social_media", label: "Social Media" },
  { value: "partner", label: "Partner" },
];

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  contacted: { label: "Contacted", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  meeting_booked: { label: "Qualified", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  proposal_requested: { label: "Proposal Sent", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  negotiation: { label: "Negotiation", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  won: { label: "Converted", color: "bg-green-500/10 text-green-600 border-green-200" },
  lost: { label: "Lost", color: "bg-red-500/10 text-red-600 border-red-200" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-muted text-muted-foreground border-border",
};

export function ServiceLeadsModule() {
  const { leads, loading, createLead, updateStage } = useLeads();
  const { followUps, createFollowUp } = useFollowUps();
  const { profile, roles } = useAuth();
  const [subTab, setSubTab] = useState("new");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const isAdmin = roles.some(r => ["super_admin", "business_admin", "manager"].includes(r));

  // Filter leads by sub-tab
  const filteredLeads = useMemo(() => {
    let result = leads.filter(l => (l as any).status !== "archived");

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").includes(q)
      );
    }

    // Role scoping: sales users see only their assigned leads
    if (!isAdmin && profile?.user_id) {
      result = result.filter(l => l.assigned_to_user_id === profile.user_id);
    }

    switch (subTab) {
      case "new":
        return result.filter(l => l.stage === "new");
      case "assigned":
        return result.filter(l => l.stage !== "new" && l.stage !== "won" && l.stage !== "lost");
      case "followups": {
        const leadIdsWithFollowups = new Set(followUps.filter(f => f.status === "pending").map(f => f.lead_id));
        return result.filter(l => leadIdsWithFollowups.has(l.id));
      }
      case "converted":
        return result.filter(l => l.stage === "won");
      default:
        return result;
    }
  }, [leads, subTab, search, isAdmin, profile?.user_id, followUps]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.stage === "new").length,
    active: leads.filter(l => !["new", "won", "lost"].includes(l.stage)).length,
    converted: leads.filter(l => l.stage === "won").length,
    overdue: followUps.filter(f => f.status === "pending" && isPast(new Date(f.followup_date))).length,
  }), [leads, followUps]);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "",
    source: "manual" as any, property_type: "", notes: "",
    monthly_consumption: "", roof_type: "", installation_notes: "",
  });

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.email.trim()) { toast.error("Email is required"); return; }

    const customData: Record<string, any> = {};
    if (form.monthly_consumption) customData.monthly_consumption_kwh = form.monthly_consumption;
    if (form.roof_type) customData.roof_type = form.roof_type;
    if (form.installation_notes) customData.installation_notes = form.installation_notes;

    await createLead({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      suburb: form.address.trim() || null,
      source: form.source,
      notes: form.notes.trim() || null,
      stage: "new",
      status: "active" as any,
      custom_data_json: Object.keys(customData).length > 0 ? customData : null,
      property_type: form.property_type || null,
      priority: "medium",
    } as any);

    setForm({ name: "", email: "", phone: "", address: "", source: "manual" as any, property_type: "", notes: "", monthly_consumption: "", roof_type: "", installation_notes: "" });
    setAddOpen(false);
  };

  if (selectedLead) {
    const lead = leads.find(l => l.id === selectedLead);
    if (lead) {
      return (
        <ServiceLeadDetail
          lead={lead}
          onBack={() => setSelectedLead(null)}
          onStageChange={(stage) => updateStage(selectedLead, stage)}
        />
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Leads", val: stats.total, icon: UserPlus },
          { label: "New", val: stats.new, icon: Zap },
          { label: "Active", val: stats.active, icon: ArrowRight },
          { label: "Converted", val: stats.converted, icon: FileText },
          { label: "Overdue Follow-ups", val: stats.overdue, icon: AlertTriangle },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">{s.val}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />New Lead
        </Button>
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="new" className="gap-1.5 text-xs">
            <Zap className="h-3 w-3" />New Leads
            <Badge variant="secondary" className="text-[10px] h-4 px-1">{stats.new}</Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="gap-1.5 text-xs">
            <UserPlus className="h-3 w-3" />Assigned
            <Badge variant="secondary" className="text-[10px] h-4 px-1">{stats.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="followups" className="gap-1.5 text-xs">
            <Clock className="h-3 w-3" />Follow-ups
          </TabsTrigger>
          <TabsTrigger value="converted" className="gap-1.5 text-xs">
            <FileText className="h-3 w-3" />Converted
            <Badge variant="secondary" className="text-[10px] h-4 px-1">{stats.converted}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={subTab} className="mt-4">
          <LeadsTable leads={filteredLeads} onSelect={setSelectedLead} />
        </TabsContent>
      </Tabs>

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Address / Location</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label className="text-xs">Lead Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Property Type</Label>
                <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">☀️ Solar-Specific Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Monthly Consumption (kWh)</Label><Input value={form.monthly_consumption} onChange={e => setForm(f => ({ ...f, monthly_consumption: e.target.value }))} placeholder="e.g. 450" /></div>
                <div><Label className="text-xs">Roof Type</Label><Input value={form.roof_type} onChange={e => setForm(f => ({ ...f, roof_type: e.target.value }))} placeholder="e.g. Tile, Metal" /></div>
              </div>
              <div className="mt-2"><Label className="text-xs">Installation Location Notes</Label><Textarea value={form.installation_notes} onChange={e => setForm(f => ({ ...f, installation_notes: e.target.value }))} rows={2} placeholder="Any notes about site, shading, etc." /></div>
            </div>

            <div><Label className="text-xs">General Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleCreate} className="w-full">Add Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Leads Table sub-component
function LeadsTable({ leads, onSelect }: { leads: any[]; onSelect: (id: string) => void }) {
  if (leads.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center text-muted-foreground">
          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leads in this view</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map(lead => {
            const stage = STAGE_CONFIG[lead.stage] || { label: lead.stage, color: "" };
            const priority = (lead as any).priority || "medium";
            return (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onSelect(lead.id)}
              >
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-xs">
                  <div className="space-y-0.5">
                    {lead.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</div>}
                    {lead.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</div>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{lead.source || "—"}</Badge></TableCell>
                <TableCell><Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge></TableCell>
                <TableCell><Badge className={`text-[10px] ${PRIORITY_CONFIG[priority] || ""}`}>{priority}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
