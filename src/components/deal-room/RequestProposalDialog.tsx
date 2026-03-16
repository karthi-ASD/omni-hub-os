import { useState } from "react";
import { useProposalRequests } from "@/hooks/useProposalRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface RequestProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadServices?: string | null;
}

export function RequestProposalDialog({ open, onOpenChange, leadId, leadName, leadServices }: RequestProposalDialogProps) {
  const { createRequest } = useProposalRequests();
  const [form, setForm] = useState({
    service_details: leadServices || "",
    budget_range: "",
    notes: "",
  });

  const handleSubmit = async () => {
    await createRequest({
      lead_id: leadId,
      client_name: leadName,
      service_details: form.service_details,
      budget_range: form.budget_range,
      notes: form.notes,
    });
    setForm({ service_details: leadServices || "", budget_range: "", notes: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Request Proposal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Client</Label>
            <Input value={leadName} disabled />
          </div>
          <div>
            <Label>Services Needed</Label>
            <Input value={form.service_details} onChange={e => setForm(f => ({ ...f, service_details: e.target.value }))} placeholder="SEO, Web Design, etc." />
          </div>
          <div>
            <Label>Budget Range</Label>
            <Input value={form.budget_range} onChange={e => setForm(f => ({ ...f, budget_range: e.target.value }))} placeholder="e.g. $5,000 – $10,000" />
          </div>
          <div>
            <Label>Notes for Proposal Team</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requirements, deadlines…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
