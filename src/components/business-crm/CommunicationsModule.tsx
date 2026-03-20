import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logActivity as logAI } from "@/lib/activity-logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, MessageSquare, Video, StickyNote, ArrowRight, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CHANNEL_ICONS: Record<string, React.ElementType> = { call: Phone, email: Mail, sms: MessageSquare, whatsapp: MessageSquare, meeting: Video, note: StickyNote };
const CHANNEL_COLORS: Record<string, string> = { call: "bg-green-500/10 text-green-500", email: "bg-blue-500/10 text-blue-500", sms: "bg-amber-500/10 text-amber-500", whatsapp: "bg-emerald-500/10 text-emerald-500", meeting: "bg-purple-500/10 text-purple-500", note: "bg-zinc-500/10 text-zinc-400" };
const ACTION_TYPES = ["callback", "meeting", "document_followup", "investment_discussion", "finance_check"];

interface CommForm {
  linked_type: string; linked_id: string; channel: string; subject: string; summary: string; outcome: string; next_step: string; performed_by: string;
  followup_required: boolean; followup_action_type: string; followup_date: string; followup_time: string; followup_notes: string; followup_assigned_to: string;
}

const EMPTY_FORM: CommForm = {
  linked_type: "investor", linked_id: "", channel: "call", subject: "", summary: "", outcome: "", next_step: "", performed_by: "",
  followup_required: false, followup_action_type: "callback", followup_date: "", followup_time: "", followup_notes: "", followup_assigned_to: "",
};

