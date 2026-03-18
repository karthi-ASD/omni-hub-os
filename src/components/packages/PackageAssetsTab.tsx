import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Server, Calendar } from "lucide-react";
import type { PackageAsset } from "@/hooks/useClientPackage";

interface Props {
  packageId: string;
  assets: PackageAsset | null;
  onSave: (packageId: string, data: Partial<PackageAsset>) => void;
  isReadOnly?: boolean;
}

export default function PackageAssetsTab({ packageId, assets, onSave, isReadOnly }: Props) {
  const [form, setForm] = useState({
    domain_name: assets?.domain_name ?? "",
    registrar: assets?.registrar ?? "",
    domain_login_encrypted: "",
    domain_renewal_date: assets?.domain_renewal_date ?? "",
    hosting_provider: assets?.hosting_provider ?? "",
    hosting_login_encrypted: "",
    hosting_renewal_date: assets?.hosting_renewal_date ?? "",
  });

  useEffect(() => {
    if (assets) {
      setForm(prev => ({
        ...prev,
        domain_name: assets.domain_name ?? "",
        registrar: assets.registrar ?? "",
        domain_renewal_date: assets.domain_renewal_date ?? "",
        hosting_provider: assets.hosting_provider ?? "",
        hosting_renewal_date: assets.hosting_renewal_date ?? "",
      }));
    }
  }, [assets]);

  const handleSave = () => {
    const data: any = { ...form };
    if (!data.domain_login_encrypted) delete data.domain_login_encrypted;
    if (!data.hosting_login_encrypted) delete data.hosting_login_encrypted;
    onSave(packageId, data);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Domain Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Domain Name</Label>
              <Input value={form.domain_name} onChange={e => setForm(p => ({ ...p, domain_name: e.target.value }))} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Registrar</Label>
              <Input value={form.registrar} onChange={e => setForm(p => ({ ...p, registrar: e.target.value }))} disabled={isReadOnly} />
            </div>
            {!isReadOnly && (
              <div className="space-y-1.5">
                <Label className="text-xs">Domain Login (will be encrypted)</Label>
                <Input type="password" placeholder="Enter credentials…" value={form.domain_login_encrypted} onChange={e => setForm(p => ({ ...p, domain_login_encrypted: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Renewal Date</Label>
              <Input type="date" value={form.domain_renewal_date} onChange={e => setForm(p => ({ ...p, domain_renewal_date: e.target.value }))} disabled={isReadOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> Hosting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hosting Provider</Label>
              <Input value={form.hosting_provider} onChange={e => setForm(p => ({ ...p, hosting_provider: e.target.value }))} disabled={isReadOnly} />
            </div>
            {!isReadOnly && (
              <div className="space-y-1.5">
                <Label className="text-xs">Hosting Login (will be encrypted)</Label>
                <Input type="password" placeholder="Enter credentials…" value={form.hosting_login_encrypted} onChange={e => setForm(p => ({ ...p, hosting_login_encrypted: e.target.value }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Renewal Date</Label>
              <Input type="date" value={form.hosting_renewal_date} onChange={e => setForm(p => ({ ...p, hosting_renewal_date: e.target.value }))} disabled={isReadOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <Button onClick={handleSave} className="w-full">Save Assets</Button>
      )}
    </div>
  );
}
