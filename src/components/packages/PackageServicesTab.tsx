import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { SERVICE_ENUM, type PackageService } from "@/hooks/useClientPackage";

interface Props {
  packageId: string;
  services: PackageService[];
  onUpsert: (packageId: string, name: string, active: boolean, price: number) => void;
  isReadOnly?: boolean;
}

export default function PackageServicesTab({ packageId, services, onUpsert, isReadOnly }: Props) {
  const [local, setLocal] = useState<Record<string, { active: boolean; price: number }>>({});

  useEffect(() => {
    const map: Record<string, { active: boolean; price: number }> = {};
    SERVICE_ENUM.forEach(name => {
      const existing = services.find(s => s.service_name === name);
      map[name] = { active: existing?.is_active ?? false, price: existing?.price ?? 0 };
    });
    setLocal(map);
  }, [services]);

  const total = Object.values(local).filter(v => v.active).reduce((s, v) => s + v.price, 0);
  const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;

  const handleToggle = (name: string, active: boolean) => {
    const updated = { ...local, [name]: { ...local[name], active } };
    setLocal(updated);
    if (!isReadOnly) onUpsert(packageId, name, active, updated[name].price);
  };

  const handlePrice = (name: string, price: number) => {
    setLocal(prev => ({ ...prev, [name]: { ...prev[name], price } }));
  };

  const handlePriceBlur = (name: string) => {
    if (!isReadOnly) onUpsert(packageId, name, local[name].active, local[name].price);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Active Services</CardTitle>
            <div className="flex items-center gap-1 text-sm font-bold text-primary">
              <DollarSign className="h-4 w-4" />
              Total: {fmt(total)}/mo
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {SERVICE_ENUM.map(name => (
            <div key={name} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              local[name]?.active ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/30"
            }`}>
              <div className="flex items-center gap-3">
                <Switch
                  checked={local[name]?.active ?? false}
                  onCheckedChange={v => handleToggle(name, v)}
                  disabled={isReadOnly}
                />
                <Label className={`text-sm font-medium ${local[name]?.active ? "text-foreground" : "text-muted-foreground"}`}>
                  {name}
                </Label>
              </div>
              {local[name]?.active && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={local[name]?.price ?? 0}
                    onChange={e => handlePrice(name, parseFloat(e.target.value) || 0)}
                    onBlur={() => handlePriceBlur(name)}
                    className="w-24 h-8 text-sm text-right"
                    disabled={isReadOnly}
                  />
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
