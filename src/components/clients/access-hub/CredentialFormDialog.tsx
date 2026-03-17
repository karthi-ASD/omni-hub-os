import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AccessCredential } from "@/hooks/useClientAccessHub";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<AccessCredential>) => Promise<any>;
  initial?: AccessCredential | null;
}

export function CredentialFormDialog({ open, onClose, onSave, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<AccessCredential>>(initial || {
    credential_type: "hosting",
    auto_renew_status: "unknown",
    reminder_days: 30,
    status: "active",
    is_client_visible: false,
    two_fa_enabled: false,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.credential_type || !form.provider_name) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Credential" : "Add Credential"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Type *</Label>
            <Select value={form.credential_type || "hosting"} onValueChange={v => set("credential_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hosting">Hosting</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="website">Website / CMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Provider Name *</Label>
            <Input value={form.provider_name || ""} onChange={e => set("provider_name", e.target.value)} placeholder="e.g. GoDaddy, cPanel" />
          </div>
          {form.credential_type === "domain" && (
            <div>
              <Label>Domain Name</Label>
              <Input value={form.domain_name || ""} onChange={e => set("domain_name", e.target.value)} placeholder="example.com" />
            </div>
          )}
          {form.credential_type === "website" && (
            <div>
              <Label>Platform Type</Label>
              <Select value={form.platform_type || ""} onValueChange={v => set("platform_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>URL</Label>
            <Input value={form.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Login URL</Label>
            <Input value={form.login_url || ""} onChange={e => set("login_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={form.username || ""} onChange={e => set("username", e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={form.password_encrypted || ""} onChange={e => set("password_encrypted", e.target.value)} />
          </div>
          <div>
            <Label>Account Email</Label>
            <Input type="email" value={form.account_email || ""} onChange={e => set("account_email", e.target.value)} />
          </div>
          <div>
            <Label>Recovery Email</Label>
            <Input type="email" value={form.recovery_email || ""} onChange={e => set("recovery_email", e.target.value)} />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date || ""} onChange={e => set("expiry_date", e.target.value)} />
          </div>
          <div>
            <Label>Auto-Renew</Label>
            <Select value={form.auto_renew_status || "unknown"} onValueChange={v => set("auto_renew_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on">On</SelectItem>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reminder Days Before Expiry</Label>
            <Input type="number" value={form.reminder_days ?? 30} onChange={e => set("reminder_days", parseInt(e.target.value) || 30)} />
          </div>
          <div>
            <Label>Reminder Email</Label>
            <Input type="email" value={form.reminder_email || ""} onChange={e => set("reminder_email", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status || "active"} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.credential_type === "website" && (
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={form.two_fa_enabled || false} onCheckedChange={v => set("two_fa_enabled", v)} />
              <Label>2FA Enabled</Label>
            </div>
          )}
          <div className="flex items-center gap-2 mt-6">
            <Switch checked={form.is_client_visible || false} onCheckedChange={v => set("is_client_visible", v)} />
            <Label>Visible to Client</Label>
          </div>
        </div>

        <div>
          <Label>Backup Contact</Label>
          <Input value={form.backup_contact || ""} onChange={e => set("backup_contact", e.target.value)} />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.provider_name}>
            {saving ? "Saving..." : initial ? "Update" : "Add Credential"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
