import { useState } from "react";
import { useAcquisitions } from "@/hooks/useAcquisitions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building, Calculator } from "lucide-react";

const STATUSES = ["IDENTIFIED", "EVALUATING", "DUE_DILIGENCE", "NEGOTIATING", "CLOSED", "REJECTED"];

const AcquisitionsPage = () => {
  const { targets, scenarios, loading, addTarget, addScenario, updateTargetStatus } = useAcquisitions();
  const [tOpen, setTOpen] = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const [tForm, setTForm] = useState({ company_name: "", arr: "", churn_rate: "", margin: "", tech_stack: "", acquisition_score: "" });
  const [sForm, setSForm] = useState({ target_id: "", purchase_price: "", projected_synergy: "", cost_savings: "", roi_projection: "" });

  const handleAddTarget = async () => {
    const ok = await addTarget({ company_name: tForm.company_name, arr: Number(tForm.arr), churn_rate: Number(tForm.churn_rate), margin: Number(tForm.margin), tech_stack: tForm.tech_stack || undefined, acquisition_score: Number(tForm.acquisition_score) });
    if (ok) { setTOpen(false); setTForm({ company_name: "", arr: "", churn_rate: "", margin: "", tech_stack: "", acquisition_score: "" }); }
  };

  const handleAddScenario = async () => {
    const ok = await addScenario({ target_id: sForm.target_id, purchase_price: Number(sForm.purchase_price), projected_synergy: Number(sForm.projected_synergy), cost_savings: Number(sForm.cost_savings), roi_projection: Number(sForm.roi_projection) });
    if (ok) { setSOpen(false); setSForm({ target_id: "", purchase_price: "", projected_synergy: "", cost_savings: "", roi_projection: "" }); }
  };

  const totalArr = targets.reduce((s, t) => s + t.arr, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Acquisitions</h1><p className="text-muted-foreground">SaaS roll-up acquisition machine</p></div>
        <div className="flex gap-2">
          <Dialog open={tOpen} onOpenChange={setTOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Target</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Acquisition Target</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Company name" value={tForm.company_name} onChange={e => setTForm(p => ({ ...p, company_name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="ARR" value={tForm.arr} onChange={e => setTForm(p => ({ ...p, arr: e.target.value }))} />
                  <Input type="number" placeholder="Churn %" value={tForm.churn_rate} onChange={e => setTForm(p => ({ ...p, churn_rate: e.target.value }))} />
                  <Input type="number" placeholder="Margin %" value={tForm.margin} onChange={e => setTForm(p => ({ ...p, margin: e.target.value }))} />
                  <Input type="number" placeholder="Score (0-100)" value={tForm.acquisition_score} onChange={e => setTForm(p => ({ ...p, acquisition_score: e.target.value }))} />
                </div>
                <Input placeholder="Tech stack" value={tForm.tech_stack} onChange={e => setTForm(p => ({ ...p, tech_stack: e.target.value }))} />
                <Button onClick={handleAddTarget} disabled={!tForm.company_name} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={sOpen} onOpenChange={setSOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Scenario</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Model Acquisition Scenario</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Select value={sForm.target_id} onValueChange={v => setSForm(p => ({ ...p, target_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                  <SelectContent>{targets.map(t => <SelectItem key={t.id} value={t.id}>{t.company_name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Purchase price" value={sForm.purchase_price} onChange={e => setSForm(p => ({ ...p, purchase_price: e.target.value }))} />
                <Input type="number" placeholder="Projected synergy" value={sForm.projected_synergy} onChange={e => setSForm(p => ({ ...p, projected_synergy: e.target.value }))} />
                <Input type="number" placeholder="Cost savings" value={sForm.cost_savings} onChange={e => setSForm(p => ({ ...p, cost_savings: e.target.value }))} />
                <Input type="number" placeholder="ROI projection %" value={sForm.roi_projection} onChange={e => setSForm(p => ({ ...p, roi_projection: e.target.value }))} />
                <Button onClick={handleAddScenario} disabled={!sForm.target_id} className="w-full">Create Scenario</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Building className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Targets</p><p className="text-2xl font-bold">{targets.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Calculator className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Scenarios</p><p className="text-2xl font-bold">{scenarios.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Building className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Total Target ARR</p><p className="text-2xl font-bold">${totalArr.toLocaleString()}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="targets">
        <TabsList><TabsTrigger value="targets">Targets</TabsTrigger><TabsTrigger value="scenarios">Scenarios</TabsTrigger></TabsList>
        <TabsContent value="targets" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            targets.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No acquisition targets yet.</CardContent></Card> :
            targets.map(t => (
              <Card key={t.id}><CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{t.company_name}</p>
                  <p className="text-sm text-muted-foreground">ARR: ${t.arr.toLocaleString()} · Margin: {t.margin}% · Churn: {t.churn_rate}%</p>
                  {t.tech_stack && <p className="text-xs text-muted-foreground">{t.tech_stack}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Score: {t.acquisition_score}</Badge>
                  <Select value={t.status} onValueChange={v => updateTargetStatus(t.id, v)}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="scenarios" className="space-y-3 mt-4">
          {scenarios.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No scenarios yet.</CardContent></Card> :
            scenarios.map(s => {
              const target = targets.find(t => t.id === s.target_id);
              return (
                <Card key={s.id}><CardContent className="py-4">
                  <p className="font-medium">{target?.company_name || "Unknown"}</p>
                  <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground mt-1">
                    <span>Price: ${s.purchase_price.toLocaleString()}</span>
                    <span>Synergy: ${s.projected_synergy.toLocaleString()}</span>
                    <span>Savings: ${s.cost_savings.toLocaleString()}</span>
                    <span>ROI: {s.roi_projection}%</span>
                  </div>
                </CardContent></Card>
              );
            })
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcquisitionsPage;
