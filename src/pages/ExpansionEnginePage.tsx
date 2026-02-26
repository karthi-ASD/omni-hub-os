import { useState } from "react";
import { useExpansionEngine } from "@/hooks/useExpansionEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, Plus, TrendingUp, MapPin } from "lucide-react";

const ExpansionEnginePage = () => {
  const { targets, strategies, loading, addTarget, addStrategy } = useExpansionEngine();
  const [tOpen, setTOpen] = useState(false);
  const [sOpen, setSOpen] = useState(false);
  const [tForm, setTForm] = useState({ region: "", industry: "", demand_score: "", partner_gap_score: "", seo_opportunity_score: "", sales_density: "" });
  const [sForm, setSForm] = useState({ target_region: "", recommended_action: "RECRUIT_PARTNER", projected_roi: "", confidence: "" });

  const handleAddTarget = async () => {
    const ok = await addTarget({ region: tForm.region, industry: tForm.industry || undefined, demand_score: Number(tForm.demand_score), partner_gap_score: Number(tForm.partner_gap_score), seo_opportunity_score: Number(tForm.seo_opportunity_score), sales_density: Number(tForm.sales_density) });
    if (ok) { setTOpen(false); setTForm({ region: "", industry: "", demand_score: "", partner_gap_score: "", seo_opportunity_score: "", sales_density: "" }); }
  };

  const handleAddStrategy = async () => {
    const ok = await addStrategy({ target_region: sForm.target_region, recommended_action: sForm.recommended_action, projected_roi: Number(sForm.projected_roi), confidence: Number(sForm.confidence) });
    if (ok) { setSOpen(false); setSForm({ target_region: "", recommended_action: "RECRUIT_PARTNER", projected_roi: "", confidence: "" }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Expansion Engine</h1><p className="text-muted-foreground">Autonomous regional expansion intelligence</p></div>
        <div className="flex gap-2">
          <Dialog open={tOpen} onOpenChange={setTOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Target</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expansion Target</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Region" value={tForm.region} onChange={e => setTForm(p => ({ ...p, region: e.target.value }))} />
                <Input placeholder="Industry" value={tForm.industry} onChange={e => setTForm(p => ({ ...p, industry: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Demand (0-100)" value={tForm.demand_score} onChange={e => setTForm(p => ({ ...p, demand_score: e.target.value }))} />
                  <Input type="number" placeholder="Partner gap (0-100)" value={tForm.partner_gap_score} onChange={e => setTForm(p => ({ ...p, partner_gap_score: e.target.value }))} />
                  <Input type="number" placeholder="SEO opp. (0-100)" value={tForm.seo_opportunity_score} onChange={e => setTForm(p => ({ ...p, seo_opportunity_score: e.target.value }))} />
                  <Input type="number" placeholder="Sales density" value={tForm.sales_density} onChange={e => setTForm(p => ({ ...p, sales_density: e.target.value }))} />
                </div>
                <Button onClick={handleAddTarget} disabled={!tForm.region} className="w-full">Add Target</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={sOpen} onOpenChange={setSOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Strategy</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expansion Strategy</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Target region" value={sForm.target_region} onChange={e => setSForm(p => ({ ...p, target_region: e.target.value }))} />
                <Input placeholder="Action (e.g. RECRUIT_PARTNER)" value={sForm.recommended_action} onChange={e => setSForm(p => ({ ...p, recommended_action: e.target.value }))} />
                <Input type="number" placeholder="Projected ROI %" value={sForm.projected_roi} onChange={e => setSForm(p => ({ ...p, projected_roi: e.target.value }))} />
                <Input type="number" placeholder="Confidence (0-100)" value={sForm.confidence} onChange={e => setSForm(p => ({ ...p, confidence: e.target.value }))} />
                <Button onClick={handleAddStrategy} disabled={!sForm.target_region} className="w-full">Add Strategy</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><MapPin className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Target Regions</p><p className="text-2xl font-bold">{targets.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><TrendingUp className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Strategies</p><p className="text-2xl font-bold">{strategies.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Globe className="h-8 w-8 text-info" /><div><p className="text-sm text-muted-foreground">Avg Demand Score</p><p className="text-2xl font-bold">{targets.length ? Math.round(targets.reduce((s, t) => s + t.demand_score, 0) / targets.length) : 0}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="targets">
        <TabsList><TabsTrigger value="targets">Targets</TabsTrigger><TabsTrigger value="strategies">Strategies</TabsTrigger></TabsList>
        <TabsContent value="targets" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            targets.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No expansion targets yet.</CardContent></Card> :
            targets.map(t => (
              <Card key={t.id}><CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{t.region}</p>
                  {t.industry && <Badge variant="outline">{t.industry}</Badge>}
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <span>Demand: {t.demand_score}</span><span>Partner Gap: {t.partner_gap_score}</span>
                  <span>SEO: {t.seo_opportunity_score}</span><span>Density: {t.sales_density}</span>
                </div>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="strategies" className="space-y-3 mt-4">
          {strategies.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No strategies yet.</CardContent></Card> :
            strategies.map(s => (
              <Card key={s.id}><CardContent className="flex items-center justify-between py-4">
                <div><p className="font-medium">{s.target_region}</p><p className="text-sm text-muted-foreground">{s.recommended_action}</p></div>
                <div className="text-right"><p className="text-sm font-medium">{s.projected_roi}% ROI</p><p className="text-xs text-muted-foreground">{s.confidence}% confidence</p></div>
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpansionEnginePage;
