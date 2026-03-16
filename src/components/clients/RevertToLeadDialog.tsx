import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";

const REVERT_REASONS = [
  "No response",
  "Client rejected proposal",
  "Wrong conversion",
  "Other",
];

interface RevertToLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onConfirm: (reason: string) => Promise<void>;
}

export default function RevertToLeadDialog({
  open,
  onOpenChange,
  clientName,
  onConfirm,
}: RevertToLeadDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REVERT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finalReason =
    selectedReason === "Other" ? customReason.trim() || "Other" : selectedReason;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(finalReason);
      onOpenChange(false);
      setSelectedReason(REVERT_REASONS[0]);
      setCustomReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Revert Client to Lead
          </DialogTitle>
          <DialogDescription>
            This will move <strong>{clientName}</strong> back to the Leads/Prospects
            module and reassign it to the original salesperson.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Reason for reverting</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="mt-2 space-y-2"
            >
              {REVERT_REASONS.map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="font-normal cursor-pointer">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "Other" && (
            <Textarea
              placeholder="Please specify the reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting || (selectedReason === "Other" && !customReason.trim())}
          >
            {submitting ? "Reverting..." : "Revert to Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
