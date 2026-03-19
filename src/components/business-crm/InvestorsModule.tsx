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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, DollarSign, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = { platinum: "bg-purple-500/10 text-purple-400", gold: "bg-amber-500/10 text-amber-400", silver: "bg-zinc-400/10 text-zinc-400", standard: "bg-muted text-muted-foreground" };

export function InvestorsModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("investors");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");

  const [form, setForm] = useState({
    full_name: "", preferred_name: "", email: "", phone: "", occupation: "",
    annual_income_band: "", investor_type: "individual", entity_type_notes: "",
    smsf_status: "unknown", finance_status: "unknown", investment_experience: "beginner",
    risk_profile: "moderate", budget_min: "", budget_max: "", deposit_readiness: "unknown",
    borrowing_capacity_band: "", timeline_to_invest: "", current_property_count: "0",
    referred_by: "", investor_tier: "standard", communication_preference: "phone",
    preferred_meeting_mode: "in_person", long_term_goals: "", investment_goals: "",
    pipeline_stage: "inquiry", source: "", notes: "",
  });

  const { data: investors = [] } = useQuery({
    queryKey: ["crm-investors", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_investors").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false });
      return data || [];
    }, enabled: !!profile?.business_id,
  });

  const filtered = investors.filter((i: any) => {
    if (filterTier !== "all" && i.investor_tier !== filterTier) return false;
    if (search) { const q = search.toLowerCase(); return i.full_name.toLowerCase().includes(q) || (i.email || "").toLowerCase().includes(q) || (i.phone || "").includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_investors").insert({
      business_id: profile!.business_id!, full_name: form.full_name, preferred_name: form.preferred_name || null,
      email: form.email || null, phone: form.phone || null, occupation: form.occupation || null,
      annual_income_band: form.annual_income_band || null, investor_type: form.investor_type,
      entity_type_notes: form.entity_type_notes || null, smsf_status: form.smsf_status,
      finance_status: form.finance_status, investment_experience: form.investment_experience,
      risk_profile: form.risk_profile, budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null, deposit_readiness: form.deposit_readiness,
      borrowing_capacity_band: form.borrowing_capacity_band || null,
      timeline_to_invest: form.timeline_to_invest || null,
      current_property_count: Number(form.current_property_count) || 0,
      referred_by: form.referred_by || null, investor_tier: form.investor_tier,
      communication_preference: form.communication_preference,
      preferred_meeting_mode: form.preferred_meeting_mode,
      long_term_goals: form.long_term_goals || null, investment_goals: form.investment_goals || null,
      pipeline_stage: form.pipeline_stage, source: form.source || null, notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed"); console.error(error); return; }
    toast.success("Investor added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-investors"] });
  };

  const totalBudget = investors.reduce((s: number, i: any) => s + (i.budget_max || 0), 0);
  const platGold = investors.filter((i: any) => ["platinum", "gold"].includes(i.investor_tier)).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total Investors", val: investors.length, icon: Users },
          { label: "Platinum/Gold", val: platGold, icon: Star },
          { label: "Pipeline Value", val: `$${(totalBudget / 1e6).toFixed(1)}M`, icon: DollarSign },
          { label: "Avg Properties", val: investors.length ? (investors.reduce((s: number, i: any) => s + (i.current_property_count || 0), 0) / investors.length).toFixed(1) : "0", icon: TrendingUp },
        ].map(k => (
          <Card key={k.label} className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><k.icon className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{k.val}</p><p className="text-[10px] text-muted-foreground">{k.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search investors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Select value={filterTier} onValueChange={setFilterTier}><SelectTrigger className="w-[160px] bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Tiers</SelectItem><SelectItem value="platinum">Platinum</SelectItem><SelectItem value="gold">Gold</SelectItem><SelectItem value="silver">Silver</SelectItem><SelectItem value="standard">Standard</SelectItem></SelectContent></Select>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Investor</Button>
      </div>

      <Card className="bg-card border-border"><Table><TableHeader><TableRow>
        <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Tier</TableHead><TableHead>Budget</TableHead><TableHead>Finance</TableHead><TableHead>Stage</TableHead><TableHead>Properties</TableHead>
      </TableRow></TableHeader><TableBody>
        {filtered.map((i: any) => (
          <TableRow key={i.id}>
            <TableCell><div><p className="font-medium text-sm">{i.full_name}</p>{i.email && <p className="text-[10px] text-muted-foreground">{i.email}</p>}</div></TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{i.investor_type}</Badge></TableCell>
            <TableCell><Badge className={`text-[10px] ${TIER_COLORS[i.investor_tier] || ""}`}>{i.investor_tier}</Badge></TableCell>
            <TableCell className="text-xs">{i.budget_min || i.budget_max ? `$${((i.budget_min || 0) / 1000).toFixed(0)}K–$${((i.budget_max || 0) / 1000).toFixed(0)}K` : "—"}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{(i.finance_status || "unknown").replace("_", " ")}</Badge></TableCell>
            <TableCell><Badge style={{ backgroundColor: stages.find((s: any) => s.key === i.pipeline_stage)?.color, color: "#fff" }} className="text-[10px]">{stages.find((s: any) => s.key === i.pipeline_stage)?.label || i.pipeline_stage}</Badge></TableCell>
            <TableCell className="text-sm">{i.current_property_count || 0}</TableCell>
          </TableRow>
        ))}
        {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No investors found</TableCell></TableRow>}
      </TableBody></Table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Investor</DialogTitle></DialogHeader>
          <Tabs defaultValue="personal" className="mt-2">
            <TabsList className="bg-secondary"><TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger><TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger><TabsTrigger value="preferences" className="text-xs">Preferences</TabsTrigger></TabsList>
            <TabsContent value="personal" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div><Label className="text-xs">Preferred Name</Label><Input value={form.preferred_name} onChange={e => setForm(f => ({ ...f, preferred_name: e.target.value }))} /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><Label className="text-xs">Occupation</Label><Input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} /></div>
                <div><Label className="text-xs">Referred By</Label><Input value={form.referred_by} onChange={e => setForm(f => ({ ...f, referred_by: e.target.value }))} /></div>
                <div><Label className="text-xs">Entity Type</Label><Select value={form.investor_type} onValueChange={v => setForm(f => ({ ...f, investor_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="smsf">SMSF</SelectItem><SelectItem value="trust">Trust</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Tier</Label><Select value={form.investor_tier} onValueChange={v => setForm(f => ({ ...f, investor_tier: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="platinum">Platinum</SelectItem><SelectItem value="gold">Gold</SelectItem><SelectItem value="silver">Silver</SelectItem><SelectItem value="standard">Standard</SelectItem></SelectContent></Select></div>
              </div>
            </TabsContent>
            <TabsContent value="financial" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Annual Income Band</Label><Select value={form.annual_income_band} onValueChange={v => setForm(f => ({ ...f, annual_income_band: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="under_100k">Under $100K</SelectItem><SelectItem value="100k_200k">$100K–$200K</SelectItem><SelectItem value="200k_500k">$200K–$500K</SelectItem><SelectItem value="500k_plus">$500K+</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Finance Readiness</Label><Select value={form.finance_status} onValueChange={v => setForm(f => ({ ...f, finance_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pre-approved">Pre-Approved</SelectItem><SelectItem value="conditional">Conditional</SelectItem><SelectItem value="unknown">Unknown</SelectItem><SelectItem value="not_ready">Not Ready</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Budget Min ($)</Label><Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} /></div>
                <div><Label className="text-xs">Budget Max ($)</Label><Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} /></div>
                <div><Label className="text-xs">SMSF Status</Label><Select value={form.smsf_status} onValueChange={v => setForm(f => ({ ...f, smsf_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="setting_up">Setting Up</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="not_applicable">N/A</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Deposit Readiness</Label><Select value={form.deposit_readiness} onValueChange={v => setForm(f => ({ ...f, deposit_readiness: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ready">Ready</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="not_ready">Not Ready</SelectItem><SelectItem value="unknown">Unknown</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Borrowing Capacity</Label><Input value={form.borrowing_capacity_band} onChange={e => setForm(f => ({ ...f, borrowing_capacity_band: e.target.value }))} placeholder="e.g. $500K–$800K" /></div>
                <div><Label className="text-xs">Current Properties</Label><Input type="number" value={form.current_property_count} onChange={e => setForm(f => ({ ...f, current_property_count: e.target.value }))} /></div>
              </div>
            </TabsContent>
            <TabsContent value="preferences" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Risk Appetite</Label><Select value={form.risk_profile} onValueChange={v => setForm(f => ({ ...f, risk_profile: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="conservative">Conservative</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="aggressive">Aggressive</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Experience Level</Label><Select value={form.investment_experience} onValueChange={v => setForm(f => ({ ...f, investment_experience: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="experienced">Experienced</SelectItem><SelectItem value="expert">Expert</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Timeline to Invest</Label><Select value={form.timeline_to_invest} onValueChange={v => setForm(f => ({ ...f, timeline_to_invest: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="immediate">Immediate</SelectItem><SelectItem value="1_3_months">1–3 Months</SelectItem><SelectItem value="3_6_months">3–6 Months</SelectItem><SelectItem value="6_12_months">6–12 Months</SelectItem><SelectItem value="12_plus">12+ Months</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Communication Pref</Label><Select value={form.communication_preference} onValueChange={v => setForm(f => ({ ...f, communication_preference: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="phone">Phone</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Meeting Mode</Label><Select value={form.preferred_meeting_mode} onValueChange={v => setForm(f => ({ ...f, preferred_meeting_mode: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_person">In Person</SelectItem><SelectItem value="video">Video Call</SelectItem><SelectItem value="phone">Phone</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Source</Label><Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="referral">Referral</SelectItem><SelectItem value="website">Website</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="partner">Partner</SelectItem><SelectItem value="social_media">Social Media</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label className="text-xs">Long-Term Goals</Label><Textarea value={form.long_term_goals} onChange={e => setForm(f => ({ ...f, long_term_goals: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </TabsContent>
          </Tabs>
          <Button onClick={handleSave} className="w-full mt-3">Add Investor</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
