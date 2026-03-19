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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, DollarSign, Handshake, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Deal {
  id: string;
  deal_name: string;
  investor_id: string | null;
  property_id: string | null;
  partner_id: string | null;
  deal_stage: string;
  deal_value: number | null;
  commission_amount: number | null;
  settlement_date: string | null;
  finance_approved: boolean;
  notes: string | null;
  created_at: string;
}

export function DealsModule() {
  const { profile } = useAuth();
  const { usePipelineStages } = useBusinessCRM();
  const { data: stages = [] } = usePipelineStages("deals");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    deal_name: "", deal_stage: "prospecting", deal_value: "", commission_amount: "",
    settlement_date: "", notes: "",
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false });
      return (data || []) as Deal[];
    },
    enabled: !!profile?.business_id,
  });

  const filtered = deals.filter(d => {
    if (!searchQuery) return true;
    return d.deal_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSave = async () => {
    if (!form.deal_name.trim()) { toast.error("Deal name is required"); return; }
    const { error } = await supabase.from("crm_deals").insert({
      business_id: profile!.business_id!,
      deal_name: form.deal_name,
      deal_stage: form.deal_stage,
      deal_value: form.deal_value ? Number(form.deal_value) : null,
      commission_amount: form.commission_amount ? Number(form.commission_amount) : null,
      settlement_date: form.settlement_date || null,
      notes: form.notes || null,
    } as any);
    if (error) { toast.error("Failed to add deal"); return; }
    toast.success("Deal added");
    setDialogOpen(false);
    setForm({ deal_name: "", deal_stage: "prospecting", deal_value: "", commission_amount: "", settlement_date: "", notes: "" });
    queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
  };

  const totalValue = deals.reduce((s, d) => s + (d.deal_value || 0), 0);
  const totalCommission = deals.reduce((s, d) => s + (d.commission_amount || 0), 0);
  const formatPrice = (v: number | null) => v != null ? `$${v.toLocaleString()}` : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Handshake className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{deals.length}</p><p className="text-xs text-muted-foreground">Total Deals</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">${(totalValue / 1000000).toFixed(1)}M</p><p className="text-xs text-muted-foreground">Deal Value</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{formatPrice(totalCommission)}</p><p className="text-xs text-muted-foreground">Commission</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search deals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Deal</Button>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Settlement</TableHead>
              <TableHead>Finance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.deal_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: stages.find(s => s.key === d.deal_stage)?.color }}>
                    {stages.find(s => s.key === d.deal_stage)?.label || d.deal_stage}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{formatPrice(d.deal_value)}</TableCell>
                <TableCell>{formatPrice(d.commission_amount)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.settlement_date ? format(new Date(d.settlement_date), "dd MMM yyyy") : "—"}</TableCell>
                <TableCell>
                  <Badge variant={d.finance_approved ? "default" : "secondary"} className="text-[10px]">
                    {d.finance_approved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No deals found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Deal</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Deal Name *</Label><Input value={form.deal_name} onChange={e => setForm(f => ({ ...f, deal_name: e.target.value }))} /></div>
            <div>
              <Label className="text-xs">Deal Stage</Label>
              <Select value={form.deal_stage} onValueChange={v => setForm(f => ({ ...f, deal_stage: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.filter(s => s.is_visible).map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Deal Value ($)</Label><Input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} /></div>
              <div><Label className="text-xs">Commission ($)</Label><Input type="number" value={form.commission_amount} onChange={e => setForm(f => ({ ...f, commission_amount: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Settlement Date</Label><Input type="date" value={form.settlement_date} onChange={e => setForm(f => ({ ...f, settlement_date: e.target.value }))} /></div>
            <div><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button onClick={handleSave} className="w-full">Add Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
