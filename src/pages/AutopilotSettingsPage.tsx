import { useAutopilotSettings, useEscalationRules } from "@/hooks/useAutopilot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Settings, Zap, Shield, Clock, AlertTriangle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AutopilotSettingsPage = () => {
  const { settings, loading, upsert } = useAutopilotSettings();
  const { rules, create: createRule, toggle: toggleRule } = useEscalationRules();
  const [form, setForm] = useState({
    is_enabled: false,
    allowed_channels: ["email", "sms", "whatsapp"],
    quiet_hours_start: "21:00",
    quiet_hours_end: "08:00",
    timezone: "Australia/Sydney",
    max_messages_per_day: 3,
    max_messages_per_week: 10,
    escalation_enabled: false,
    default_owner_role: "SALES",
  });
  const [escForm, setEscForm] = useState({ trigger_type: "LEAD_NOT_CONTACTED", sla_minutes: 60, escalate_to_role: "MANAGER" });
  const [escOpen, setEscOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        is_enabled: settings.is_enabled ?? false,
        allowed_channels: settings.allowed_channels ?? ["email"],
        quiet_hours_start: settings.quiet_hours_start ?? "21:00",
        quiet_hours_end: settings.quiet_hours_end ?? "08:00",
        timezone: settings.timezone ?? "Australia/Sydney",
        max_messages_per_day: settings.max_messages_per_day ?? 3,
        max_messages_per_week: settings.max_messages_per_week ?? 10,
        escalation_enabled: settings.escalation_enabled ?? false,
        default_owner_role: settings.default_owner_role ?? "SALES",
      });
    }
  }, [settings]);

  const handleSave = () => upsert(form);

  const channelOptions = ["email", "sms", "whatsapp", "voice"];
  const toggleChannel = (ch: string) => {
    setForm(p => ({
      ...p,
      allowed_channels: p.allowed_channels.includes(ch)
        ? p.allowed_channels.filter((c: string) => c !== ch)
        : [...p.allowed_channels, ch],
    }));
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#d4a853]" /> Autopilot Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure AI multi-channel automation</p>
        </div>
        <Button onClick={handleSave} className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b43]">Save Settings</Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-[#111832]">
          <TabsTrigger value="general"><Zap className="h-4 w-4 mr-1" />General</TabsTrigger>
          <TabsTrigger value="channels"><Shield className="h-4 w-4 mr-1" />Channels</TabsTrigger>
          <TabsTrigger value="limits"><Clock className="h-4 w-4 mr-1" />Rate Limits</TabsTrigger>
          <TabsTrigger value="escalations"><AlertTriangle className="h-4 w-4 mr-1" />Escalations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader><CardTitle className="text-foreground">General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Enable Autopilot</Label>
                <Switch checked={form.is_enabled} onCheckedChange={v => setForm(p => ({ ...p, is_enabled: v }))} />
              </div>
              <div>
                <Label className="text-foreground">Default Owner Role</Label>
                <Select value={form.default_owner_role} onValueChange={v => setForm(p => ({ ...p, default_owner_role: v }))}>
                  <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">Timezone</Label>
                <Input value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Escalation Enabled</Label>
                <Switch checked={form.escalation_enabled} onCheckedChange={v => setForm(p => ({ ...p, escalation_enabled: v }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader><CardTitle className="text-foreground">Allowed Channels</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {channelOptions.map(ch => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.allowed_channels.includes(ch) ? "bg-[#d4a853]/20 border-[#d4a853] text-[#d4a853]" : "bg-[#111832] border-[#1e2a4a] text-muted-foreground"}`}>
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader><CardTitle className="text-foreground">Rate Limits & Quiet Hours</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Max messages/day</Label>
                  <Input type="number" value={form.max_messages_per_day} onChange={e => setForm(p => ({ ...p, max_messages_per_day: +e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground">Max messages/week</Label>
                  <Input type="number" value={form.max_messages_per_week} onChange={e => setForm(p => ({ ...p, max_messages_per_week: +e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Quiet hours start</Label>
                  <Input type="time" value={form.quiet_hours_start} onChange={e => setForm(p => ({ ...p, quiet_hours_start: e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground">Quiet hours end</Label>
                  <Input type="time" value={form.quiet_hours_end} onChange={e => setForm(p => ({ ...p, quiet_hours_end: e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalations">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Escalation Rules</CardTitle>
                <Dialog open={escOpen} onOpenChange={setEscOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#d4a853] text-[#0a0e1a]"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d1117] border-[#1e2a4a]">
                    <DialogHeader><DialogTitle className="text-foreground">New Escalation Rule</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-foreground">Trigger</Label>
                        <Select value={escForm.trigger_type} onValueChange={v => setEscForm(p => ({ ...p, trigger_type: v }))}>
                          <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEAD_NOT_CONTACTED">Lead Not Contacted</SelectItem>
                            <SelectItem value="NO_RESPONSE">No Response</SelectItem>
                            <SelectItem value="PAYMENT_OVERDUE">Payment Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">SLA (minutes)</Label>
                        <Input type="number" value={escForm.sla_minutes} onChange={e => setEscForm(p => ({ ...p, sla_minutes: +e.target.value }))} className="bg-[#111832] border-[#1e2a4a] text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground">Escalate to</Label>
                        <Select value={escForm.escalate_to_role} onValueChange={v => setEscForm(p => ({ ...p, escalate_to_role: v }))}>
                          <SelectTrigger className="bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="CEO">CEO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => { createRule(escForm); setEscOpen(false); }} className="w-full bg-[#d4a853] text-[#0a0e1a]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No escalation rules configured.</p>
              ) : (
                <div className="space-y-2">
                  {rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                      <div>
                        <span className="text-sm font-medium text-foreground">{r.trigger_type.replace(/_/g, " ")}</span>
                        <span className="text-xs text-muted-foreground ml-2">→ {r.escalate_to_role} after {r.sla_minutes}min</span>
                      </div>
                      <Switch checked={r.is_active} onCheckedChange={v => toggleRule(r.id, v)} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutopilotSettingsPage;
