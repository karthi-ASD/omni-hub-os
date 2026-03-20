import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Zap, Plus, MessageSquare, Mail, Phone, UserCheck, Clock, AlertTriangle } from "lucide-react";

const ACTION_TYPES = [
  { key: "send_whatsapp", label: "Send WhatsApp", icon: MessageSquare },
  { key: "send_email", label: "Send Email", icon: Mail },
  { key: "auto_score", label: "Auto Score Lead", icon: Zap },
  { key: "assign_round_robin", label: "Auto-Assign (Round Robin)", icon: UserCheck },
  { key: "create_followup", label: "Create Follow-Up Task", icon: Clock },
  { key: "sla_alert", label: "SLA Breach Alert", icon: AlertTriangle },
];

const TRIGGER_EVENTS = [
  { key: "lead_created", label: "New Lead Created" },
  { key: "lead_uncontacted_1h", label: "Lead Uncontacted > 1 Hour" },
  { key: "lead_uncontacted_24h", label: "Lead Uncontacted > 24 Hours" },
  { key: "lead_stale_7d", label: "Lead Stale > 7 Days" },
  { key: "followup_overdue", label: "Follow-Up Overdue" },
  { key: "lead_reengagement", label: "Lost Lead Re-engagement" },
];

export function LeadAutomationPanel() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const bid = profile?.business_id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rule_name: "", trigger_event: "lead_created", action_type: "auto_score" });

  const { data: rules = [] } = useQuery({
    queryKey: ["lead-automation-rules", bid],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_lead_automation_rules")
        .select("*")
        .eq("business_id", bid!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid,
  });

  const handleCreate = async () => {
    if (!form.rule_name.trim()) { toast.error("Rule name required"); return; }
    const { error } = await supabase.from("crm_lead_automation_rules").insert({
      business_id: bid!,
      rule_name: form.rule_name,
      trigger_event: form.trigger_event,
      action_type: form.action_type,
    } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Automation rule created");
    setOpen(false);
    setForm({ rule_name: "", trigger_event: "lead_created", action_type: "auto_score" });
    qc.invalidateQueries({ queryKey: ["lead-automation-rules"] });
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("crm_lead_automation_rules").update({ is_enabled: !enabled } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["lead-automation-rules"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />Lead Automation Rules
          </h3>
          <p className="text-[10px] text-muted-foreground">Automate lead processing, scoring, and follow-ups</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />Add Rule
        </Button>
      </div>

      {/* Default automation display */}
      <div className="grid gap-2">
        {[
          { label: "Auto-Score on Entry", trigger: "New lead → Score & classify", active: true },
          { label: "WhatsApp Welcome", trigger: "New lead → Send intro message", active: true },
          { label: "Email Confirmation", trigger: "New lead → Send email", active: true },
          { label: "1-Hour SLA Alert", trigger: "Uncontacted > 1hr → Alert admin", active: true },
          { label: "24-Hour Escalation", trigger: "Uncontacted > 24hr → Escalate", active: true },
          { label: "Lost Lead Re-engage", trigger: "Lost 30d → Send re-engagement", active: false },
        ].map((item) => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={`h-4 w-4 ${item.active ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.active ? "default" : "secondary"} className="text-[10px]">
                  {item.active ? "Active" : "Off"}
                </Badge>
                <Switch checked={item.active} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Custom Rules</p>
          {rules.map((r: any) => (
            <Card key={r.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.rule_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {TRIGGER_EVENTS.find(t => t.key === r.trigger_event)?.label} → {ACTION_TYPES.find(a => a.key === r.action_type)?.label}
                  </p>
                </div>
                <Switch checked={r.is_enabled} onCheckedChange={() => toggleRule(r.id, r.is_enabled)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Automation Rule</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Rule Name</Label><Input value={form.rule_name} onChange={e => setForm(f => ({ ...f, rule_name: e.target.value }))} placeholder="e.g. Auto-assign hot leads" /></div>
            <div><Label className="text-xs">Trigger</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGER_EVENTS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Action</Label>
              <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Rule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
