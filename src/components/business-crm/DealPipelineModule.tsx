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
import { Plus, Search, DollarSign, Handshake, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function DealPipelineModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("deal_pipeline");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const [form, setForm] = useState({
    deal_name: "", deal_stage: "new_qualified", deal_value: "", commission_amount: "",
    deal_type: "purchase", settlement_target_date: "", eoi_status: "none",
    deposit_status: "pending", risk_rating: "low", expected_milestone: "",
    blocker_summary: "", next_action_owner: "", notes: "",
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false });
      return data || [];
    }, enabled: !!profile?.business_id,
  });

  const filtered = deals.filter((d: any) => {
    if (!search) return true;
    return d.deal_name.toLowerCase().includes(search.toLowerCase());
  });

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
    } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Deal added"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
  };

  const moveStage = async (id: string, stage: string) => {
    await supabase.from("crm_deals").update({ deal_stage: stage, stage_entered_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-deals"] });
  };

  const totalValue = deals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const totalComm = deals.reduce((s: number, d: any) => s + (d.commission_amount || 0), 0);
  const blockers = deals.filter((d: any) => d.blocker_summary).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><Handshake className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{deals.length}</p><p className="text-[10px] text-muted-foreground">Total Deals</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">${(totalValue / 1e6).toFixed(1)}M</p><p className="text-[10px] text-muted-foreground">Pipeline Value</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">${(totalComm / 1000).toFixed(0)}K</p><p className="text-[10px] text-muted-foreground">Total Commission</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div><div><p className="text-lg font-bold text-foreground">{blockers}</p><p className="text-[10px] text-muted-foreground">Blockers</p></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")} className="text-xs h-7">Board</Button>
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Deal</Button>
      </div>

      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.filter((s: any) => s.is_visible).map((stage: any) => {
            const items = filtered.filter((d: any) => d.deal_stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[220px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} /><span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">{stage.label}</span><Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge></div>
                <div className="space-y-2">
                  {items.map((d: any) => (
                    <Card key={d.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-2.5 space-y-1.5">
                        <p className="font-medium text-xs text-foreground">{d.deal_name}</p>
                        {d.deal_value && <p className="text-[10px] text-muted-foreground">${d.deal_value.toLocaleString()}</p>}
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">{d.deal_type}</Badge>
                          {d.risk_rating === "high" && <Badge variant="destructive" className="text-[9px]">High Risk</Badge>}
                          {d.blocker_summary && <Badge variant="destructive" className="text-[9px]">Blocker</Badge>}
                        </div>
                        <Select value={d.deal_stage} onValueChange={(v) => moveStage(d.id, v)}>
                          <SelectTrigger className="h-5 text-[9px] bg-secondary/50"><SelectValue /></SelectTrigger>
                          <SelectContent>{stages.filter((s: any) => s.is_visible).map((s: any) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
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

      {view === "table" && (
        <Card className="bg-card border-border"><Table><TableHeader><TableRow><TableHead>Deal</TableHead><TableHead>Stage</TableHead><TableHead>Value</TableHead><TableHead>Type</TableHead><TableHead>EOI</TableHead><TableHead>Deposit</TableHead><TableHead>Risk</TableHead><TableHead>Settlement</TableHead></TableRow></TableHeader><TableBody>
          {filtered.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium text-sm">{d.deal_name}</TableCell>
              <TableCell><Badge style={{ backgroundColor: stages.find((s: any) => s.key === d.deal_stage)?.color, color: "#fff" }} className="text-[10px]">{stages.find((s: any) => s.key === d.deal_stage)?.label || d.deal_stage}</Badge></TableCell>
              <TableCell className="font-medium">{d.deal_value ? `$${d.deal_value.toLocaleString()}` : "—"}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{d.deal_type}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{d.eoi_status}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{d.deposit_status}</Badge></TableCell>
              <TableCell><Badge variant={d.risk_rating === "high" ? "destructive" : "outline"} className="text-[10px]">{d.risk_rating}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">{d.settlement_target_date ? format(new Date(d.settlement_target_date), "dd MMM yy") : "—"}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No deals found</TableCell></TableRow>}
        </TableBody></Table></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Deal</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Deal Name *</Label><Input value={form.deal_name} onChange={e => setForm(f => ({ ...f, deal_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Stage</Label><Select value={form.deal_stage} onValueChange={v => setForm(f => ({ ...f, deal_stage: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{stages.filter((s: any) => s.is_visible).map((s: any) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Deal Type</Label><Select value={form.deal_type} onValueChange={v => setForm(f => ({ ...f, deal_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="development">Development</SelectItem><SelectItem value="smsf">SMSF</SelectItem><SelectItem value="refinance">Refinance</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Value ($)</Label><Input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} /></div>
              <div><Label className="text-xs">Commission ($)</Label><Input type="number" value={form.commission_amount} onChange={e => setForm(f => ({ ...f, commission_amount: e.target.value }))} /></div>
              <div><Label className="text-xs">Settlement Date</Label><Input type="date" value={form.settlement_target_date} onChange={e => setForm(f => ({ ...f, settlement_target_date: e.target.value }))} /></div>
              <div><Label className="text-xs">Risk Rating</Label><Select value={form.risk_rating} onValueChange={v => setForm(f => ({ ...f, risk_rating: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">EOI Status</Label><Select value={form.eoi_status} onValueChange={v => setForm(f => ({ ...f, eoi_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="requested">Requested</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="accepted">Accepted</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Deposit Status</Label><Select value={form.deposit_status} onValueChange={v => setForm(f => ({ ...f, deposit_status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="held_in_trust">Held in Trust</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Next Action Owner</Label><Input value={form.next_action_owner} onChange={e => setForm(f => ({ ...f, next_action_owner: e.target.value }))} /></div>
              <div><Label className="text-xs">Expected Milestone</Label><Input value={form.expected_milestone} onChange={e => setForm(f => ({ ...f, expected_milestone: e.target.value }))} /></div>
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
