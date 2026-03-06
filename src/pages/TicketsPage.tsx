import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Ticket, Plus, Clock, AlertTriangle, CheckCircle, MessageSquare } from "lucide-react";
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
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  waiting_for_customer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Support Tickets</h1>
            <HelpTooltip label="Support Tickets" description="Submit and track bugs, feature requests, billing issues, and more. Tickets follow a workflow from Open → In Progress → Resolved → Closed." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Submit issues, track resolutions, and communicate with support.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1">Category <HelpTooltip label="Category" description="Choose the type of issue: Bug, Feature Request, Billing, Integration, or Access." /></Label>
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
                  <Label className="flex items-center gap-1">Priority <HelpTooltip label="Priority" description="Critical = system down. High = major feature broken. Medium = minor issue. Low = cosmetic." /></Label>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border"><CardContent className="py-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
          <p className="text-xs text-muted-foreground">Open</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="py-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.in_progress}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="py-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="py-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {tickets.length === 0 ? "No tickets yet. Click 'New Ticket' to submit one." : "No tickets match this filter."}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="border-border hover:border-primary/30 transition-colors cursor-pointer"
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
                    <div className="flex gap-1">
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
    </div>
  );
};

export default TicketsPage;
