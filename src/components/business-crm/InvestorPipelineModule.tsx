import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, DollarSign, TrendingUp, Filter } from "lucide-react";
import { toast } from "sonner";

interface Investor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  investor_type: string;
  budget_min: number | null;
  budget_max: number | null;
  finance_status: string;
  investment_goals: string | null;
  preferred_property_types: string[] | null;
  risk_profile: string;
  pipeline_stage: string;
  source: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
}

export function InvestorPipelineModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("investor_pipeline");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Form state
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", investor_type: "individual",
    budget_min: "", budget_max: "", finance_status: "unknown",
    investment_goals: "", risk_profile: "moderate", source: "",
    pipeline_stage: "inquiry", notes: "",
  });

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["crm-investors", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_investors")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false });
      return (data || []) as Investor[];
    },
    enabled: !!profile?.business_id,
  });

  const filtered = investors.filter(inv => {
    if (filterStage !== "all" && inv.pipeline_stage !== filterStage) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return inv.full_name.toLowerCase().includes(q) ||
        (inv.email || "").toLowerCase().includes(q) ||
        (inv.phone || "").includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("crm_investors").insert({
      business_id: profile!.business_id!,
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      investor_type: form.investor_type,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      finance_status: form.finance_status,
      investment_goals: form.investment_goals || null,
      risk_profile: form.risk_profile,
      pipeline_stage: form.pipeline_stage,
      source: form.source || null,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed to add investor"); console.error(error); return; }
    toast.success("Investor added");
    setDialogOpen(false);
    setForm({ full_name: "", email: "", phone: "", investor_type: "individual", budget_min: "", budget_max: "", finance_status: "unknown", investment_goals: "", risk_profile: "moderate", source: "", pipeline_stage: "inquiry", notes: "" });
    queryClient.invalidateQueries({ queryKey: ["crm-investors"] });
  };

  const moveStage = async (investorId: string, newStage: string) => {
    await supabase.from("crm_investors").update({
      pipeline_stage: newStage,
      stage_changed_at: new Date().toISOString(),
    } as any).eq("id", investorId);
    queryClient.invalidateQueries({ queryKey: ["crm-investors"] });
  };

  const formatCurrency = (v: number | null) => v != null ? `$${v.toLocaleString()}` : "—";

  const stageColor = (stage: string) => {
    const s = stages.find(st => st.key === stage);
    return s?.color || "#888";
  };

  // KPI stats
  const totalInvestors = investors.length;
  const activeDeals = investors.filter(i => ["property_matched", "under_contract"].includes(i.pipeline_stage)).length;
  const totalPipelineValue = investors.reduce((sum, i) => sum + (i.budget_max || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalInvestors}</p>
              <p className="text-xs text-muted-foreground">Total Investors</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeDeals}</p>
              <p className="text-xs text-muted-foreground">Active Deals</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">${(totalPipelineValue / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Pipeline Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search investors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] bg-card"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.filter(s => s.is_visible).map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={viewMode === "kanban" ? "default" : "ghost"} onClick={() => setViewMode("kanban")} className="text-xs h-7">Board</Button>
          <Button size="sm" variant={viewMode === "table" ? "default" : "ghost"} onClick={() => setViewMode("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Investor
        </Button>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.filter(s => s.is_visible).map(stage => {
            const stageInvestors = filtered.filter(i => i.pipeline_stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[260px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{stageInvestors.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageInvestors.map(inv => (
                    <Card key={inv.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm text-foreground">{inv.full_name}</p>
                          <Badge variant="outline" className="text-[10px]">{inv.investor_type}</Badge>
                        </div>
                        {(inv.budget_min || inv.budget_max) && (
                          <p className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(inv.budget_min)} — {formatCurrency(inv.budget_max)}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{ borderColor: inv.finance_status === "pre-approved" ? "#22c55e" : inv.finance_status === "not_ready" ? "#ef4444" : "#888" }}
                          >
                            {inv.finance_status?.replace("_", " ")}
                          </Badge>
                          {inv.source && <Badge variant="secondary" className="text-[10px]">{inv.source}</Badge>}
                        </div>
                        {/* Quick stage move */}
                        <Select value={inv.pipeline_stage} onValueChange={(v) => moveStage(inv.id, v)}>
                          <SelectTrigger className="h-6 text-[10px] bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {stages.filter(s => s.is_visible).map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                  {stageInvestors.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No investors
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Finance</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.full_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{inv.investor_type}</Badge></TableCell>
                  <TableCell className="text-sm">{formatCurrency(inv.budget_min)} — {formatCurrency(inv.budget_max)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{inv.finance_status?.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: stageColor(inv.pipeline_stage), color: "#fff" }} className="text-[10px]">
                      {stages.find(s => s.key === inv.pipeline_stage)?.label || inv.pipeline_stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.source || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No investors found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Investor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Investor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Investor Type</Label>
                <Select value={form.investor_type} onValueChange={v => setForm(f => ({ ...f, investor_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="smsf">SMSF</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Budget Min ($)</Label><Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} /></div>
              <div><Label className="text-xs">Budget Max ($)</Label><Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Finance Status</Label>
                <Select value={form.finance_status} onValueChange={v => setForm(f => ({ ...f, finance_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-approved">Pre-Approved</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="not_ready">Not Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Risk Profile</Label>
                <Select value={form.risk_profile} onValueChange={v => setForm(f => ({ ...f, risk_profile: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pipeline Stage</Label>
                <Select value={form.pipeline_stage} onValueChange={v => setForm(f => ({ ...f, pipeline_stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.filter(s => s.is_visible).map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Investment Goals</Label><Textarea value={form.investment_goals} onChange={e => setForm(f => ({ ...f, investment_goals: e.target.value }))} rows={2} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Investor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
