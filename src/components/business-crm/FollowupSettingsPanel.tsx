import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, Clock, Save } from "lucide-react";
import { toast } from "sonner";

export function FollowupSettingsPanel() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enable_customer_email: true,
    enable_mobile_push: true,
    enable_mobile_confirmation: true,
    enable_employee_reminders: true,
    reminder_hours_before: 2,
  });

  const { data: existing } = useQuery({
    queryKey: ["crm-followup-settings", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_followup_settings")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.business_id,
  });

  useEffect(() => {
    if (existing) {
      setSettings({
        enable_customer_email: existing.enable_customer_email ?? true,
        enable_mobile_push: existing.enable_mobile_push ?? true,
        enable_mobile_confirmation: existing.enable_mobile_confirmation ?? true,
        enable_employee_reminders: existing.enable_employee_reminders ?? true,
        reminder_hours_before: existing.reminder_hours_before ?? 2,
      });
    }
  }, [existing]);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...settings, business_id: profile!.business_id!, updated_at: new Date().toISOString() };

    if (existing) {
      await supabase.from("crm_followup_settings").update(payload as any).eq("id", existing.id);
    } else {
      await supabase.from("crm_followup_settings").insert(payload as any);
    }

    qc.invalidateQueries({ queryKey: ["crm-followup-settings"] });
    setSaving(false);
    toast.success("Follow-up settings saved");
  };

  const items = [
    { key: "enable_customer_email" as const, icon: Mail, label: "Customer Email Notifications", desc: "Send email to customer when a follow-up is scheduled or rescheduled" },
    { key: "enable_mobile_push" as const, icon: Smartphone, label: "Mobile App Push Notifications", desc: "Push notification to investor mobile app for upcoming follow-ups" },
    { key: "enable_mobile_confirmation" as const, icon: Smartphone, label: "Mobile App Confirm/Reschedule", desc: "Allow customers to confirm or reschedule follow-ups from the mobile app" },
    { key: "enable_employee_reminders" as const, icon: Bell, label: "Employee Reminders", desc: "Send reminders to assigned employees before follow-up due dates" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Follow-up & Notification Settings</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Control how follow-up actions notify customers and employees</p>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <Card key={item.key} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={v => setSettings(s => ({ ...s, [item.key]: v }))}
              />
            </CardContent>
          </Card>
        ))}

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Reminder Lead Time</p>
              <p className="text-[10px] text-muted-foreground">How many hours before a follow-up to send the reminder</p>
            </div>
            <Input
              type="number"
              min={1}
              max={48}
              value={settings.reminder_hours_before}
              onChange={e => setSettings(s => ({ ...s, reminder_hours_before: parseInt(e.target.value) || 2 }))}
              className="w-20"
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-1.5">
        <Save className="h-4 w-4" />{saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
