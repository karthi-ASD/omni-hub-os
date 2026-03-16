import { useState } from "react";
import { useLeadNotes } from "@/hooks/useLeadNotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageSquare, Users, Plus, FileText } from "lucide-react";
import { format } from "date-fns";

const METHOD_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
  other: FileText,
};

const METHOD_COLORS: Record<string, string> = {
  call: "bg-primary/10 text-primary",
  email: "bg-accent/10 text-accent",
  whatsapp: "bg-green-500/10 text-green-600",
  meeting: "bg-violet-500/10 text-violet-600",
  other: "bg-muted text-muted-foreground",
};

interface LeadNotesTimelineProps {
  leadId: string | undefined;
}

export function LeadNotesTimeline({ leadId }: LeadNotesTimelineProps) {
  const { notes, loading, addNote } = useLeadNotes(leadId);
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [contactMethod, setContactMethod] = useState("call");
  const [followupDate, setFollowupDate] = useState("");

  const handleAdd = async () => {
    if (!noteText.trim()) return;
    await addNote({
      note_text: noteText,
      contact_method: contactMethod,
      next_followup_date: followupDate || null,
    });
    setNoteText("");
    setContactMethod("call");
    setFollowupDate("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Conversation History</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Contact Method</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs">Next Follow-up</Label>
              <Input type="date" className="h-8 text-xs" value={followupDate} onChange={e => setFollowupDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Conversation Notes</Label>
            <Textarea placeholder="What was discussed…" value={noteText} onChange={e => setNoteText(e.target.value)} className="min-h-[80px] text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!noteText.trim()}>Save Note</Button>
          </div>
        </div>
      )}

      <Separator />

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No conversation notes yet. Add your first note above.</p>
      ) : (
        <div className="relative pl-6 space-y-3">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
          {notes.map(note => {
            const method = note.contact_method || note.note_type || "other";
            const Icon = METHOD_ICONS[method] || METHOD_ICONS.other;
            const colorClass = METHOD_COLORS[method] || METHOD_COLORS.other;
            return (
              <div key={note.id} className="relative">
                <div className="absolute -left-[18px] top-1.5 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Icon className="h-2.5 w-2.5 text-primary" />
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] ${colorClass}`}>{method}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(note.created_at), "dd MMM yyyy, HH:mm")}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{note.salesperson_name}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                  {note.next_followup_date && (
                    <p className="text-[10px] text-primary mt-1.5">📅 Follow-up: {format(new Date(note.next_followup_date), "dd MMM yyyy")}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
