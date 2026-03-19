import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Clock, AlertCircle, CheckCircle, Calendar, CalendarClock, UserCheck, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TASK_TYPES = ["callback", "investor_followup", "finance_check", "eoi_reminder", "deposit_reminder", "document_request", "broker_followup", "lawyer_followup", "accountant_followup", "settlement_prep", "nurture_checkin", "meeting", "investment_discussion", "general"];
const RESPONSE_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "✓ Confirmed", variant: "default" },
  rescheduled: { label: "↻ Rescheduled", variant: "secondary" },
  pending: { label: "⏳ Awaiting", variant: "outline" },
};

export function TasksFollowupsModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [filterView, setFilterView] = useState("today");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", task_type: "general", owner: "", due_date: new Date().toISOString().split("T")[0], priority: "medium", notes: "" });

  const { data: tasks = [] } = useQuery({
    queryKey: ["crm-tasks", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_tasks").select("*").eq("business_id", profile!.business_id!).order("due_date", { ascending: true }); return data || []; },
    enabled: !!profile?.business_id,
  });

  const today = new Date().toISOString().split("T")[0];
  const filtered = tasks.filter((t: any) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterView === "today") return t.due_date === today && t.status !== "completed";
    if (filterView === "overdue") return t.due_date < today && t.status !== "completed";
    if (filterView === "upcoming") return t.due_date > today && t.status !== "completed";
    if (filterView === "completed") return t.status === "completed";
    if (filterView === "followups") return !!t.linked_communication_id && t.status !== "completed";
    return t.status !== "completed";
  });

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("crm_tasks").insert({ business_id: profile!.business_id!, ...form } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Task added"); setOpen(false);
    setForm({ title: "", task_type: "general", owner: "", due_date: today, priority: "medium", notes: "" });
    qc.invalidateQueries({ queryKey: ["crm-tasks"] });
  };

  const toggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await supabase.from("crm_tasks").update({ status: newStatus, completion_summary: newStatus === "completed" ? "Completed" : null, updated_at: new Date().toISOString() } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["crm-tasks"] });
  };

  const handleReschedule = async (taskId: string) => {
    if (!newDate) { toast.error("Select a date"); return; }
    const task = tasks.find((t: any) => t.id === taskId);
    await supabase.from("crm_tasks").update({
      due_date: newDate,
      rescheduled_by: "employee",
      customer_response: "rescheduled",
      notes: `${task?.notes || ""}\n[Rescheduled to ${newDate} by employee on ${format(new Date(), "dd MMM yyyy")}]`,
      updated_at: new Date().toISOString(),
    } as any).eq("id", taskId);

    // Log reschedule in communications
    if (task?.linked_communication_id) {
      await supabase.from("crm_communications").insert({
        business_id: profile!.business_id!,
        linked_type: task.linked_investor_id ? "investor" : task.linked_lead_id ? "lead" : "deal",
        linked_id: task.linked_investor_id || task.linked_lead_id || task.linked_deal_id || "00000000-0000-0000-0000-000000000000",
        channel: "note",
        subject: "Follow-up Rescheduled",
        summary: `Follow-up rescheduled from ${task.due_date} to ${newDate}`,
        performed_by: "System",
      } as any);
    }

    setRescheduleOpen(null); setNewDate("");
    qc.invalidateQueries({ queryKey: ["crm-tasks"] });
    qc.invalidateQueries({ queryKey: ["crm-communications"] });
    toast.success("Follow-up rescheduled");
  };

  const overdue = tasks.filter((t: any) => t.due_date < today && t.status !== "completed").length;
  const todayCount = tasks.filter((t: any) => t.due_date === today && t.status !== "completed").length;
  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const followupCount = tasks.filter((t: any) => !!t.linked_communication_id && t.status !== "completed").length;
  const PRIORITY_COLORS: Record<string, string> = { high: "text-destructive", medium: "text-amber-500", low: "text-muted-foreground" };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card border-border cursor-pointer" onClick={() => setFilterView("today")}><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{todayCount}</p><p className="text-[10px] text-muted-foreground">Due Today</p></div></CardContent></Card>
        <Card className="bg-card border-border cursor-pointer" onClick={() => setFilterView("overdue")}><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-destructive/10"><AlertCircle className="h-4 w-4 text-destructive" /></div><div><p className="text-lg font-bold text-foreground">{overdue}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div></CardContent></Card>
        <Card className="bg-card border-border cursor-pointer" onClick={() => setFilterView("followups")}><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><CalendarClock className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{followupCount}</p><p className="text-[10px] text-muted-foreground">Follow-ups</p></div></CardContent></Card>
        <Card className="bg-card border-border cursor-pointer" onClick={() => setFilterView("upcoming")}><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><Clock className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{tasks.filter((t: any) => t.due_date > today && t.status !== "completed").length}</p><p className="text-[10px] text-muted-foreground">Upcoming</p></div></CardContent></Card>
        <Card className="bg-card border-border cursor-pointer" onClick={() => setFilterView("completed")}><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-500" /></div><div><p className="text-lg font-bold text-foreground">{completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5 flex-wrap">
          {["today", "overdue", "followups", "upcoming", "completed", "all"].map(v => (
            <Button key={v} size="sm" variant={filterView === v ? "default" : "ghost"} onClick={() => setFilterView(v)} className="text-xs h-7 capitalize">{v === "followups" ? "Follow-ups" : v}</Button>
          ))}
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Task</Button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((t: any) => {
          const isOverdue = t.due_date < today && t.status !== "completed";
          const isFollowup = !!t.linked_communication_id;
          const resp = t.customer_response ? RESPONSE_BADGES[t.customer_response] : null;

          return (
            <Card key={t.id} className={`bg-card border-border ${isOverdue ? "border-destructive/30" : ""} ${isFollowup ? "border-primary/20" : ""}`}>
              <CardContent className="p-3 flex items-start gap-3">
                <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleComplete(t.id, t.status)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                    <Badge variant="outline" className="text-[10px]">{t.task_type?.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[t.priority] || ""}`}>{t.priority}</Badge>
                    {isFollowup && <Badge variant="secondary" className="text-[10px] gap-1"><CalendarClock className="h-2.5 w-2.5" />Follow-up</Badge>}
                    {resp && <Badge variant={resp.variant} className="text-[10px]">{resp.label}</Badge>}
                    {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-[10px] ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>{t.due_date ? format(new Date(t.due_date + "T00:00:00"), "dd MMM yyyy") : "No date"}{t.followup_time && ` at ${t.followup_time}`}</span>
                    {t.owner && <span className="text-[10px] text-muted-foreground">• {t.owner}</span>}
                    {t.original_due_date && t.original_due_date !== t.due_date && <span className="text-[10px] text-muted-foreground line-through">was {format(new Date(t.original_due_date + "T00:00:00"), "dd MMM")}</span>}
                  </div>
                </div>
                {t.status !== "completed" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setRescheduleOpen(t.id); setNewDate(t.due_date || ""); }} title="Reschedule">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No tasks found</div>}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><Select value={form.task_type} onValueChange={v => setForm(f => ({ ...f, task_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Priority</Label><Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <div><Label className="text-xs">Owner</Label><Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleOpen} onOpenChange={() => setRescheduleOpen(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Reschedule Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">New Date</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <Button onClick={() => rescheduleOpen && handleReschedule(rescheduleOpen)} className="w-full">Confirm Reschedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
