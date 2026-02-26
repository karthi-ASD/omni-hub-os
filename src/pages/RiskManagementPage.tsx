import { useState } from "react";
import { useRiskRegister } from "@/hooks/useRiskRegister";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";

const CATEGORIES = ["TECH", "FINANCIAL", "LEGAL", "MARKET"];
const IMPACTS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["OPEN", "MITIGATING", "RESOLVED", "ACCEPTED"];

const RiskManagementPage = () => {
  const { risks, loading, create, updateStatus } = useRiskRegister();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ risk_category: "TECH", description: "", impact_level: "MEDIUM", mitigation_plan: "", owner: "" });

  const handleCreate = async () => {
    const ok = await create({ ...form, mitigation_plan: form.mitigation_plan || undefined, owner: form.owner || undefined });
    if (ok) { setOpen(false); setForm({ risk_category: "TECH", description: "", impact_level: "MEDIUM", mitigation_plan: "", owner: "" }); }
  };

  const impactColor = (l: string) => {
    if (l === "CRITICAL") return "destructive";
    if (l === "HIGH") return "destructive";
    if (l === "MEDIUM") return "default";
    return "secondary";
  };

  const openRisks = risks.filter(r => r.status === "OPEN" || r.status === "MITIGATING").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground">Enterprise risk register & mitigation tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Risk</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Risk</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={form.risk_category} onValueChange={v => setForm(p => ({ ...p, risk_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Select value={form.impact_level} onValueChange={v => setForm(p => ({ ...p, impact_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IMPACTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Mitigation plan" value={form.mitigation_plan} onChange={e => setForm(p => ({ ...p, mitigation_plan: e.target.value }))} />
              <Input placeholder="Owner" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.description} className="w-full">Register Risk</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><ShieldAlert className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Total Risks</p><p className="text-2xl font-bold">{risks.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Open / Mitigating</p><p className="text-2xl font-bold">{openRisks}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><ShieldAlert className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{risks.filter(r => r.status === "RESOLVED").length}</p></div></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : risks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No risks registered yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {risks.map(r => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{r.risk_category}</Badge>
                    <Badge variant={impactColor(r.impact_level) as any}>{r.impact_level}</Badge>
                  </div>
                  <p className="text-sm font-medium">{r.description}</p>
                  {r.mitigation_plan && <p className="text-xs text-muted-foreground mt-1">Mitigation: {r.mitigation_plan}</p>}
                  {r.owner && <p className="text-xs text-muted-foreground">Owner: {r.owner}</p>}
                </div>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiskManagementPage;
