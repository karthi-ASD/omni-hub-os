import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import type { AdvocacySettings } from "@/hooks/useAdvocacy";

interface Props {
  settings: AdvocacySettings | null;
  onSave: (data: Partial<AdvocacySettings>) => Promise<void>;
}

export function GlobalSettingsTab({ settings, onSave }: Props) {
  const [ptsShare, setPtsShare] = useState(5);
  const [ptsClick, setPtsClick] = useState(2);
  const [ptsLead, setPtsLead] = useState(20);
  const [ptsSale, setPtsSale] = useState(100);
  const [cooldown, setCooldown] = useState(60);
  const [networkSize, setNetworkSize] = useState(500);

  useEffect(() => {
    if (settings) {
      setPtsShare(settings.default_points_per_share);
      setPtsClick(settings.default_points_per_click);
      setPtsLead(settings.default_points_per_lead);
      setPtsSale(settings.default_points_per_sale);
      setCooldown(settings.anti_fraud_cooldown_seconds);
      setNetworkSize(settings.default_network_size);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({
      default_points_per_share: ptsShare,
      default_points_per_click: ptsClick,
      default_points_per_lead: ptsLead,
      default_points_per_sale: ptsSale,
      anti_fraud_cooldown_seconds: cooldown,
      default_network_size: networkSize,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-5 w-5" /> Global Advocacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><Label>Points per Share</Label><Input type="number" value={ptsShare} onChange={(e) => setPtsShare(Number(e.target.value))} /></div>
          <div><Label>Points per Click</Label><Input type="number" value={ptsClick} onChange={(e) => setPtsClick(Number(e.target.value))} /></div>
          <div><Label>Points per Lead</Label><Input type="number" value={ptsLead} onChange={(e) => setPtsLead(Number(e.target.value))} /></div>
          <div><Label>Points per Sale</Label><Input type="number" value={ptsSale} onChange={(e) => setPtsSale(Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Anti-Fraud Cooldown (seconds)</Label><Input type="number" value={cooldown} onChange={(e) => setCooldown(Number(e.target.value))} /></div>
          <div><Label>Default Network Size (viral reach calc)</Label><Input type="number" value={networkSize} onChange={(e) => setNetworkSize(Number(e.target.value))} /></div>
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
