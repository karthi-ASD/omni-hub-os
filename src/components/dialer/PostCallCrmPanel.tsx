import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  User, Building2, Phone, PhoneForwarded, PhoneMissed, PhoneOff,
  CheckCircle, XCircle, Calendar as CalendarIcon, UserPlus, AlertCircle,
  Ban, Headphones, Briefcase, BookOpen, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import type { PhoneMatchResult } from "@/services/crmCommunicationService";

interface PostCallCrmPanelProps {
  matches: PhoneMatchResult[];
  selectedMatch: PhoneMatchResult | null;
  isNewColdCall: boolean;
  phoneNumber: string;
  onSelectMatch: (match: PhoneMatchResult) => void;
  onDisposition: (disposition: string, notes?: string, callbackDatetime?: string, callbackReason?: string) => Promise<void>;
  onCreateLead: (name?: string, company?: string) => Promise<void>;
  onDone: () => void;
}

const DISPOSITIONS = [
  { key: "interested", label: "Interested", icon: CheckCircle, color: "border-emerald-200 hover:bg-emerald-50 text-emerald-700" },
  { key: "not_interested", label: "Not Interested", icon: XCircle, color: "border-red-200 hover:bg-red-50 text-red-700" },
  { key: "callback_later", label: "Callback", icon: PhoneForwarded, color: "border-blue-200 hover:bg-blue-50 text-blue-700" },
  { key: "no_answer", label: "No Answer", icon: PhoneMissed, color: "border-amber-200 hover:bg-amber-50 text-amber-700" },
  { key: "wrong_number", label: "Wrong #", icon: PhoneOff, color: "border-muted hover:bg-muted/50" },
  { key: "voicemail", label: "Voicemail", icon: Headphones, color: "border-purple-200 hover:bg-purple-50 text-purple-700" },
  { key: "existing_customer_support", label: "Support", icon: Briefcase, color: "border-sky-200 hover:bg-sky-50 text-sky-700" },
  { key: "existing_customer_sales", label: "Sales", icon: Briefcase, color: "border-indigo-200 hover:bg-indigo-50 text-indigo-700" },
  { key: "meeting_booked", label: "Meeting", icon: BookOpen, color: "border-teal-200 hover:bg-teal-50 text-teal-700" },
  { key: "converted", label: "Converted", icon: CheckCircle, color: "border-emerald-300 hover:bg-emerald-100 text-emerald-800" },
  { key: "lost", label: "Lost", icon: XCircle, color: "border-red-300 hover:bg-red-100 text-red-800" },
  { key: "do_not_call", label: "DNC", icon: Ban, color: "border-red-400 hover:bg-red-200 text-red-900" },
];

export function PostCallCrmPanel({
  matches, selectedMatch, isNewColdCall, phoneNumber,
  onSelectMatch, onDisposition, onCreateLead, onDone,
}: PostCallCrmPanelProps) {
  const [notes, setNotes] = useState("");
  const [callbackDate, setCallbackDate] = useState<Date | undefined>();
  const [callbackReason, setCallbackReason] = useState("");
  const [showCallback, setShowCallback] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const handleDisposition = async (key: string) => {
    if (key === "callback_later" || key === "callback_requested" || key === "follow_up_required") {
      setShowCallback(true);
      return;
    }
    setSaving(true);
    await onDisposition(key, notes);
    setSaving(false);
    onDone();
  };

  const handleCallbackSubmit = async () => {
    if (!callbackDate) return;
    setSaving(true);
    await onDisposition("callback_later", notes, callbackDate.toISOString(), callbackReason);
    setSaving(false);
    onDone();
  };

  const handleCreateLead = async () => {
    setSaving(true);
    await onCreateLead(newLeadName || undefined, newLeadCompany || undefined);
    setSaving(false);
    setShowCreateLead(false);
  };

  const needsMatchSelection = matches.length > 1 && !selectedMatch;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Phone className="h-4 w-4" /> Post-Call — CRM Link
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Multiple matches warning */}
        {needsMatchSelection && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Multiple matches found — please select one
              </span>
            </div>
          </div>
        )}

        {/* Entity Match Display */}
        {matches.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Matched Records ({matches.length})
            </p>
            {matches.map((m, i) => (
              <button
                key={`${m.entity_type}-${m.entity_id}-${i}`}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                  selectedMatch?.entity_id === m.entity_id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => onSelectMatch(m)}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px] uppercase">
                    {m.entity_type}
                  </Badge>
                  <span className="font-medium">{m.matched_name || "Unknown"}</span>
                </div>
                {m.matched_business_name && (
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{m.matched_business_name}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* New Cold Call */}
        {isNewColdCall && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">No CRM match for {phoneNumber}</span>
            </div>
            {!showCreateLead ? (
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowCreateLead(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Create New Lead
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Contact name"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Company (optional)"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleCreateLead} disabled={saving}>
                    {saving ? "Creating…" : "Create Lead"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreateLead(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Disposition Grid */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Disposition</p>
          <div className="grid grid-cols-3 gap-1.5">
            {DISPOSITIONS.map((d) => {
              const Icon = d.icon;
              return (
                <Button
                  key={d.key}
                  variant="outline"
                  className={`h-10 flex-col gap-0.5 text-[10px] ${d.color}`}
                  onClick={() => handleDisposition(d.key)}
                  disabled={saving}
                >
                  <Icon className="h-4 w-4" />
                  {d.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <Textarea
          placeholder="Call notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-xs min-h-[60px]"
        />

        {/* Callback Panel */}
        {showCallback && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Schedule Callback</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {callbackDate ? format(callbackDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={callbackDate} onSelect={setCallbackDate} />
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Callback reason (optional)"
              value={callbackReason}
              onChange={(e) => setCallbackReason(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleCallbackSubmit} disabled={!callbackDate || saving}>
                {saving ? "Saving…" : "Save Callback"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCallback(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
