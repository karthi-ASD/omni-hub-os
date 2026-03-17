import { useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useClientPortalTickets } from "@/hooks/useClientPortalTickets";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Ticket, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["support", "seo", "accounts", "development", "general"];

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  assigned: "secondary",
  in_progress: "secondary",
  waiting_for_client: "outline",
  resolved: "default",
  closed: "outline",
  escalated: "destructive",
};

export default function ClientPortalTicketsPage() {
  usePageTitle("Support Tickets");
  const { tickets, loading, submitting, submitTicket } = useClientPortalTickets();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    department: "support",
    priority: "medium",
  });

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => ["open", "assigned", "in_progress", "waiting_for_client"].includes(t.status)).length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => ["high", "critical"].includes(t.priority)).length,
  }), [tickets]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || submitting) return;
    try {
      await submitTicket({
        subject: form.subject,
        description: form.description,
        department: form.department,
        priority: form.priority,
        category: form.department === "seo" ? "project_request" : "general",
      });
      toast.success("Ticket submitted successfully");
      setForm({ subject: "", description: "", department: "support", priority: "medium" });
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit ticket");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
          <p className="text-sm text-muted-foreground">Raise requests, track updates, and stay in control.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Raise Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : [
              { label: "Open", value: stats.open, icon: Clock },
              { label: "Resolved", value: stats.resolved, icon: CheckCircle2 },
              { label: "Urgent", value: stats.urgent, icon: AlertTriangle },
              { label: "Total", value: stats.total, icon: Ticket },
            ].map((item) => (
              <Card key={item.label} className="rounded-2xl border-0 shadow-elevated">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-extrabold">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : tickets.length === 0 ? (
        <ClientPortalEmptyState
          icon={Ticket}
          action={<Button onClick={() => setOpen(true)}>Raise Your First Ticket</Button>}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{ticket.department || "support"}</Badge>
                      <Badge variant={statusVariants[ticket.status] || "outline"} className="text-[10px] capitalize">
                        {ticket.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ticket.description || "No description provided."}</p>
                  </div>
                  <div className="text-xs text-muted-foreground md:text-right">
                    <p className="capitalize">Priority: {ticket.priority}</p>
                    <p>{new Date(ticket.created_at).toLocaleDateString("en-AU")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(value) => !submitting && setOpen(value)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Raise a Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(value) => setForm((prev) => ({ ...prev, department: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={5} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.subject.trim() || submitting}>
              {submitting ? "Submitting ticket..." : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
