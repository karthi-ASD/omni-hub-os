import { useAutopilotSequences, useAutopilotSteps } from "@/hooks/useAutopilot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, Workflow, Trash2, ArrowRight } from "lucide-react";

const purposeColors: Record<string, string> = {
  NEW_LEAD: "bg-green-500/20 text-green-400",
  NO_RESPONSE: "bg-yellow-500/20 text-yellow-400",
  QUOTE_FOLLOWUP: "bg-blue-500/20 text-blue-400",
  LOST_LEAD_WINBACK: "bg-red-500/20 text-red-400",
};

const AutopilotSequencesPage = () => {
  const { sequences, create } = useAutopilotSequences();
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);
  const { steps, addStep, removeStep } = useAutopilotSteps(selectedSeq);
  const [newSeq, setNewSeq] = useState({ name: "", purpose: "NEW_LEAD" });
  const [seqOpen, setSeqOpen] = useState(false);
  const [stepOpen, setStepOpen] = useState(false);
  const [newStep, setNewStep] = useState({ step_order: 1, delay_minutes: 60, channel: "EMAIL", ai_enabled: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Workflow className="h-6 w-6 text-[#d4a853]" /> Autopilot Sequences
          </h1>
          <p className="text-sm text-muted-foreground">Build multi-step follow-up sequences</p>
        </div>
        <Dialog open={seqOpen} onOpenChange={setSeqOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4a853] text-[#0a0e1a]"><Plus className="h-4 w-4 mr-1" />New Sequence</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-[#1e2a4a]">
            <DialogHeader><DialogTitle className="text-foreground">Create Sequence</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-foreground">Name</Label><Input value={newSeq.name} onChange={e => setNewSeq(p => ({ ...p, name: e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" /></div>
              <div>
                <Label className="text-foreground">Purpose</Label>
                <Select value={newSeq.purpose} onValueChange={v => setNewSeq(p => ({ ...p, purpose: v }))}>
                  <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_LEAD">New Lead</SelectItem>
                    <SelectItem value="NO_RESPONSE">No Response</SelectItem>
                    <SelectItem value="QUOTE_FOLLOWUP">Quote Follow-up</SelectItem>
                    <SelectItem value="LOST_LEAD_WINBACK">Lost Lead Winback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { create(newSeq); setSeqOpen(false); setNewSeq({ name: "", purpose: "NEW_LEAD" }); }} className="w-full bg-[#d4a853] text-[#0a0e1a]">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sequence list */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#d4a853] uppercase tracking-wider">Sequences</p>
          {sequences.map(s => (
            <button key={s.id} onClick={() => setSelectedSeq(s.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSeq === s.id ? "bg-[#1e2a4a] border-[#d4a853]/40" : "bg-[#0d1117] border-[#1e2a4a] hover:bg-[#111832]"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                <Badge className={purposeColors[s.purpose] || "bg-gray-500/20 text-gray-400"}>{s.purpose.replace(/_/g, " ")}</Badge>
              </div>
            </button>
          ))}
          {sequences.length === 0 && <p className="text-sm text-muted-foreground p-3">No sequences yet.</p>}
        </div>

        {/* Steps editor */}
        <div className="lg:col-span-2">
          {selectedSeq ? (
            <Card className="bg-[#0d1117] border-[#1e2a4a]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Steps</CardTitle>
                  <Dialog open={stepOpen} onOpenChange={setStepOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#d4a853] text-[#0a0e1a]"><Plus className="h-4 w-4 mr-1" />Add Step</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0d1117] border-[#1e2a4a]">
                      <DialogHeader><DialogTitle className="text-foreground">Add Step</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label className="text-foreground">Order</Label><Input type="number" value={newStep.step_order} onChange={e => setNewStep(p => ({ ...p, step_order: +e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" /></div>
                          <div><Label className="text-foreground">Delay (min)</Label><Input type="number" value={newStep.delay_minutes} onChange={e => setNewStep(p => ({ ...p, delay_minutes: +e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" /></div>
                        </div>
                        <div>
                          <Label className="text-foreground">Channel</Label>
                          <Select value={newStep.channel} onValueChange={v => setNewStep(p => ({ ...p, channel: v }))}>
                            <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EMAIL">Email</SelectItem>
                              <SelectItem value="SMS">SMS</SelectItem>
                              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                              <SelectItem value="VOICE">Voice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={() => { addStep(newStep); setStepOpen(false); }} className="w-full bg-[#d4a853] text-[#0a0e1a]">Add</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No steps. Add your first step above.</p>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                          <div className="h-8 w-8 rounded-full bg-[#d4a853]/20 flex items-center justify-center text-sm font-bold text-[#d4a853]">{step.step_order}</div>
                          <div className="flex-1">
                            <Badge variant="outline" className="text-foreground border-[#1e2a4a]">{step.channel}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">after {step.delay_minutes} min</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                        </div>
                        {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Select a sequence to edit steps
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutopilotSequencesPage;
