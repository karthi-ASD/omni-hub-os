import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Plus } from "lucide-react";
import { useCSAutomationRules } from "@/hooks/useCSAutomationRules";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const CSAutomationPage = () => {
  usePageTitle("CS Automation Rules");
  const { rules, loading, create, toggleRule } = useCSAutomationRules();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger_event: "", action_type: "" });

  const handleCreate = async () => {
    if (!form.name || !form.trigger_event || !form.action_type) return;
    await create(form);
    toast({ title: "Automation rule created" });
    setOpen(false);
    setForm({ name: "", description: "", trigger_event: "", action_type: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Automation Rules</h1>
            <p className="text-xs text-muted-foreground">Automate customer service workflows</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Automation Rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Trigger Event *</Label><Input placeholder="e.g. New Email, Ticket Created" value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} /></div>
              <div><Label>Action *</Label><Input placeholder="e.g. Create Ticket, Assign Agent" value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-foreground">{rules.length}</p><p className="text-[10px] text-muted-foreground">Total Rules</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">{rules.filter((r: any) => r.is_enabled).length}</p><p className="text-[10px] text-muted-foreground">Active</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{rules.reduce((s: number, r: any) => s + (r.runs_count || 0), 0)}</p><p className="text-[10px] text-muted-foreground">Total Runs</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No automation rules yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rules.map((a: any) => (
            <Card key={a.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    {a.description && <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>}
                  </div>
                  <Switch checked={a.is_enabled} onCheckedChange={(v) => toggleRule(a.id, v)} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.trigger_event}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{a.action_type}</Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">{a.runs_count} runs</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CSAutomationPage;
