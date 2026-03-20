import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity as logAI } from "@/lib/activity-logger";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Ticket, Plus, Clock, AlertTriangle, CheckCircle, MessageSquare, Inbox } from "lucide-react";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  waiting_for_customer: "bg-accent/20 text-accent-foreground border-accent/30",
  resolved: "bg-success/20 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  critical: "bg-destructive/20 text-destructive",
};

const TicketsPage = () => {
  usePageTitle("Support Tickets");
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "bug",
    priority: "medium",
  });

  const fetchTickets = async () => {
    if (!profile?.business_id) return;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    if (!error) setTickets((data as SupportTicket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [profile?.business_id]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !profile?.business_id) return;
    const { error } = await supabase.from("support_tickets").insert({
      business_id: profile.business_id,
      created_by_user_id: profile.user_id,
      subject: form.subject,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
    });
    if (error) {
      toast.error("Failed to create ticket");
      return;
    }
    toast.success("Ticket created");
    setForm({ subject: "", description: "", category: "bug", priority: "medium" });
    setOpen(false);
    fetchTickets();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    fetchTickets();
    toast.success(`Ticket marked as ${status.replace(/_/g, " ")}`);
  };

  const filtered = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    total: tickets.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Support Tickets"
        subtitle="Submit issues, track resolutions, and communicate with support."
        icon={Ticket}
        badge={`${stats.total}`}
        actions={[{ label: "New Ticket", icon: Plus, onClick: () => setOpen(true) }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open" value={stats.open} icon={Inbox} gradient="from-primary to-accent" />
        <StatCard label="In Progress" value={stats.in_progress} icon={Clock} gradient="from-warning to-orange-500" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} gradient="from-success to-emerald-500" />
        <StatCard label="Total" value={stats.total} icon={Ticket} gradient="from-secondary to-muted" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "waiting_for_customer", "resolved", "closed"].map((s) => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)}>
            {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">
          {tickets.length === 0 ? "No tickets yet. Click 'New Ticket' to submit one." : "No tickets match this filter."}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="rounded-2xl border-0 shadow-elevated hover-lift transition-all cursor-pointer"
              onClick={() => navigate(`/ticket/${ticket.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                      <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="font-medium text-sm">{ticket.subject}</p>
                    {ticket.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span className="capitalize">{ticket.category.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  {(isSuperAdmin || isBusinessAdmin) && ticket.status !== "closed" && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {ticket.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, "in_progress")}>Start</Button>
                      )}
                      {ticket.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, "resolved")}>Resolve</Button>
                      )}
                      {ticket.status === "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, "closed")}>Close</Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="integration_issue">Integration Issue</SelectItem>
                    <SelectItem value="access_problem">Access Problem</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
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
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description, steps to reproduce..." rows={4} />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.subject.trim()}>Submit Ticket</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketsPage;
