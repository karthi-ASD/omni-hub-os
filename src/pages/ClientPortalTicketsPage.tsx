import { useMemo, useState, useCallback, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useClientPortalTickets } from "@/hooks/useClientPortalTickets";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Ticket, Clock, CheckCircle2, AlertTriangle, Send, ArrowLeft, MessageCircle, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  assigned: "bg-accent/10 text-accent-foreground",
  in_progress: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  waiting_for_client: "bg-muted text-muted-foreground",
  resolved: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  closed: "bg-muted text-muted-foreground",
  escalated: "bg-destructive/10 text-destructive",
};

interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  created_at: string;
}

export default function ClientPortalTicketsPage() {
  usePageTitle("Support Tickets");
  const { user, profile } = useAuth();
  const { tickets, loading, submitting, submitTicket, fetchTickets } = useClientPortalTickets();
  const [open, setOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({
    subject: "",
    description: "",
    department: "support",
    priority: "medium",
  });

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: tickets.length,
      open: tickets.filter((t) => ["open", "assigned", "in_progress", "waiting_for_client"].includes(t.status)).length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      urgent: tickets.filter((t) => ["high", "critical"].includes(t.priority)).length,
    };
  }, [tickets]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setMessagesLoading(true);
    const { data } = await supabase
      .from("ticket_messages")
      .select("id, sender_type, sender_name, content, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data as TicketMessage[]) || []);
    setMessagesLoading(false);
  }, []);

  const openTicketDetail = (ticket: any) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  // Realtime messages
  useEffect(() => {
    if (!selectedTicket) return;
    const ch = supabase
      .channel(`client-ticket-msgs-${selectedTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (p) => {
        const newMsg = p.new as any;
        if (newMsg?.ticket_id === selectedTicket.id && !newMsg.is_internal) {
          setMessages(prev => [...prev, newMsg as TicketMessage]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedTicket?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user?.id) return;
    const { error } = await supabase.from("ticket_messages").insert({
      business_id: selectedTicket.business_id || (await supabase.from("support_tickets").select("business_id").eq("id", selectedTicket.id).single()).data?.business_id,
      ticket_id: selectedTicket.id,
      sender_type: "customer",
      sender_user_id: user.id,
      sender_name: profile?.full_name || profile?.email || "Client",
      content: newMessage,
      is_internal: false,
    });
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    setNewMessage("");
    toast.success("Message sent");
  };

  const handleSubmit = async () => {
    if (!form.subject.trim() || submitting) return;
    try {
      const result = await submitTicket({
        subject: form.subject,
        description: form.description,
        department: form.department,
        priority: form.priority,
        category: form.department === "seo" ? "project_request" : "general",
      });
      if (!result) {
        toast.error("Ticket creation failed — please try again");
        return;
      }
      toast.success("Ticket submitted successfully");
      setForm({ subject: "", description: "", department: "support", priority: "medium" });
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit ticket");
    }
  };

  // Ticket detail view
  if (selectedTicket) {
    const slaBreached = selectedTicket.sla_due_at && new Date(selectedTicket.sla_due_at) < new Date() && !["resolved", "closed"].includes(selectedTicket.status);
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-muted-foreground">{selectedTicket.ticket_number}</span>
              <Badge className={`text-[10px] border-0 ${statusColors[selectedTicket.status] || "bg-muted text-muted-foreground"}`}>
                {selectedTicket.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">{selectedTicket.priority}</Badge>
              {slaBreached && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" /> SLA Breached
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h1>
          </div>
        </div>

        {/* Ticket Info */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="p-4">
            {selectedTicket.description && (
              <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{selectedTicket.description}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Department: <span className="text-foreground capitalize">{selectedTicket.department || "support"}</span></div>
              <div>Created: <span className="text-foreground">{format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}</span></div>
              {selectedTicket.sla_due_at && (
                <div>SLA Due: <span className={slaBreached ? "text-destructive font-semibold" : "text-foreground"}>{format(new Date(selectedTicket.sla_due_at), "MMM d, h:mm a")}</span></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Thread */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 pr-4">
                {messagesLoading && <div className="flex justify-center py-4"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
                {!messagesLoading && messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No messages yet. Start the conversation below.</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`rounded-lg p-3 ${msg.sender_type === "customer" ? "bg-primary/5 ml-8" : "bg-muted/50 mr-8"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender_type === "customer" ? <User className="h-3 w-3 text-primary" /> : <Shield className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-xs font-medium text-foreground">{msg.sender_name || (msg.sender_type === "customer" ? "You" : "Support Team")}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!["resolved", "closed"].includes(selectedTicket.status) && (
              <div className="border-t pt-3 flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="h-auto">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {tickets.map((ticket: any) => {
            const slaBreached = ticket.sla_due_at && new Date(ticket.sla_due_at) < new Date() && !["resolved", "closed"].includes(ticket.status);
            return (
              <Card
                key={ticket.id}
                className="rounded-2xl border-0 shadow-elevated hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openTicketDetail(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{ticket.department || "support"}</Badge>
                        <Badge className={`text-[10px] border-0 ${statusColors[ticket.status] || "bg-muted text-muted-foreground"}`}>
                          {ticket.status.replace(/_/g, " ")}
                        </Badge>
                        {slaBreached && (
                          <Badge variant="destructive" className="text-[10px] animate-pulse">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" /> SLA Breached
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ticket.description || "No description provided."}</p>
                    </div>
                    <div className="text-xs text-muted-foreground md:text-right shrink-0">
                      <p className="capitalize">Priority: {ticket.priority}</p>
                      <p>{new Date(ticket.created_at).toLocaleDateString("en-AU")}</p>
                      {ticket.sla_due_at && !["resolved", "closed"].includes(ticket.status) && (
                        <p className={slaBreached ? "text-destructive font-semibold" : "text-[hsl(var(--success))]"}>
                          {slaBreached ? "Overdue" : `Due: ${format(new Date(ticket.sla_due_at), "MMM d, h:mm a")}`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
