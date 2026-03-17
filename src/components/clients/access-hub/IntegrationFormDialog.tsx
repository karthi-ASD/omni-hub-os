import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ProjectIntegration } from "@/hooks/useClientAccessHub";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProjectIntegration>) => Promise<any>;
  initial?: ProjectIntegration | null;
}

export function IntegrationFormDialog({ open, onClose, onSave, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProjectIntegration>>(initial || {
    integration_type: "google_analytics",
    is_enabled: true,
    status: "pending",
    is_client_visible: false,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.integration_type) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const isGA = form.integration_type === "google_analytics";
  const isGSC = form.integration_type === "search_console";
  const isGAds = form.integration_type === "google_ads";
  const isFBAds = form.integration_type === "facebook_ads";
  const isHosting = form.integration_type === "hosting_api";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Integration" : "Add Integration"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Integration Type *</Label>
            <Select value={form.integration_type || "google_analytics"} onValueChange={v => set("integration_type", v)} disabled={!!initial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google_analytics">Google Analytics</SelectItem>
                <SelectItem value="search_console">Google Search Console</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                <SelectItem value="hosting_api">Hosting / API</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Provider / Account Name</Label>
            <Input value={form.provider_name || ""} onChange={e => set("provider_name", e.target.value)} />
          </div>
          <div>
            <Label>Connected Account Name</Label>
            <Input value={form.connected_account_name || ""} onChange={e => set("connected_account_name", e.target.value)} />
          </div>
          <div>
            <Label>Connected Email</Label>
            <Input type="email" value={form.connected_email || ""} onChange={e => set("connected_email", e.target.value)} />
          </div>
          <div>
            <Label>API URL / Endpoint</Label>
            <Input value={form.api_url || ""} onChange={e => set("api_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>API Key / Token</Label>
            <Input type="password" value={form.api_key_encrypted || ""} onChange={e => set("api_key_encrypted", e.target.value)} />
          </div>

          {(isGA || isGSC) && (
            <div>
              <Label>{isGA ? "Property ID" : "Property URL"}</Label>
              <Input value={form.property_id || ""} onChange={e => set("property_id", e.target.value)} />
            </div>
          )}
          {isGA && (
            <div>
              <Label>Measurement ID</Label>
              <Input value={form.measurement_id || ""} onChange={e => set("measurement_id", e.target.value)} placeholder="G-XXXXXXXX" />
            </div>
          )}
          {(isGAds || isFBAds) && (
            <div>
              <Label>Account ID</Label>
              <Input value={form.account_id || ""} onChange={e => set("account_id", e.target.value)} />
            </div>
          )}
          {isFBAds && (
            <div>
              <Label>Business Manager ID</Label>
              <Input value={form.business_manager_id || ""} onChange={e => set("business_manager_id", e.target.value)} />
            </div>
          )}
          {isGSC && (
            <div>
              <Label>Verification Status</Label>
              <Input value={form.verification_status || ""} onChange={e => set("verification_status", e.target.value)} placeholder="Verified / Pending" />
            </div>
          )}

          <div>
            <Label>Status</Label>
            <Select value={form.status || "pending"} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <Switch checked={form.is_enabled || false} onCheckedChange={v => set("is_enabled", v)} />
            <Label>Enabled</Label>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Switch checked={form.is_client_visible || false} onCheckedChange={v => set("is_client_visible", v)} />
            <Label>Visible to Client</Label>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : initial ? "Update" : "Add Integration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
