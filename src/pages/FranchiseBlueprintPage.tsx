import { useState } from "react";
import { useFranchise } from "@/hooks/useFranchise";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Users } from "lucide-react";

const CANDIDATE_STATUSES = ["PROSPECT", "CONTACTED", "EVALUATING", "APPROVED", "ONBOARDING", "ACTIVE", "REJECTED"];

const FranchiseBlueprintPage = () => {
  const { models, candidates, loading, addModel, addCandidate, updateCandidateStatus } = useFranchise();
  const [mOpen, setMOpen] = useState(false);
  const [cOpen, setCOpen] = useState(false);
  const [mForm, setMForm] = useState({ region: "", entry_fee: "", revenue_share_percentage: "", required_team_size: "", projected_break_even_month: "", support_cost: "" });
  const [cForm, setCForm] = useState({ candidate_name: "", region: "", capital_available: "", experience_score: "", fit_score: "" });

  const handleAddModel = async () => {
    const ok = await addModel({ region: mForm.region, entry_fee: Number(mForm.entry_fee), revenue_share_percentage: Number(mForm.revenue_share_percentage), required_team_size: Number(mForm.required_team_size), projected_break_even_month: Number(mForm.projected_break_even_month), support_cost: Number(mForm.support_cost) });
    if (ok) { setMOpen(false); setMForm({ region: "", entry_fee: "", revenue_share_percentage: "", required_team_size: "", projected_break_even_month: "", support_cost: "" }); }
  };

  const handleAddCandidate = async () => {
    const ok = await addCandidate({ candidate_name: cForm.candidate_name, region: cForm.region, capital_available: Number(cForm.capital_available), experience_score: Number(cForm.experience_score), fit_score: Number(cForm.fit_score) });
    if (ok) { setCOpen(false); setCForm({ candidate_name: "", region: "", capital_available: "", experience_score: "", fit_score: "" }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Franchise Blueprint</h1><p className="text-muted-foreground">Global franchise launch planning</p></div>
        <div className="flex gap-2">
          <Dialog open={mOpen} onOpenChange={setMOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Model</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Franchise Model</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Region" value={mForm.region} onChange={e => setMForm(p => ({ ...p, region: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Entry fee" value={mForm.entry_fee} onChange={e => setMForm(p => ({ ...p, entry_fee: e.target.value }))} />
                  <Input type="number" placeholder="Revenue share %" value={mForm.revenue_share_percentage} onChange={e => setMForm(p => ({ ...p, revenue_share_percentage: e.target.value }))} />
                  <Input type="number" placeholder="Team size" value={mForm.required_team_size} onChange={e => setMForm(p => ({ ...p, required_team_size: e.target.value }))} />
                  <Input type="number" placeholder="Break-even (months)" value={mForm.projected_break_even_month} onChange={e => setMForm(p => ({ ...p, projected_break_even_month: e.target.value }))} />
                </div>
                <Input type="number" placeholder="Support cost" value={mForm.support_cost} onChange={e => setMForm(p => ({ ...p, support_cost: e.target.value }))} />
                <Button onClick={handleAddModel} disabled={!mForm.region} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={cOpen} onOpenChange={setCOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Candidate</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Franchise Candidate</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Candidate name" value={cForm.candidate_name} onChange={e => setCForm(p => ({ ...p, candidate_name: e.target.value }))} />
                <Input placeholder="Region" value={cForm.region} onChange={e => setCForm(p => ({ ...p, region: e.target.value }))} />
                <Input type="number" placeholder="Capital available" value={cForm.capital_available} onChange={e => setCForm(p => ({ ...p, capital_available: e.target.value }))} />
                <Input type="number" placeholder="Experience (0-100)" value={cForm.experience_score} onChange={e => setCForm(p => ({ ...p, experience_score: e.target.value }))} />
                <Input type="number" placeholder="Fit score (0-100)" value={cForm.fit_score} onChange={e => setCForm(p => ({ ...p, fit_score: e.target.value }))} />
                <Button onClick={handleAddCandidate} disabled={!cForm.candidate_name} className="w-full">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6 flex items-center gap-4"><MapPin className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Franchise Models</p><p className="text-2xl font-bold">{models.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Users className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Pipeline Candidates</p><p className="text-2xl font-bold">{candidates.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="models">
        <TabsList><TabsTrigger value="models">Models</TabsTrigger><TabsTrigger value="pipeline">Pipeline</TabsTrigger></TabsList>
        <TabsContent value="models" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            models.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No franchise models yet.</CardContent></Card> :
            models.map(m => (
              <Card key={m.id}><CardContent className="py-4">
                <p className="font-medium">{m.region}</p>
                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mt-1">
                  <span>Fee: ${m.entry_fee.toLocaleString()}</span><span>Share: {m.revenue_share_percentage}%</span><span>Break-even: {m.projected_break_even_month}mo</span>
                </div>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="pipeline" className="space-y-3 mt-4">
          {candidates.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No candidates yet.</CardContent></Card> :
            candidates.map(c => (
              <Card key={c.id}><CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{c.candidate_name}</p>
                  <p className="text-sm text-muted-foreground">{c.region} · Capital: ${c.capital_available.toLocaleString()} · Fit: {c.fit_score}</p>
                </div>
                <Select value={c.status} onValueChange={v => updateCandidateStatus(c.id, v)}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANDIDATE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FranchiseBlueprintPage;
