import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useInternalTickets } from "@/hooks/useInternalTickets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Ticket, Plus, Clock, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  under_review: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-destructive/20 text-destructive",
};

const InternalTicketsPage = () => {
  usePageTitle("Internal Tickets");
  const navigate = useNavigate();
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { tickets, loading, stats, createTicket, updateTicketStatus } = useInternalTickets();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", department: "general", priority: "medium" });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createTicket(form);
    setForm({ title: "", description: "", department: "general", priority: "medium" });
    setOpen(false);
  };

  const filtered = filterStatus === "all" ? tickets : tickets.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Internal Tickets</h1>
            <HelpTooltip label="Internal Tickets" description="Submit feature requests, report issues, or request improvements. Tickets are reviewed by Admin." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Request features, report issues, or suggest improvements for the platform.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Internal Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of request" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
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
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of what you need..." rows={4} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!form.title.trim()}>Submit Ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Open", value: stats.open, color: "text-blue-400" },
          { label: "Under Review", value: stats.under_review, color: "text-purple-400" },
          { label: "In Progress", value: stats.in_progress, color: "text-yellow-400" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400" },
          { label: "Total", value: stats.total, color: "text-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "under_review", "in_progress", "resolved", "closed"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)}>
            {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
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
          {tickets.length === 0 ? "No internal tickets yet." : "No tickets match this filter."}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <Card key={ticket.id} className="border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/internal-ticket/${ticket.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                      <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="bg-accent/20 text-accent-foreground">{ticket.department}</Badge>
                    </div>
                    <p className="font-medium text-sm">{ticket.title}</p>
                    {ticket.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {(isSuperAdmin || isBusinessAdmin) && ticket.status !== "closed" && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {ticket.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "under_review")}>Review</Button>
                      )}
                      {ticket.status === "under_review" && (
                        <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "in_progress")}>Start</Button>
                      )}
                      {ticket.status === "in_progress" && (
                        <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "resolved")}>Resolve</Button>
                      )}
                      {ticket.status === "resolved" && (
                        <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "closed")}>Close</Button>
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

export default InternalTicketsPage;
