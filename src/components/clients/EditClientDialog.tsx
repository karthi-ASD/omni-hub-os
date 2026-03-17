import React, { useState, useEffect } from "react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Loader2, ShieldAlert } from "lucide-react";
import type { Client } from "@/hooks/useClients";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess: () => void;
}

export const EditClientDialog: React.FC<EditClientDialogProps> = ({
  open,
  onOpenChange,
  client,
  onSuccess,
}) => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const canEditEmail = isSuperAdmin || isBusinessAdmin;

  const [form, setForm] = useState({
    contact_name: "",
    company_name: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const { isDirty, isSaving, clearDraft } = useUnsavedChanges(`client:${client.id}`, form, { enabled: open });


  useEffect(() => {
    if (!open || !client) return;

    setForm((current) => {
      const next = {
        contact_name: client.contact_name || "",
        company_name: client.company_name || "",
        email: client.email || "",
        phone: client.phone || "",
        mobile: client.mobile || "",
        website: (client as any).website || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        country: client.country || "",
      };

      const hasUnsavedInput = Object.values(current).some(Boolean);
      return hasUnsavedInput ? current : next;
    });
  }, [open, client.id]);

  const handleSave = async () => {
    if (!form.contact_name || !form.email) {
      toast.error("Contact name and email are required");
      return;
    }

    setSaving(true);
    try {
      const emailChanged = form.email.toLowerCase() !== client.email.toLowerCase();

      // If email changed, use edge function for sync + duplicate check
      if (emailChanged) {
        if (!canEditEmail) {
          toast.error("You do not have permission to edit client email");
          setSaving(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("update-client-email", {
          body: {
            client_id: client.id,
            new_email: form.email.trim().toLowerCase(),
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      // Update other fields directly
      const { error: updateError } = await (supabase.from("clients") as any).update({
        contact_name: form.contact_name,
        company_name: form.company_name || null,
        phone: form.phone || null,
        mobile: form.mobile || null,
        website: form.website || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        ...(emailChanged ? { email: form.email.trim().toLowerCase() } : {}),
      }).eq("id", client.id);

      if (updateError) throw updateError;

      toast.success("Client updated successfully");
      clearDraft();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Client
            <AutoSaveIndicator isDirty={isDirty} isSaving={isSaving} className="ml-auto" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Name *</Label>
              <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              Email *
              {!canEditEmail && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Admin only
                </span>
              )}
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={!canEditEmail}
              className={!canEditEmail ? "opacity-60 cursor-not-allowed" : ""}
            />
            {!canEditEmail && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Only Super Admin and Admin can edit client email addresses.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>

          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
