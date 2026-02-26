import { useState } from "react";
import { useCompetitiveIntel } from "@/hooks/useCompetitiveIntel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Swords } from "lucide-react";

const THREAT_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const CompetitiveIntelPage = () => {
  const { competitors, loading, add } = useCompetitiveIntel();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_name: "", estimated_arr: "", feature_overlap_score: "", strength_score: "", threat_level: "MEDIUM", pricing_comparison: "" });

  const handleAdd = async () => {
    const ok = await add({ company_name: form.company_name, estimated_arr: Number(form.estimated_arr), feature_overlap_score: Number(form.feature_overlap_score), strength_score: Number(form.strength_score), threat_level: form.threat_level, pricing_comparison: form.pricing_comparison || undefined });
    if (ok) { setOpen(false); setForm({ company_name: "", estimated_arr: "", feature_overlap_score: "", strength_score: "", threat_level: "MEDIUM", pricing_comparison: "" }); }
  };

  const threatColor = (l: string) => l === "CRITICAL" || l === "HIGH" ? "destructive" : l === "MEDIUM" ? "default" : "secondary";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Competitive Intelligence</h1><p className="text-muted-foreground">Market positioning & competitor tracking</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Competitor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Company name" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} />
              <Input type="number" placeholder="Estimated ARR" value={form.estimated_arr} onChange={e => setForm(p => ({ ...p, estimated_arr: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Feature overlap (0-100)" value={form.feature_overlap_score} onChange={e => setForm(p => ({ ...p, feature_overlap_score: e.target.value }))} />
                <Input type="number" placeholder="Strength (0-100)" value={form.strength_score} onChange={e => setForm(p => ({ ...p, strength_score: e.target.value }))} />
              </div>
              <Select value={form.threat_level} onValueChange={v => setForm(p => ({ ...p, threat_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{THREAT_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Pricing comparison notes" value={form.pricing_comparison} onChange={e => setForm(p => ({ ...p, pricing_comparison: e.target.value }))} />
              <Button onClick={handleAdd} disabled={!form.company_name} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Eye className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Tracked</p><p className="text-2xl font-bold">{competitors.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Swords className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">High/Critical Threats</p><p className="text-2xl font-bold">{competitors.filter(c => c.threat_level === "HIGH" || c.threat_level === "CRITICAL").length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Eye className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Avg Feature Overlap</p><p className="text-2xl font-bold">{competitors.length ? Math.round(competitors.reduce((s, c) => s + c.feature_overlap_score, 0) / competitors.length) : 0}%</p></div></CardContent></Card>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
        competitors.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No competitors tracked yet.</CardContent></Card> :
        <div className="space-y-3">
          {competitors.map(c => (
            <Card key={c.id}><CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-2 mb-1"><p className="font-medium">{c.company_name}</p><Badge variant={threatColor(c.threat_level) as any}>{c.threat_level}</Badge></div>
                <p className="text-sm text-muted-foreground">ARR: ${c.estimated_arr.toLocaleString()} · Overlap: {c.feature_overlap_score}% · Strength: {c.strength_score}</p>
                {c.pricing_comparison && <p className="text-xs text-muted-foreground mt-1">{c.pricing_comparison}</p>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      }
    </div>
  );
};

export default CompetitiveIntelPage;
