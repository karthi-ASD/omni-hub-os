import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { DraftRestoreBanner } from "@/components/ui/draft-restore-banner";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { ClientSelector } from "@/components/ui/client-selector";
import { useAllClientsDropdown } from "@/hooks/useAllClientsDropdown";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: any[]; // deprecated
  onCreate: (form: {
    client_id?: string;
    website_domain: string;
    project_name: string;
    target_location?: string;
    primary_keyword?: string;
    service_package: string;
    contract_start?: string;
    contract_end?: string;
  }) => Promise<void>;
}

const defaultForm = {
  client_id: "", website_domain: "", project_name: "", target_location: "",
  primary_keyword: "", service_package: "basic", contract_start: "", contract_end: "",
};

export function SeoCreateProjectDialog({ open, onOpenChange, onCreate }: Props) {
  const { clients: allClients, loading: clientsLoading } = useAllClientsDropdown();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { isDirty, isSaving, clearDraft } = useUnsavedChanges("seo:new", form, { enabled: open });

  const handleCreate = async () => {
    if (!form.website_domain || !form.project_name) return;
    setSubmitting(true);
    await onCreate({
      client_id: form.client_id || undefined,
      website_domain: form.website_domain,
      project_name: form.project_name,
      target_location: form.target_location || undefined,
      primary_keyword: form.primary_keyword || undefined,
      service_package: form.service_package,
      contract_start: form.contract_start || undefined,
      contract_end: form.contract_end || undefined,
    });
    setForm(defaultForm);
    clearDraft();
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create SEO Project
            <AutoSaveIndicator isDirty={isDirty} isSaving={isSaving} className="ml-auto" />
          </DialogTitle>
        </DialogHeader>
        <DraftRestoreBanner draftKey="seo:new" onRestore={(data) => setForm(data)} />
        <div className="space-y-4">
          <div>
            <Label>Project Name *</Label>
            <Input value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} placeholder="Client Name – SEO Campaign" />
          </div>
          <div>
            <Label>Website Domain *</Label>
            <Input value={form.website_domain} onChange={e => setForm({ ...form, website_domain: e.target.value })} placeholder="example.com.au" />
          </div>
          <div>
            <Label>Client</Label>
            <ClientSelector
              clients={allClients}
              value={form.client_id}
              onValueChange={v => setForm({ ...form, client_id: v })}
            />
          </div>
          <div>
            <Label>Target Location</Label>
            <Input value={form.target_location} onChange={e => setForm({ ...form, target_location: e.target.value })} placeholder="Sydney, NSW" />
          </div>
          <div>
            <Label>Primary Keyword</Label>
            <Input value={form.primary_keyword} onChange={e => setForm({ ...form, primary_keyword: e.target.value })} />
          </div>
          <div>
            <Label>Service Package</Label>
            <Select value={form.service_package} onValueChange={v => setForm({ ...form, service_package: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["basic", "standard", "premium", "enterprise"].map(p => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contract Start</Label>
              <Input type="date" value={form.contract_start} onChange={e => setForm({ ...form, contract_start: e.target.value })} />
            </div>
            <div>
              <Label>Contract End</Label>
              <Input type="date" value={form.contract_end} onChange={e => setForm({ ...form, contract_end: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={submitting || !form.project_name || !form.website_domain}>
            {submitting ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
