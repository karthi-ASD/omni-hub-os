import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Zap, ArrowRight, Clock, Bell, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";

const CHANNEL_ICONS: Record<string, React.ElementType> = { system: Bell, email: Mail, sms: MessageSquare, whatsapp: MessageSquare, call: Phone };

const DEFAULT_AUTOMATIONS = [
  { name: "New Lead Acknowledgement", trigger: "New lead created", condition: "Has email or phone", action: "Send welcome message", channel: "email" },
  { name: "Preferred Callback Request", trigger: "Lead created with callback time", condition: "Preferred callback set", action: "Create callback task", channel: "system" },
  { name: "No-Contact SLA Alert", trigger: "Lead not contacted in 24h", condition: "Stage = New", action: "Alert assigned advisor", channel: "system" },
  { name: "Follow-up Reminder", trigger: "Follow-up date reached", condition: "Task due today", action: "Push notification", channel: "system" },
  { name: "EOI Chase Reminder", trigger: "EOI pending > 3 days", condition: "EOI not submitted", action: "Remind investor", channel: "email" },
  { name: "Finance Status Reminder", trigger: "Finance pending > 7 days", condition: "Finance not approved", action: "Chase broker", channel: "email" },
  { name: "Broker/Lawyer Chase", trigger: "Partner action pending > 5 days", condition: "Awaiting response", action: "Send reminder", channel: "email" },
  { name: "Nurture Sequence", trigger: "Investor in nurture stage", condition: "No activity in 30 days", action: "Send nurture content", channel: "email" },
  { name: "Repeat Investor Re-engagement", trigger: "Settlement completed", condition: "Investor settled before", action: "Send opportunities digest", channel: "email" },
  { name: "Deposit Pending Alert", trigger: "Deposit not received in 7 days", condition: "Deal at deposit_pending stage", action: "Alert advisor", channel: "system" },
];

export function AutomationsModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: automations = [] } = useQuery({
    queryKey: ["crm-automations", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_automations").select("*").eq("business_id", profile!.business_id!).order("created_at"); return data || []; },
    enabled: !!profile?.business_id,
  });

  const toggleAutomation = async (id: string, current: boolean) => {
    await supabase.from("crm_automations").update({ is_active: !current, updated_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-automations"] });
    toast.success(`Automation ${!current ? "activated" : "deactivated"}`);
  };

  const seedDefaults = async () => {
    const inserts = DEFAULT_AUTOMATIONS.map(a => ({
      business_id: profile!.business_id!,
      name: a.name, trigger_event: a.trigger, condition_json: { description: a.condition },
      action_type: a.action, channel: a.channel, is_active: false,
    }));
    const { error } = await supabase.from("crm_automations").insert(inserts as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Default automations added");
    qc.invalidateQueries({ queryKey: ["crm-automations"] });
  };

  const active = automations.filter((a: any) => a.is_active).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{active} active / {automations.length} total automations</p>
        </div>
        {automations.length === 0 && <Button onClick={seedDefaults} size="sm" className="gap-1.5"><Zap className="h-4 w-4" />Load Default Automations</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.length > 0 ? automations.map((a: any) => {
          const ChannelIcon = CHANNEL_ICONS[a.channel] || Bell;
          return (
            <Card key={a.id} className={`bg-card border-border ${a.is_active ? "border-primary/30" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${a.is_active ? "bg-primary/10" : "bg-muted"}`}><Zap className={`h-4 w-4 ${a.is_active ? "text-primary" : "text-muted-foreground"}`} /></div>
                    <div><p className="text-sm font-medium text-foreground">{a.name}</p><Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px] mt-0.5">{a.is_active ? "Active" : "Inactive"}</Badge></div>
                  </div>
                  <Switch checked={a.is_active} onCheckedChange={() => toggleAutomation(a.id, a.is_active)} />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Trigger:</span><span className="text-foreground">{a.trigger_event}</span></div>
                  <div className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Action:</span><span className="text-foreground">{a.action_type}</span></div>
                  <div className="flex items-center gap-2"><ChannelIcon className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Channel:</span><Badge variant="outline" className="text-[10px]">{a.channel}</Badge></div>
                  {a.condition_json?.description && <div className="flex items-center gap-2"><span className="text-muted-foreground">Condition:</span><span className="text-foreground">{a.condition_json.description}</span></div>}
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium">No automations configured</p>
            <p className="text-sm mt-1">Click "Load Default Automations" to get started with pre-built workflows</p>
          </div>
        )}
      </div>
    </div>
  );
}
