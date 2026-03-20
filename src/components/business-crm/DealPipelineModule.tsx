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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, DollarSign, Handshake, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DealDetailDrawer } from "./deal-lifecycle/DealDetailDrawer";

const PIPELINE_STAGES = [
  { key: "new_qualified", label: "New Lead", color: "#3b82f6" },
  { key: "contacted", label: "Contacted", color: "#06b6d4" },
  { key: "qualified", label: "Qualified", color: "#6366f1" },
  { key: "property_shared", label: "Property Shared", color: "#8b5cf6" },
  { key: "shortlisted", label: "Shortlisted", color: "#a855f7" },
  { key: "eoi_submitted", label: "EOI Submitted", color: "#ec4899" },
  { key: "deposit_pending", label: "Deposit Pending", color: "#f59e0b" },
  { key: "finance_in_progress", label: "Finance in Progress", color: "#f97316" },
  { key: "contract_issued", label: "Contract Issued", color: "#e11d48" },
  { key: "settlement", label: "Settlement", color: "#10b981" },
  { key: "closed", label: "Closed", color: "#16a34a" },
];

export function DealPipelineModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: customStages = [] } = usePipelineStages("deal_pipeline");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  // Use custom stages if configured, otherwise default
  const stages = customStages.length > 0 ? customStages : PIPELINE_STAGES.map(s => ({ ...s, is_visible: true }));

  const [form, setForm] = useState({
    deal_name: "", deal_stage: "new_qualified", deal_value: "", commission_amount: "",
    deal_type: "purchase", settlement_target_date: "", eoi_status: "none",
    deposit_status: "pending", risk_rating: "low", expected_milestone: "",
    blocker_summary: "", next_action_owner: "", notes: "",
    responsible_broker: "", responsible_lawyer: "", responsible_accountant: "",
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false });
      return data || [];
    }, enabled: !!profile?.business_id,
  });

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter((d: any) => d.deal_name.toLowerCase().includes(q));
  }, [deals, search]);

  const handleSave = async () => {
    if (!form.deal_name.trim()) { toast.error("Deal name required"); return; }
    const { error } = await supabase.from("crm_deals").insert({
      business_id: profile!.business_id!, deal_name: form.deal_name, deal_stage: form.deal_stage,
      deal_value: form.deal_value ? Number(form.deal_value) : null,
      commission_amount: form.commission_amount ? Number(form.commission_amount) : null,
      deal_type: form.deal_type, settlement_target_date: form.settlement_target_date || null,
      eoi_status: form.eoi_status, deposit_status: form.deposit_status, risk_rating: form.risk_rating,
      expected_milestone: form.expected_milestone || null, blocker_summary: form.blocker_summary || null,
      next_action_owner: form.next_action_owner || null, notes: form.notes || null,
      responsible_broker: form.responsible_broker || null,
      responsible_lawyer: form.responsible_lawyer || null,
      responsible_accountant: form.responsible_accountant || null,
    } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Deal added"); setOpen(false);
    setForm({
      deal_name: "", deal_stage: "new_qualified", deal_value: "", commission_amount: "",
      deal_type: "purchase", settlement_target_date: "", eoi_status: "none",
      deposit_status: "pending", risk_rating: "low", expected_milestone: "",
      blocker_summary: "", next_action_owner: "", notes: "",
      responsible_broker: "", responsible_lawyer: "", responsible_accountant: "",
    });
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
  };

  const moveStage = async (id: string, stage: string) => {
    await supabase.from("crm_deals").update({ deal_stage: stage, stage_entered_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
  };

  const stats = useMemo(() => ({
    total: deals.length,
    value: deals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0),
    commission: deals.reduce((s: number, d: any) => s + (d.commission_amount || 0), 0),
    blockers: deals.filter((d: any) => d.blocker_summary || d.delay_reason).length,
    depositsP: deals.filter((d: any) => d.deposit_status === "pending").length,
    financeD: deals.filter((d: any) => d.finance_status === "delayed").length,
    settlements: deals.filter((d: any) => d.deal_stage === "settlement").length,
  }), [deals]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Total Deals", val: stats.total, icon: Handshake, fmt: String(stats.total), color: "text-primary" },
          { label: "Pipeline Value", val: stats.value, icon: DollarSign, fmt: `$${(stats.value / 1e6).toFixed(1)}M`, color: "text-primary" },
          { label: "Commission", val: stats.commission, icon: TrendingUp, fmt: `$${(stats.commission / 1000).toFixed(0)}K`, color: "text-primary" },
          { label: "Blockers", val: stats.blockers, icon: AlertTriangle, fmt: String(stats.blockers), color: "text-destructive" },
          { label: "Deposits Pending", val: stats.depositsP, icon: Clock, fmt: String(stats.depositsP), color: "text-amber-500" },
          { label: "Finance Delays", val: stats.financeD, icon: AlertTriangle, fmt: String(stats.financeD), color: "text-destructive" },
          { label: "Settlements Due", val: stats.settlements, icon: CheckCircle, fmt: String(stats.settlements), color: "text-emerald-500" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-2.5 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${k.color} flex-shrink-0`} />
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{k.fmt}</p>
                  <p className="text-[9px] text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")} className="text-xs h-7">Board</Button>
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Deal</Button>
      </div>

      {/* Kanban */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.filter((s: any) => s.is_visible !== false).map((stage: any) => {
            const items = filtered.filter((d: any) => d.deal_stage === stage.key);
            const stageValue = items.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
            return (
              <div key={stage.key} className="min-w-[220px] flex-shrink-0">
                <div className="mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
                  </div>
                  {stageValue > 0 && <p className="text-[9px] text-muted-foreground ml-4">${(stageValue / 1000).toFixed(0)}K</p>}
                </div>
                <div className="space-y-2">
                  {items.map((d: any) => (
                    <Card key={d.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedDeal(d)}>
                      <CardContent className="p-2.5 space-y-1.5">
                        <p className="font-medium text-xs text-foreground">{d.deal_name}</p>
                        {d.deal_value && <p className="text-[10px] text-muted-foreground">${Number(d.deal_value).toLocaleString()}</p>}
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">{d.deal_type}</Badge>
                          {d.risk_rating === "high" && <Badge variant="destructive" className="text-[9px]">High Risk</Badge>}
                          {(d.blocker_summary || d.delay_reason) && <Badge variant="destructive" className="text-[9px]">Blocker</Badge>}
                          {d.deposit_status === "pending" && d.deal_stage === "deposit_pending" && <Badge className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30 border">Deposit Due</Badge>}
                        </div>
                        <Select value={d.deal_stage} onValueChange={(v) => { moveStage(d.id, v); }}>
                          <SelectTrigger className="h-5 text-[9px] bg-secondary/50" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                          <SelectContent>{stages.filter((s: any) => s.is_visible !== false).map((s: any) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && <div className="text-center py-4 text-[10px] text-muted-foreground border border-dashed border-border rounded-lg">No deals</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {view === "table" && (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Deal</TableHead>
                <TableHead className="text-xs">Stage</TableHead>
                <TableHead className="text-xs">Value</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">EOI</TableHead>
                <TableHead className="text-xs">Deposit</TableHead>
                <TableHead className="text-xs">Finance</TableHead>
                <TableHead className="text-xs">Risk</TableHead>
                <TableHead className="text-xs">Settlement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d: any) => (
                <TableRow key={d.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedDeal(d)}>
                  <TableCell className="font-medium text-sm">{d.deal_name}</TableCell>
                  <TableCell>
                    <Badge className="text-[10px] text-white" style={{ backgroundColor: stages.find((s: any) => s.key === d.deal_stage)?.color }}>
                      {stages.find((s: any) => s.key === d.deal_stage)?.label || d.deal_stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{d.deal_value ? `$${Number(d.deal_value).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.deal_type}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.eoi_status || "none"}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.deposit_status || "pending"}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.finance_status || "—"}</Badge></TableCell>
                  <TableCell><Badge variant={d.risk_rating === "high" ? "destructive" : "outline"} className="text-[10px]">{d.risk_rating}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.settlement_target_date ? format(new Date(d.settlement_target_date), "dd MMM yy") : "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No deals found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Deal Detail Drawer */}
      <DealDetailDrawer deal={selectedDeal} open={!!selectedDeal} onClose={() => setSelectedDeal(null)} />

      {/* Add Deal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Deal</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Deal Name *</Label><Input value={form.deal_name} onChange={e => setForm(f => ({ ...f, deal_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Stage</Label>
                <Select value={form.deal_stage} onValueChange={v => setForm(f => ({ ...f, deal_stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.filter((s: any) => s.is_visible !== false).map((s: any) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Deal Type</Label>
                <Select value={form.deal_type} onValueChange={v => setForm(f => ({ ...f, deal_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="smsf">SMSF</SelectItem>
                    <SelectItem value="refinance">Refinance</SelectItem>
                    <SelectItem value="off_market">Off-Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Value ($)</Label><Input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} /></div>
              <div><Label className="text-xs">Commission ($)</Label><Input type="number" value={form.commission_amount} onChange={e => setForm(f => ({ ...f, commission_amount: e.target.value }))} /></div>
              <div><Label className="text-xs">Settlement Date</Label><Input type="date" value={form.settlement_target_date} onChange={e => setForm(f => ({ ...f, settlement_target_date: e.target.value }))} /></div>
              <div><Label className="text-xs">Risk Rating</Label>
                <Select value={form.risk_rating} onValueChange={v => setForm(f => ({ ...f, risk_rating: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase pt-2">Third-Party Assignments</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Broker</Label><Input value={form.responsible_broker} onChange={e => setForm(f => ({ ...f, responsible_broker: e.target.value }))} /></div>
              <div><Label className="text-xs">Lawyer</Label><Input value={form.responsible_lawyer} onChange={e => setForm(f => ({ ...f, responsible_lawyer: e.target.value }))} /></div>
              <div><Label className="text-xs">Accountant</Label><Input value={form.responsible_accountant} onChange={e => setForm(f => ({ ...f, responsible_accountant: e.target.value }))} /></div>
              <div><Label className="text-xs">Next Action Owner</Label><Input value={form.next_action_owner} onChange={e => setForm(f => ({ ...f, next_action_owner: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Blockers</Label><Input value={form.blocker_summary} onChange={e => setForm(f => ({ ...f, blocker_summary: e.target.value }))} /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
