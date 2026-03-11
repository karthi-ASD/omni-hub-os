import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Settings2 } from "lucide-react";

interface Setting { id: string; key: string; value: string | null; }

const SettingsPage = () => {
  const { isSuperAdmin, isBusinessAdmin, profile } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from("settings").select("id, key, value").order("key");
      if (!error) setSettings(data || []);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSetting = (id: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await supabase.from("settings").update({ value: s.value }).eq("id", s.id);
      }
      if (profile) {
        await supabase.from("audit_logs").insert({
          actor_user_id: profile.user_id, action_type: "UPDATE_SETTING",
          entity_type: "settings", business_id: profile.business_id,
        });
      }
      toast.success("Settings saved");
    } catch { toast.error("Failed to save settings"); } finally { setSaving(false); }
  };

  if (!isSuperAdmin && !isBusinessAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Configure your tenant preferences"
        icon={Settings2}
        actions={[{ label: saving ? "Saving..." : "Save", icon: Save, onClick: handleSave, disabled: saving }]}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : settings.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">No settings configured yet.</CardContent></Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-lg">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {settings.map((s) => (
              <div key={s.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Label className="capitalize">{s.key.replace(/_/g, " ")}</Label>
                <Input value={s.value || ""} onChange={(e) => updateSetting(s.id, e.target.value)} className="sm:col-span-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
