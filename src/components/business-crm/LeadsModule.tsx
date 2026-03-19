import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Filter, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function LeadsModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("leads");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const [form, setForm] = useState({ full_name: "", mobile: "", email: "", source: "", campaign_source: "", preferred_callback_time: "", state: "", city: "", budget_range: "", property_interest_type: "", finance_readiness: "unknown", smsf_interest: false, stage: "new", assigned_advisor: "", notes: "" });

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false });
      return data || [];
    }, enabled: !!profile?.business_id,
  });

  const filtered = leads.filter((l: any) => {
    if (filterStage !== "all" && l.stage !== filterStage) return false;
    if (search) { const q = search.toLowerCase(); return l.full_name.toLowerCase().includes(q) || (l.mobile || "").includes(q) || (l.email || "").toLowerCase().includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_leads").insert({ business_id: profile!.business_id!, ...form, smsf_interest: form.smsf_interest } as any);
    if (error) { toast.error("Failed to add lead"); return; }
    toast.success("Lead added");
    setOpen(false);
    setForm({ full_name: "", mobile: "", email: "", source: "", campaign_source: "", preferred_callback_time: "", state: "", city: "", budget_range: "", property_interest_type: "", finance_readiness: "unknown", smsf_interest: false, stage: "new", assigned_advisor: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const moveStage = async (id: string, stage: string) => {
    await supabase.from("crm_leads").update({ stage, updated_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const stageColor = (key: string) => stages.find((s: any) => s.key === key)?.color || "#888";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Leads", val: leads.length }, { label: "New", val: leads.filter((l: any) => l.stage === "new").length }, { label: "Qualified", val: leads.filter((l: any) => l.stage === "qualified").length }, { label: "Converted", val: leads.filter((l: any) => l.stage === "converted").length }].map(k => (
          <Card key={k.label} className="bg-card border-border"><CardContent className="p-3"><p className="text-xl font-bold text-foreground">{k.val}</p><p className="text-[10px] text-muted-foreground">{k.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Select value={filterStage} onValueChange={setFilterStage}><SelectTrigger className="w-[180px] bg-card"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Stages</SelectItem>{stages.filter((s: any) => s.is_visible).map((s: any) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")} className="text-xs h-7">Board</Button>
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Lead</Button>
      </div>

      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.filter((s: any) => s.is_visible).map((stage: any) => {
            const items = filtered.filter((l: any) => l.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[240px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><span className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</span><Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge></div>
                <div className="space-y-2">
                  {items.map((l: any) => (
                    <Card key={l.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-3 space-y-1.5">
                        <p className="font-medium text-sm text-foreground">{l.full_name}</p>
                        {l.mobile && <p className="text-[10px] text-muted-foreground">{l.mobile}</p>}
                        <div className="flex gap-1 flex-wrap">
                          {l.source && <Badge variant="outline" className="text-[10px]">{l.source}</Badge>}
                          {l.smsf_interest && <Badge variant="secondary" className="text-[10px]">SMSF</Badge>}
                          {l.lead_score > 0 && <Badge variant="secondary" className="text-[10px]">Score: {l.lead_score}</Badge>}
                        </div>
                        <Select value={l.stage} onValueChange={(v) => moveStage(l.id, v)}><SelectTrigger className="h-6 text-[10px] bg-secondary/50"><SelectValue /></SelectTrigger><SelectContent>{stages.filter((s: any) => s.is_visible).map((s: any) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent></Select>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">No leads</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <Card className="bg-card border-border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Source</TableHead><TableHead>Stage</TableHead><TableHead>Score</TableHead><TableHead>Added</TableHead></TableRow></TableHeader><TableBody>
          {filtered.map((l: any) => (
            <TableRow key={l.id}><TableCell className="font-medium">{l.full_name}</TableCell><TableCell className="text-xs">{l.mobile || l.email || "—"}</TableCell><TableCell><Badge variant="outline" className="text-[10px]">{l.source || "—"}</Badge></TableCell><TableCell><Badge style={{ backgroundColor: stageColor(l.stage), color: "#fff" }} className="text-[10px]">{stages.find((s: any) => s.key === l.stage)?.label || l.stage}</Badge></TableCell><TableCell>{l.lead_score || 0}</TableCell><TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), "dd MMM")}</TableCell></TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>}
        </TableBody></Table></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Source</Label><Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="referral">Referral</SelectItem><SelectItem value="website">Website</SelectItem><SelectItem value="social_media">Social Media</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="ads">Ads</SelectItem><SelectItem value="partner">Partner</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Campaign/Ad Source</Label><Input value={form.campaign_source} onChange={e => setForm(f => ({ ...f, campaign_source: e.target.value }))} /></div>
              <div><Label className="text-xs">Preferred Callback</Label><Input value={form.preferred_callback_time} onChange={e => setForm(f => ({ ...f, preferred_callback_time: e.target.value }))} /></div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">City</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><Label className="text-xs">Budget Range</Label><Input value={form.budget_range} onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))} placeholder="e.g. $500K - $800K" /></div>
              <div><Label className="text-xs">Property Interest</Label><Select value={form.property_interest_type} onValueChange={v => setForm(f => ({ ...f, property_interest_type: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="industrial">Industrial</SelectItem><SelectItem value="development">Development</SelectItem><SelectItem value="off_market">Off Market</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Finance Readiness</Label><Select value={form.finance_readiness} onValueChange={v => setForm(f => ({ ...f, finance_readiness: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pre-approved">Pre-Approved</SelectItem><SelectItem value="conditional">Conditional</SelectItem><SelectItem value="unknown">Unknown</SelectItem><SelectItem value="not_ready">Not Ready</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Assigned Advisor</Label><Input value={form.assigned_advisor} onChange={e => setForm(f => ({ ...f, assigned_advisor: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.smsf_interest} onCheckedChange={v => setForm(f => ({ ...f, smsf_interest: v }))} /><Label className="text-xs">SMSF Interest</Label></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
