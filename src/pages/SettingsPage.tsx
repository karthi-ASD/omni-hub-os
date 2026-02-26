import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string | null;
}

const SettingsPage = () => {
  const { isSuperAdmin, isBusinessAdmin, profile } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("id, key, value")
        .order("key");
      if (!error) setSettings(data || []);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSetting = (id: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await supabase
          .from("settings")
          .update({ value: s.value })
          .eq("id", s.id);
      }

      // Audit log
      if (profile) {
        await supabase.from("audit_logs").insert({
          actor_user_id: profile.user_id,
          action_type: "UPDATE_SETTING",
          entity_type: "settings",
          business_id: profile.business_id,
        });
      }

      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin && !isBusinessAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your tenant preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : settings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No settings configured yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.map((s) => (
              <div key={s.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Label className="capitalize">{s.key.replace(/_/g, " ")}</Label>
                <Input
                  value={s.value || ""}
                  onChange={(e) => updateSetting(s.id, e.target.value)}
                  className="sm:col-span-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
