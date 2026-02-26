import { useState } from "react";
import { useCapitalAllocation } from "@/hooks/useCapitalAllocation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingUp } from "lucide-react";

const SCENARIO_TYPES = ["MARKETING", "ACQUISITION", "INFRASTRUCTURE", "AI_R&D"];

const CapitalAllocationPage = () => {
  const { models, loading, add } = useCapitalAllocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ scenario_type: "MARKETING", investment_amount: "", projected_roi: "", time_horizon: "12", risk_score: "50" });

  const handleAdd = async () => {
    const ok = await add({ scenario_type: form.scenario_type, investment_amount: Number(form.investment_amount), projected_roi: Number(form.projected_roi), time_horizon: Number(form.time_horizon), risk_score: Number(form.risk_score) });
    if (ok) { setOpen(false); setForm({ scenario_type: "MARKETING", investment_amount: "", projected_roi: "", time_horizon: "12", risk_score: "50" }); }
  };

  const totalInvestment = models.reduce((s, m) => s + m.investment_amount, 0);
  const avgRoi = models.length ? Math.round(models.reduce((s, m) => s + m.projected_roi, 0) / models.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Capital Allocation</h1><p className="text-muted-foreground">Strategic investment scenario modeling</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Scenario</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Investment Scenario</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={form.scenario_type} onValueChange={v => setForm(p => ({ ...p, scenario_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SCENARIO_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Investment amount" value={form.investment_amount} onChange={e => setForm(p => ({ ...p, investment_amount: e.target.value }))} />
              <Input type="number" placeholder="Projected ROI %" value={form.projected_roi} onChange={e => setForm(p => ({ ...p, projected_roi: e.target.value }))} />
              <Input type="number" placeholder="Time horizon (months)" value={form.time_horizon} onChange={e => setForm(p => ({ ...p, time_horizon: e.target.value }))} />
              <Input type="number" placeholder="Risk score (0-100)" value={form.risk_score} onChange={e => setForm(p => ({ ...p, risk_score: e.target.value }))} />
              <Button onClick={handleAdd} disabled={!form.investment_amount} className="w-full">Create Scenario</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><DollarSign className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Total Modeled</p><p className="text-2xl font-bold">${totalInvestment.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><TrendingUp className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Avg ROI</p><p className="text-2xl font-bold">{avgRoi}%</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><DollarSign className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Scenarios</p><p className="text-2xl font-bold">{models.length}</p></div></CardContent></Card>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
        models.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No capital allocation scenarios yet.</CardContent></Card> :
        <div className="space-y-3">
          {models.map(m => (
            <Card key={m.id}><CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-2 mb-1"><Badge variant="outline">{m.scenario_type.replace("_", " ")}</Badge></div>
                <p className="text-sm text-muted-foreground">Invest: ${m.investment_amount.toLocaleString()} · ROI: {m.projected_roi}% · {m.time_horizon}mo horizon</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Risk: {m.risk_score}/100</p>
                <p className="text-xs text-muted-foreground">Return: ${Math.round(m.investment_amount * (1 + m.projected_roi / 100)).toLocaleString()}</p>
              </div>
            </CardContent></Card>
          ))}
        </div>
      }
    </div>
  );
};

export default CapitalAllocationPage;
