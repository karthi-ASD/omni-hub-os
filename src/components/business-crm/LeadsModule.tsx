import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, Filter, Upload, Zap, Phone, Flame,
  Thermometer, Snowflake, PhoneOff, XCircle, RefreshCw,
  Users, Star, Target, BarChart3, Clock, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CRMLead, LeadTab, LEAD_TABS, filterLeadsByTab, calculateLeadScore,
} from "./lead-engine/LeadEngineTypes";
import { LeadDetailDrawer } from "./lead-engine/LeadDetailDrawer";
import { LeadCSVImport } from "./lead-engine/LeadCSVImport";
import { LeadAutomationPanel } from "./lead-engine/LeadAutomationPanel";
import { MetaIntegrationPanel } from "./lead-engine/MetaIntegrationPanel";

const TAB_ICONS: Record<string, React.ElementType> = {
  all: Target, new: Star, hot: Flame, warm: Thermometer, cold: Snowflake,
  uncontacted: PhoneOff, invalid: XCircle, re_engagement: RefreshCw,
  meta: Users, referral: Star,
};

const SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website Form" },
  { value: "meta", label: "Facebook/Meta" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Call/Phone" },
  { value: "csv_import", label: "CSV Import" },
  { value: "social_media", label: "Social Media" },
  { value: "event", label: "Event" },
  { value: "ads", label: "Ads" },
  { value: "partner", label: "Partner" },
];

