import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ArrowRight, Plus, Mail, Ticket, Clock, Users, AlertTriangle, MessageSquare } from "lucide-react";
import { useCSAutomationRules } from "@/hooks/useCSAutomationRules";
import { toast } from "@/hooks/use-toast";

const prebuiltTemplates = [
  { name: "Auto-create ticket from email", trigger_event: "New Email Received", action_type: "Create Ticket", description: "Automatically create a support ticket when a new customer email arrives", icon: Mail },
  { name: "SLA breach escalation", trigger_event: "SLA Due Date Passed", action_type: "Escalate to Manager", description: "Auto-escalate tickets that breach SLA deadlines", icon: AlertTriangle },
  { name: "Auto-assign by department", trigger_event: "Ticket Created", action_type: "Route to Department", description: "Route tickets to the correct department based on category", icon: Users },
  { name: "Auto follow-up on no reply", trigger_event: "No Customer Reply (48h)", action_type: "Send Follow-up", description: "Send automated follow-up if customer hasn't replied in 48 hours", icon: Clock },
  { name: "CSAT survey on closure", trigger_event: "Ticket Resolved", action_type: "Send CSAT Survey", description: "Automatically send satisfaction survey when ticket is resolved", icon: MessageSquare },
  { name: "Auto-close resolved tickets", trigger_event: "Resolved (7 days)", action_type: "Close Ticket", description: "Auto-close tickets that stay resolved for 7 days without reopening", icon: Ticket },
];

const CSAutomationPage = () => {
  usePageTitle("CS Automation Rules");
  const { rules, loading, create, toggleRule } = useCSAutomationRules();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger_event: "", action_type: "" });
  const [activeTab, setActiveTab] = useState("rules");

  const handleCreate = async () => {
    if (!form.name || !form.trigger_event || !form.action_type) return;
    await create(form);
    toast({ title: "Automation rule created" });
    setOpen(false);
    setForm({ name: "", description: "", trigger_event: "", action_type: "" });
  };

  const handleUseTemplate = async (template: typeof prebuiltTemplates[0]) => {
    await create({
      name: template.name,
      description: template.description,
      trigger_event: template.trigger_event,
      action_type: template.action_type,
    });
    toast({ title: `"${template.name}" rule created` });
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
              <div>
                <Label>Trigger Event *</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                  <SelectContent>
                    {["New Email Received", "Ticket Created", "Ticket Updated", "SLA Due Date Passed", "No Customer Reply (48h)", "Ticket Resolved", "Resolved (7 days)"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Action *</Label>
                <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                  <SelectContent>
                    {["Create Ticket", "Route to Department", "Assign Agent", "Escalate to Manager", "Send Follow-up", "Send CSAT Survey", "Close Ticket", "Add Tag", "Send Notification"].map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-foreground">{rules.length}</p><p className="text-[10px] text-muted-foreground">Total Rules</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-success">{rules.filter((r: any) => r.is_enabled).length}</p><p className="text-[10px] text-muted-foreground">Active</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{rules.reduce((s: number, r: any) => s + (r.runs_count || 0), 0)}</p><p className="text-[10px] text-muted-foreground">Total Runs</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="rules" className="text-xs">Active Rules</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : rules.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No automation rules yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use a template or create a custom rule</p>
            </CardContent></Card>
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
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="space-y-3">
            {prebuiltTemplates.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <t.icon className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.trigger_event}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.action_type}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleUseTemplate(t)}>
                      <Plus className="h-3 w-3 mr-1" /> Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSAutomationPage;
