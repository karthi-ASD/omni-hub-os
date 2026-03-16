import { useState } from "react";
import { useFollowUps } from "@/hooks/useFollowUps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";

interface Props {
  leadId?: string | null;
  leadName?: string;
  onCreated?: () => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "icon";
}

export function ScheduleFollowUpDialog({
  leadId,
  leadName,
  onCreated,
  triggerLabel = "Schedule Follow-Up",
  triggerVariant = "default",
  triggerSize = "sm",
}: Props) {
  const { createFollowUp } = useFollowUps();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("call");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date) return;
    setSaving(true);
    await createFollowUp({
      lead_id: leadId || null,
      subject: subject || (leadName ? `Follow up with ${leadName}` : "Follow-up"),
      notes: notes || null,
      followup_date: date,
      followup_time: time || null,
      followup_type: type,
      priority,
    });
    setSaving(false);
    setOpen(false);
    resetForm();
    onCreated?.();
  };

  const resetForm = () => {
    setDate("");
    setTime("");
    setType("call");
    setPriority("medium");
    setSubject("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={triggerSize} variant={triggerVariant}>
          <CalendarPlus className="h-4 w-4 mr-1" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-Up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {leadName && (
            <div>
              <Label className="text-xs text-muted-foreground">Lead</Label>
              <p className="text-sm font-medium">{leadName}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="meeting">🤝 Meeting</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              placeholder="e.g. Call back regarding quote"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Notes / Reason</Label>
            <Textarea
              placeholder="What needs to be discussed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[70px] text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!date || saving}>
              {saving ? "Saving..." : "Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