export function LeadsModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("leads");
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<LeadTab>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  const [form, setForm] = useState({
    full_name: "", mobile: "", email: "", source: "",
    campaign_source: "", preferred_callback_time: "",
    state: "", city: "", budget_range: "",
    property_interest_type: "", finance_readiness: "unknown",
    investment_timeline: "", location_preference: "",
    smsf_interest: false, referral_source_name: "",
    assigned_advisor: "", notes: "",
  });

  const bid = profile?.business_id;

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads", bid],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("business_id", bid!)
        .order("created_at", { ascending: false });
      return (data || []) as unknown as CRMLead[];
    },
    enabled: !!bid,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["crm-employees", bid],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("business_id", bid!);
      return (data || []).map((p: any) => ({ id: p.user_id, full_name: p.full_name }));
    },
    enabled: !!bid,
  });

  const tabFiltered = useMemo(() => filterLeadsByTab(leads, activeTab), [leads, activeTab]);

  const filtered = useMemo(() => {
    if (!search) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(l =>
      l.full_name.toLowerCase().includes(q) ||
      (l.mobile || "").includes(q) ||
      (l.email || "").toLowerCase().includes(q)
    );
  }, [tabFiltered, search]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.stage === "new").length,
    hot: leads.filter(l => l.lead_temperature === "hot").length,
    warm: leads.filter(l => l.lead_temperature === "warm").length,
    cold: leads.filter(l => l.lead_temperature === "cold" || !l.lead_temperature).length,
    uncontacted: leads.filter(l => !l.first_contact_at && l.contact_attempts === 0).length,
    invalid: leads.filter(l => l.stage === "invalid" || l.stage === "disqualified").length,
    sla_breached: leads.filter(l => l.sla_breached).length,
  }), [leads]);

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Name required"); return; }

    const { score, temperature } = calculateLeadScore(form as any);

    const { error } = await supabase.from("crm_leads").insert({
      business_id: bid!,
      ...form,
      stage: "new",
      lead_score: score,
      lead_temperature: temperature,
      auto_scored: true,
    } as any);

    if (error) { toast.error("Failed to add lead"); return; }

    // Log activity
    toast.success(`Lead added (Score: ${score}, ${temperature.toUpperCase()})`);
    setShowAdd(false);
    setForm({
      full_name: "", mobile: "", email: "", source: "",
      campaign_source: "", preferred_callback_time: "",
      state: "", city: "", budget_range: "",
      property_interest_type: "", finance_readiness: "unknown",
      investment_timeline: "", location_preference: "",
      smsf_interest: false, referral_source_name: "",
      assigned_advisor: "", notes: "",
    });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const moveStage = async (id: string, stage: string) => {
    await supabase.from("crm_leads").update({ stage, updated_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const tempBadge = (t: string | null) => {
    if (t === "hot") return <Badge className="bg-red-500/10 text-red-500 border-red-500/30 border text-[10px]">HOT</Badge>;
    if (t === "warm") return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 border text-[10px]">WARM</Badge>;
    return <Badge variant="secondary" className="text-[10px]">COLD</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: "Total", val: stats.total, icon: Target, color: "text-foreground" },
          { label: "New", val: stats.new, icon: Star, color: "text-primary" },
          { label: "Hot", val: stats.hot, icon: Flame, color: "text-red-500" },
          { label: "Warm", val: stats.warm, icon: Thermometer, color: "text-orange-500" },
          { label: "Cold", val: stats.cold, icon: Snowflake, color: "text-muted-foreground" },
          { label: "Uncontacted", val: stats.uncontacted, icon: PhoneOff, color: "text-purple-500" },
          { label: "Invalid", val: stats.invalid, icon: XCircle, color: "text-destructive" },
          { label: "SLA Breach", val: stats.sla_breached, icon: Clock, color: "text-destructive" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-2.5 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${k.color} flex-shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{k.val}</p>
                  <p className="text-[9px] text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {LEAD_TABS.map(tab => {
          const count = filterLeadsByTab(leads, tab.key).length;
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              size="sm"
              variant={isActive ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs gap-1 flex-shrink-0 ${isActive ? "" : "text-muted-foreground"}`}
            >
              {tab.label}
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{count}</Badge>
            </Button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")} className="text-xs h-7">Board</Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAutomation(true)} className="gap-1.5 text-xs">
          <Zap className="h-3.5 w-3.5" />Automation
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />Import
        </Button>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />Add Lead
        </Button>
      </div>

      {/* Table View */}
      {view === "table" && (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Temperature</TableHead>
                <TableHead className="text-xs">Score</TableHead>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">SLA</TableHead>
                <TableHead className="text-xs">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-secondary/50"
                  onClick={() => setSelectedLead(l)}
                >
                  <TableCell className="font-medium text-sm">{l.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.mobile || l.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{l.source || "—"}</Badge>
                  </TableCell>
                  <TableCell>{tempBadge(l.lead_temperature)}</TableCell>
                  <TableCell className="text-sm font-medium">{l.lead_score || 0}</TableCell>
                  <TableCell>
                    <Select value={l.stage || "new"} onValueChange={v => moveStage(l.id, v)}>
                      <SelectTrigger className="h-6 text-[10px] w-[100px] bg-secondary/50" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.filter((s: any) => s.is_visible).map((s: any) => (
                          <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {l.sla_breached ? (
                      <Badge variant="destructive" className="text-[10px]">Breached</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(l.created_at), "dd MMM")}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.filter((s: any) => s.is_visible).map((stage: any) => {
            const items = filtered.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[240px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map(l => (
                    <Card
                      key={l.id}
                      className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(l)}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-sm text-foreground">{l.full_name}</p>
                          {tempBadge(l.lead_temperature)}
                        </div>
                        {l.mobile && <p className="text-[10px] text-muted-foreground">{l.mobile}</p>}
                        <div className="flex gap-1 flex-wrap">
                          {l.source && <Badge variant="outline" className="text-[10px]">{l.source}</Badge>}
                          {l.lead_score != null && l.lead_score > 0 && (
                            <Badge variant="secondary" className="text-[10px]">{l.lead_score}pts</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        employees={employees}
        businessId={bid || ""}
      />

      {/* CSV Import */}
      <LeadCSVImport open={showImport} onClose={() => setShowImport(false)} businessId={bid || ""} />

      {/* Automation Dialog */}
      <Dialog open={showAutomation} onOpenChange={setShowAutomation}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Lead Automation</DialogTitle></DialogHeader>
          <LeadAutomationPanel />
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Campaign/Ad Source</Label><Input value={form.campaign_source} onChange={e => setForm(f => ({ ...f, campaign_source: e.target.value }))} /></div>
              <div><Label className="text-xs">Preferred Callback</Label><Input value={form.preferred_callback_time} onChange={e => setForm(f => ({ ...f, preferred_callback_time: e.target.value }))} /></div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase pt-2">Qualification Questions</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Budget Range</Label><Input value={form.budget_range} onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))} placeholder="e.g. $500K - $800K" /></div>
              <div><Label className="text-xs">Investment Timeline</Label>
                <Select value={form.investment_timeline} onValueChange={v => setForm(f => ({ ...f, investment_timeline: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (ASAP)</SelectItem>
                    <SelectItem value="1_month">Within 1 Month</SelectItem>
                    <SelectItem value="3_months">Within 3 Months</SelectItem>
                    <SelectItem value="6_months">Within 6 Months</SelectItem>
                    <SelectItem value="12_months">Within 12 Months</SelectItem>
                    <SelectItem value="exploring">Just Exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Property Interest</Label>
                <Select value={form.property_interest_type} onValueChange={v => setForm(f => ({ ...f, property_interest_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="off_market">Off Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Location Preference</Label><Input value={form.location_preference} onChange={e => setForm(f => ({ ...f, location_preference: e.target.value }))} placeholder="e.g. Melbourne CBD" /></div>
              <div><Label className="text-xs">Finance Readiness</Label>
                <Select value={form.finance_readiness} onValueChange={v => setForm(f => ({ ...f, finance_readiness: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-approved">Pre-Approved</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="not_ready">Not Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              {form.source === "referral" && (
                <div><Label className="text-xs">Referral Source Name</Label><Input value={form.referral_source_name} onChange={e => setForm(f => ({ ...f, referral_source_name: e.target.value }))} /></div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.smsf_interest} onCheckedChange={v => setForm(f => ({ ...f, smsf_interest: v }))} />
              <Label className="text-xs">SMSF Interest</Label>
            </div>

            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Lead (Auto-Scored)</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Meta Integration Panel - shown on Meta tab */}
      {activeTab === "meta" && bid && (
        <div className="mt-4">
          <MetaIntegrationPanel businessId={bid} />
        </div>
      )}
    </div>
  );
}
