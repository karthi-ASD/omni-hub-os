import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUnifiedTickets } from "@/hooks/useUnifiedTickets";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ticket, Plus, Clock, AlertTriangle, CheckCircle, Inbox, LinkIcon,
  Mail, Search, Filter, Users, Building2, Zap, MessageCircle, Phone,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  assigned: "bg-accent/20 text-accent-foreground border-accent/30",
  in_progress: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  waiting_for_client: "bg-muted text-muted-foreground border-border",
  pending_client_mapping: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  escalated: "bg-destructive/20 text-destructive border-destructive/30",
  resolved: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  critical: "bg-destructive/20 text-destructive",
};

const matchStatusColors: Record<string, string> = {
  matched: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
  unmatched: "bg-destructive/20 text-destructive",
  suggested: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
};

const sourceIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  portal: <Users className="h-3 w-3" />,
  manual: <Ticket className="h-3 w-3" />,
  website: <Building2 className="h-3 w-3" />,
  whatsapp: <MessageCircle className="h-3 w-3" />,
  phone: <Phone className="h-3 w-3" />,
};

const DEPARTMENTS = [
  "support", "seo", "accounts", "development", "hr", "sales", "general",
];

const UnifiedTicketsPage = () => {
  usePageTitle("Ticket Center");
  const navigate = useNavigate();
  const { isSuperAdmin, isBusinessAdmin, hasRole } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const isManager = hasRole("manager");

  const deptFilter = (isSuperAdmin || isBusinessAdmin || isManager) ? undefined : departmentName?.toLowerCase();
  const { tickets, stats, loading, createTicket } = useUnifiedTickets(deptFilter);

  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [form, setForm] = useState({
    subject: "", description: "", category: "general",
    priority: "medium", department: "support",
    sender_email: "", sender_name: "",
  });

  const filtered = useMemo(() => {
    let list = tickets;
    const now = new Date();
    if (activeTab === "unmatched") {
      list = list.filter(t => (t as any).client_match_status === "unmatched" || (t as any).client_match_status === "suggested");
    } else if (activeTab === "unassigned") {
      list = list.filter(t => !t.assigned_to_user_id && !["resolved", "closed"].includes(t.status));
    } else if (activeTab === "sla_breached") {
      list = list.filter(t =>
        t.sla_due_at && new Date(t.sla_due_at) < now &&
        !["resolved", "closed"].includes(t.status)
      );
    } else if (activeTab !== "all") {
      list = list.filter(t => t.status === activeTab);
    }
    if (filterDept !== "all") list = list.filter(t => t.department === filterDept);
    if (filterPriority !== "all") list = list.filter(t => t.priority === filterPriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.ticket_number?.toLowerCase().includes(q) ||
        t.sender_email?.toLowerCase().includes(q) ||
        t.sender_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, activeTab, filterDept, filterPriority, searchQuery]);

  const handleCreate = async () => {
    if (!form.subject.trim()) return;
    await createTicket({
      subject: form.subject,
      description: form.description,
      category: form.category,
      priority: form.priority,
      department: form.department,
      sender_email: form.sender_email || undefined,
      sender_name: form.sender_name || undefined,
      source_type: "manual",
    });
    setForm({ subject: "", description: "", category: "general", priority: "medium", department: "support", sender_email: "", sender_name: "" });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ticket Center"
        subtitle="Unified ticket management — emails, portal, internal requests"
        icon={Ticket}
        badge={`${stats.total}`}
        actions={[{ label: "New Ticket", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Open" value={stats.open} icon={Inbox} gradient="from-primary to-accent" />
        <StatCard label="In Progress" value={stats.in_progress} icon={Clock} gradient="from-[hsl(var(--warning))] to-orange-500" />
        <StatCard label="Unassigned" value={(stats as any).unassigned || 0} icon={Users} gradient="from-purple-500 to-violet-600" />
        <StatCard label="SLA Breached" value={(stats as any).sla_breached || 0} icon={AlertTriangle} gradient="from-destructive to-red-600" />
        <StatCard label="Unmatched" value={stats.unmatched} icon={LinkIcon} gradient="from-destructive to-red-400" />
        <StatCard label="Escalated" value={stats.escalated} icon={AlertTriangle} gradient="from-destructive to-orange-600" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} gradient="from-[hsl(var(--success))] to-emerald-500" />
        <StatCard label="Total" value={stats.total} icon={Ticket} gradient="from-secondary to-muted" />
      </div>

      {/* Tabs + Filters */}
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="unassigned">
              Unassigned ({(stats as any).unassigned || 0})
            </TabsTrigger>
            <TabsTrigger value="sla_breached" className="text-destructive">
              SLA Breached ({(stats as any).sla_breached || 0})
            </TabsTrigger>
            <TabsTrigger value="unmatched" className="text-destructive">
              Unmatched ({stats.unmatched})
            </TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets, emails, names..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[150px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            {tickets.length === 0 ? "No tickets yet." : "No tickets match your filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(ticket => (
            <Card
              key={ticket.id}
              className="rounded-xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{ticket.ticket_number}</span>
                      {sourceIcons[(ticket as any).source_type] || sourceIcons.manual}
                      <Badge variant="outline" className={`text-[9px] ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] ${statusColors[ticket.status]}`}>
                        {ticket.status.replace(/_/g, " ")}
                      </Badge>
                      {(ticket as any).client_match_status && (ticket as any).client_match_status !== "matched" && (
                        <Badge variant="outline" className={`text-[9px] ${matchStatusColors[(ticket as any).client_match_status]}`}>
                          <LinkIcon className="h-2.5 w-2.5 mr-0.5" />
                          {(ticket as any).client_match_status}
                        </Badge>
                      )}
                      {ticket.department && (
                        <Badge variant="secondary" className="text-[9px]">{ticket.department}</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      {ticket.sender_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-2.5 w-2.5" />
                          {(ticket as any).sender_name || ticket.sender_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.sla_due_at && !["resolved", "closed"].includes(ticket.status) && (() => {
                        const due = new Date(ticket.sla_due_at);
                        const now = new Date();
                        const breached = due < now;
                        const hoursLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
                        return (
                          <span className={`flex items-center gap-1 font-semibold ${breached ? "text-destructive" : hoursLeft <= 2 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"}`}>
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {breached ? "SLA BREACHED" : `${hoursLeft}h left`}
                          </span>
                        );
                      })()}
                      {ticket.channel && (
                        <span className="capitalize">{ticket.channel}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sender Name</Label>
                <Input value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} placeholder="John Smith" />
              </div>
              <div>
                <Label>Sender Email</Label>
                <Input value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} placeholder="john@company.com" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Detailed description..." />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!form.subject.trim()}>
              <Plus className="h-4 w-4 mr-2" /> Create Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedTicketsPage;