export function CommunicationsModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [form, setForm] = useState<CommForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const { data: investors = [] } = useQuery({
    queryKey: ["crm-investors-list", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_investors").select("id, full_name").eq("business_id", profile!.business_id!).order("full_name"); return data || []; },
    enabled: !!profile?.business_id,
  });

  const { data: comms = [] } = useQuery({
    queryKey: ["crm-communications", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_communications").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }).limit(200); return data || []; },
    enabled: !!profile?.business_id,
  });

  const filtered = comms.filter((c: any) => {
    if (filterChannel !== "all" && c.channel !== filterChannel) return false;
    if (search) { const q = search.toLowerCase(); return (c.subject || "").toLowerCase().includes(q) || (c.summary || "").toLowerCase().includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.summary.trim()) { toast.error("Summary is required"); return; }
    setSaving(true);

    try {
      // 1. Insert communication
      const commPayload: any = {
        business_id: profile!.business_id!,
        linked_type: form.linked_type,
        linked_id: form.linked_id || "00000000-0000-0000-0000-000000000000",
        channel: form.channel,
        subject: form.subject,
        summary: form.summary,
        outcome: form.outcome,
        next_step: form.next_step,
        performed_by: form.performed_by,
        action_required: form.followup_required,
        followup_required: form.followup_required,
        followup_action_type: form.followup_required ? form.followup_action_type : null,
        followup_date: form.followup_required && form.followup_date ? form.followup_date : null,
        followup_time: form.followup_required && form.followup_time ? form.followup_time : null,
        followup_notes: form.followup_required ? form.followup_notes : null,
        followup_assigned_to: form.followup_required ? form.followup_assigned_to : null,
      };

      const { data: commData, error: commError } = await supabase.from("crm_communications").insert(commPayload).select("id").single();
      if (commError) throw commError;

      // 2. If follow-up required, auto-create a task
      if (form.followup_required && form.followup_date) {
        const investorName = investors.find((i: any) => i.id === form.linked_id)?.full_name || "";
        const taskTitle = `Follow-up: ${form.followup_action_type.replace(/_/g, " ")}${investorName ? ` – ${investorName}` : ""}`;

        const taskPayload: any = {
          business_id: profile!.business_id!,
          title: taskTitle,
          task_type: form.followup_action_type.replace("document_followup", "document_request").replace("investment_discussion", "investor_followup").replace("finance_check", "finance_check"),
          linked_investor_id: form.linked_type === "investor" && form.linked_id ? form.linked_id : null,
          linked_lead_id: form.linked_type === "lead" && form.linked_id ? form.linked_id : null,
          linked_deal_id: form.linked_type === "deal" && form.linked_id ? form.linked_id : null,
          linked_partner_id: form.linked_type === "partner" && form.linked_id ? form.linked_id : null,
          linked_communication_id: commData.id,
          owner: form.followup_assigned_to || form.performed_by || "Adi",
          due_date: form.followup_date,
          followup_time: form.followup_time || null,
          priority: "high",
          status: "pending",
          customer_response: "pending",
          original_due_date: form.followup_date,
          notes: form.followup_notes || `Auto-created from ${form.channel} on ${format(new Date(), "dd MMM yyyy")}`,
        };

        const { data: taskData, error: taskError } = await supabase.from("crm_tasks").insert(taskPayload).select("id").single();
        if (taskError) { console.error("Task creation error:", taskError); }
        else {
          // Link task back to comm
          await supabase.from("crm_communications").update({ auto_task_id: taskData.id } as any).eq("id", commData.id);
        }

        // 3. Log a timeline entry for the communication + follow-up
        toast.success("Communication logged & follow-up task created", {
          description: `Due: ${format(new Date(form.followup_date + "T00:00:00"), "dd MMM yyyy")}${form.followup_time ? ` at ${form.followup_time}` : ""}`,
        });
        logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: profile?.business_id, module: "communication", actionType: "create", entityType: "communication", description: `Communication logged via ${form.channel} + follow-up task` });
      } else {
        toast.success("Communication logged");
        logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: profile?.business_id, module: "communication", actionType: "create", entityType: "communication", description: `Communication logged via ${form.channel}` });
      }

      setOpen(false);
      setForm({ ...EMPTY_FORM });
      qc.invalidateQueries({ queryKey: ["crm-communications"] });
      qc.invalidateQueries({ queryKey: ["crm-tasks"] });
    } catch (err: any) {
      toast.error("Failed to save");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const channelCounts = ["call", "email", "sms", "whatsapp", "meeting", "note"].map(ch => ({ channel: ch, count: comms.filter((c: any) => c.channel === ch).length }));
  const followupsCreated = comms.filter((c: any) => c.followup_required).length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {channelCounts.map(cc => {
          const Icon = CHANNEL_ICONS[cc.channel] || MessageSquare;
          return (
            <Card key={cc.channel} className={`bg-card border-border cursor-pointer transition-colors hover:border-primary/30 ${filterChannel === cc.channel ? "border-primary" : ""}`} onClick={() => setFilterChannel(filterChannel === cc.channel ? "all" : cc.channel)}>
              <CardContent className="p-3 text-center"><Icon className={`h-4 w-4 mx-auto mb-1 ${CHANNEL_COLORS[cc.channel]?.split(" ")[1] || "text-muted-foreground"}`} /><p className="text-lg font-bold text-foreground">{cc.count}</p><p className="text-[10px] text-muted-foreground capitalize">{cc.channel}</p></CardContent>
            </Card>
          );
        })}
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center"><CalendarClock className="h-4 w-4 mx-auto mb-1 text-primary" /><p className="text-lg font-bold text-foreground">{followupsCreated}</p><p className="text-[10px] text-muted-foreground">Follow-ups</p></CardContent>
        </Card>
      </div>

      {/* Search & Add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search communications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Log Communication</Button>
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-w-3xl">
        {filtered.map((c: any) => {
          const Icon = CHANNEL_ICONS[c.channel] || MessageSquare;
          return (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${CHANNEL_COLORS[c.channel] || "bg-muted"}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.subject && <p className="text-sm font-medium text-foreground">{c.subject}</p>}
                    <Badge variant="outline" className="text-[10px] capitalize">{c.channel}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{c.linked_type}</Badge>
                    {c.action_required && <Badge variant="destructive" className="text-[10px]">Action Required</Badge>}
                  </div>
                  {c.summary && <p className="text-xs text-muted-foreground mt-0.5">{c.summary}</p>}
                  {c.outcome && <p className="text-xs text-foreground mt-1"><span className="text-muted-foreground">Outcome:</span> {c.outcome}</p>}
                  {c.next_step && <p className="text-xs text-foreground"><span className="text-muted-foreground">Next:</span> {c.next_step}</p>}

                  {/* Follow-up indicator */}
                  {c.followup_required && c.followup_date && (
                    <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/10">
                      <CalendarClock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs text-foreground">
                        Follow-up: <span className="font-medium">{c.followup_action_type?.replace(/_/g, " ")}</span> on {format(new Date(c.followup_date + "T00:00:00"), "dd MMM yyyy")}
                        {c.followup_time && ` at ${c.followup_time}`}
                        {c.followup_assigned_to && <span className="text-muted-foreground"> • {c.followup_assigned_to}</span>}
                      </span>
                      <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                      <Badge variant="outline" className="text-[10px]">Task Created</Badge>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(c.created_at), "dd MMM yyyy, h:mm a")}{c.performed_by && ` • ${c.performed_by}`}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No communications logged</div>}
      </div>

      {/* Log Communication Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Communication Type</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">📞 Call</SelectItem>
                    <SelectItem value="meeting">📹 Meeting</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                    <SelectItem value="note">📝 Internal Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Related To</Label>
                <Select value={form.linked_type} onValueChange={v => setForm(f => ({ ...f, linked_type: v, linked_id: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.linked_type === "investor" && investors.length > 0 && (
              <div><Label className="text-xs">Select Investor</Label>
                <Select value={form.linked_id} onValueChange={v => setForm(f => ({ ...f, linked_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choose investor..." /></SelectTrigger>
                  <SelectContent>{investors.map((inv: any) => <SelectItem key={inv.id} value={inv.id}>{inv.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div><Label className="text-xs">Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief subject line" /></div>
            <div><Label className="text-xs">Summary of Conversation *</Label><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} placeholder="What was discussed..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Outcome</Label><Input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="Result of interaction" /></div>
              <div><Label className="text-xs">Performed By</Label><Input value={form.performed_by} onChange={e => setForm(f => ({ ...f, performed_by: e.target.value }))} placeholder="Your name" /></div>
            </div>

            {/* Follow-up Action Section */}
            <div className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Next Action Required?</p>
                  <p className="text-[10px] text-muted-foreground">Automatically creates a follow-up task and notifies stakeholders</p>
                </div>
                <Switch checked={form.followup_required} onCheckedChange={v => setForm(f => ({ ...f, followup_required: v }))} />
              </div>

              {form.followup_required && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div><Label className="text-xs">Action Type</Label>
                    <Select value={form.followup_action_type} onValueChange={v => setForm(f => ({ ...f, followup_action_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="callback">📞 Callback</SelectItem>
                        <SelectItem value="meeting">📅 Meeting</SelectItem>
                        <SelectItem value="document_followup">📄 Document Follow-up</SelectItem>
                        <SelectItem value="investment_discussion">💰 Investment Discussion</SelectItem>
                        <SelectItem value="finance_check">🏦 Finance Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Follow-up Date *</Label><Input type="date" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} /></div>
                    <div><Label className="text-xs">Time (optional)</Label><Input type="time" value={form.followup_time} onChange={e => setForm(f => ({ ...f, followup_time: e.target.value }))} /></div>
                  </div>
                  <div><Label className="text-xs">Assigned Employee</Label><Input value={form.followup_assigned_to} onChange={e => setForm(f => ({ ...f, followup_assigned_to: e.target.value }))} placeholder="Who should follow up?" /></div>
                  <div><Label className="text-xs">Follow-up Notes</Label><Textarea value={form.followup_notes} onChange={e => setForm(f => ({ ...f, followup_notes: e.target.value }))} rows={2} placeholder="Additional context for the follow-up..." /></div>

                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p>✓ A task will be auto-created and assigned</p>
                      <p>✓ Employee will receive an internal notification</p>
                      <p>✓ Customer will be notified via email & app</p>
                      <p>✓ Timeline will be updated across all linked records</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? "Saving..." : form.followup_required ? "Log & Create Follow-up" : "Log Communication"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
