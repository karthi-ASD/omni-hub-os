import { useState } from "react";
import { useFundraising } from "@/hooks/useFundraising";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Plus, Users, Target } from "lucide-react";

const ROUND_TYPES = ["SEED", "PRE_A", "SERIES_A", "SERIES_B"];
const STAGES = ["IDENTIFIED", "CONTACTED", "MEETING", "DUE_DILIGENCE", "TERM_SHEET", "CLOSED"];

const FundraisingPage = () => {
  const { rounds, contacts, loading, createRound, createContact, updateContactStage } = useFundraising();
  const [roundOpen, setRoundOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [roundForm, setRoundForm] = useState({ round_type: "SEED", target_amount: "", valuation_target: "" });
  const [contactForm, setContactForm] = useState({ firm_name: "", contact_name: "", email: "", round_id: "", probability: "" });

  const handleCreateRound = async () => {
    const ok = await createRound({ round_type: roundForm.round_type, target_amount: Number(roundForm.target_amount), valuation_target: Number(roundForm.valuation_target) });
    if (ok) { setRoundOpen(false); setRoundForm({ round_type: "SEED", target_amount: "", valuation_target: "" }); }
  };

  const handleCreateContact = async () => {
    const ok = await createContact({
      firm_name: contactForm.firm_name, contact_name: contactForm.contact_name,
      email: contactForm.email || undefined, round_id: contactForm.round_id || undefined,
      probability: contactForm.probability ? Number(contactForm.probability) : undefined,
    });
    if (ok) { setContactOpen(false); setContactForm({ firm_name: "", contact_name: "", email: "", round_id: "", probability: "" }); }
  };

  const totalPipeline = contacts.reduce((s, c) => s + (c.probability / 100) * (rounds.find(r => r.id === c.round_id)?.target_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fundraising</h1>
          <p className="text-muted-foreground">Manage rounds and investor pipeline</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={roundOpen} onOpenChange={setRoundOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Round</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Fundraising Round</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Select value={roundForm.round_type} onValueChange={v => setRoundForm(p => ({ ...p, round_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROUND_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", "-")}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Target amount" value={roundForm.target_amount} onChange={e => setRoundForm(p => ({ ...p, target_amount: e.target.value }))} />
                <Input type="number" placeholder="Valuation target" value={roundForm.valuation_target} onChange={e => setRoundForm(p => ({ ...p, valuation_target: e.target.value }))} />
                <Button onClick={handleCreateRound} className="w-full">Create Round</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={contactOpen} onOpenChange={setContactOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Investor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Investor Contact</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Firm name" value={contactForm.firm_name} onChange={e => setContactForm(p => ({ ...p, firm_name: e.target.value }))} />
                <Input placeholder="Contact name" value={contactForm.contact_name} onChange={e => setContactForm(p => ({ ...p, contact_name: e.target.value }))} />
                <Input placeholder="Email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                <Input type="number" placeholder="Probability %" value={contactForm.probability} onChange={e => setContactForm(p => ({ ...p, probability: e.target.value }))} />
                {rounds.length > 0 && (
                  <Select value={contactForm.round_id} onValueChange={v => setContactForm(p => ({ ...p, round_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Link to round" /></SelectTrigger>
                    <SelectContent>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.round_type.replace("_", "-")} — ${r.target_amount.toLocaleString()}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <Button onClick={handleCreateContact} disabled={!contactForm.firm_name || !contactForm.contact_name} className="w-full">Add Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6 flex items-center gap-4"><DollarSign className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Active Rounds</p><p className="text-2xl font-bold">{rounds.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Users className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Investor Contacts</p><p className="text-2xl font-bold">{contacts.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Target className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Weighted Pipeline</p><p className="text-2xl font-bold">${Math.round(totalPipeline).toLocaleString()}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="rounds">
        <TabsList><TabsTrigger value="rounds">Rounds</TabsTrigger><TabsTrigger value="contacts">Investors</TabsTrigger></TabsList>
        <TabsContent value="rounds" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            rounds.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No rounds yet.</CardContent></Card> :
            rounds.map(r => (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{r.round_type.replace("_", "-")}</p>
                    <p className="text-sm text-muted-foreground">Target: ${r.target_amount.toLocaleString()} · Valuation: ${r.valuation_target.toLocaleString()}</p>
                  </div>
                  <Badge>{r.status}</Badge>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>
        <TabsContent value="contacts" className="space-y-3 mt-4">
          {contacts.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No investor contacts yet.</CardContent></Card> :
            contacts.map(c => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{c.firm_name}</p>
                    <p className="text-sm text-muted-foreground">{c.contact_name} · {c.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{c.probability}%</span>
                    <Select value={c.stage} onValueChange={v => updateContactStage(c.id, v)}>
                      <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FundraisingPage;
