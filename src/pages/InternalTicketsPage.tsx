import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useInternalTickets, DEPARTMENTS, TICKET_STATUSES } from "@/hooks/useInternalTickets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Plus, Clock, ArrowRight, Inbox, Timer, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  need_extra_time: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  critical: "bg-destructive/20 text-destructive",
};

const InternalTicketsPage = () => {
  usePageTitle("Internal Tickets");
  const navigate = useNavigate();
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { tickets, loading, stats, createTicket, updateTicketStatus, reassignDepartment } = useInternalTickets();
  const [open, setOpen] = useState(false);
  const [filterDept, setFilterDept] = useState("all");
  const [activeTab, setActiveTab] = useState("open");
  const [form, setForm] = useState({
    title: "", description: "",
    source_department: "general",
    assigned_to_department: "development",
    priority: "medium",
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createTicket({
      title: form.title,
      description: form.description,
      department: form.source_department,
      assigned_to_department: form.assigned_to_department,
      source_department: form.source_department,
      priority: form.priority,
      source_type: "internal",
    });
    setForm({ title: "", description: "", source_department: "general", assigned_to_department: "development", priority: "medium" });
    setOpen(false);
  };

  // Filter by status tab and optional department
  const filtered = tickets.filter(t => {
    if (activeTab !== "all" && t.status !== activeTab) return false;
    if (filterDept !== "all") {
      const dept = filterDept;
      return t.assigned_to_department === dept || t.source_department === dept || t.department === dept;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Internal Tickets</h1>
            <HelpTooltip label="Internal Tickets" description="Cross-department ticket system. Route tickets between SEO, Development, Design, Accounts, and more." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Create and manage tickets across departments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Internal Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of request" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>From Department</Label>
                  <Select value={form.source_department} onValueChange={v => setForm({ ...form, source_department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To Department *</Label>
                  <Select value={form.assigned_to_department} onValueChange={v => setForm({ ...form, assigned_to_department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..." rows={4} />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <ArrowRight className="h-4 w-4 shrink-0" />
                <span>
                  {DEPARTMENTS.find(d => d.key === form.source_department)?.label || form.source_department}
                  {" → "}
                  {DEPARTMENTS.find(d => d.key === form.assigned_to_department)?.label || form.assigned_to_department}
                </span>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!form.title.trim()}>Submit Ticket</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats.open, icon: Inbox, color: "text-primary" },
          { label: "Need Extra Time", value: stats.need_extra_time, icon: Timer, color: "text-[hsl(var(--warning))]" },
          { label: "Closed", value: stats.closed, icon: CheckCircle, color: "text-muted-foreground" },
          { label: "Total", value: stats.total, icon: Ticket, color: "text-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm">Department:</Label>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="need_extra_time">Need Extra Time ({stats.need_extra_time})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({stats.closed})</TabsTrigger>
        </TabsList>

        {["all", "open", "need_extra_time", "closed"].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                No tickets found.
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
                            <Badge variant="outline" className={statusColors[ticket.status] || "bg-muted text-muted-foreground"}>
                              {ticket.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{ticket.title}</p>
                          {ticket.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ticket.created_at).toLocaleDateString()}</span>
                            {(ticket.source_department || ticket.assigned_to_department) && (
                              <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] bg-accent/10">
                                  {ticket.source_department || "?"} → {ticket.assigned_to_department || ticket.department}
                                </Badge>
                              </span>
                            )}
                          </div>
                        </div>
                        {(isSuperAdmin || isBusinessAdmin) && ticket.status !== "closed" && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {ticket.status === "open" && (
                              <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "need_extra_time")}>
                                Need Extra Time
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => updateTicketStatus(ticket.id, "closed")}>Close</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default InternalTicketsPage;
