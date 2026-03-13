import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useUnifiedTickets, TicketMessage, TicketAuditEntry } from "@/hooks/useUnifiedTickets";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, Brain, Sparkles, Send, Bot, Tag, Mail, Wand2,
  Clock, AlertTriangle, LinkIcon, Building2, User, Search,
  Plus, Shield, Copy, Edit3, CheckCircle2, RotateCcw,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  critical: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  assigned: "bg-accent/10 text-accent-foreground",
  in_progress: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  waiting_for_client: "bg-muted text-muted-foreground",
  pending_client_mapping: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  escalated: "bg-destructive/10 text-destructive",
  resolved: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  closed: "bg-muted text-muted-foreground",
};

const DEPARTMENTS = ["support", "seo", "accounts", "development", "hr", "sales", "general"];

const UnifiedTicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const {
    updateStatus, assignTicket, linkToClient,
    changeDepartment, changePriority,
    fetchMessages, addMessage, fetchAuditLog,
  } = useUnifiedTickets();
  const {
    analyzing, analysis, analyzeTicket,
    suggestingReplies, replySuggestions, suggestReplies,
    generatingContextReply, contextualReply, generateContextualReply,
    generatingDraft, emailDraft, generateEmailDraft,
  } = useTicketAI();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [auditLog, setAuditLog] = useState<TicketAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [aiTab, setAiTab] = useState("analysis");
  const [showAI, setShowAI] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [saveAltEmail, setSaveAltEmail] = useState(true);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    contact_name: "", company: "", email: "", phone: "", website: "", city: "", state: "",
  });

  const fetchTicket = useCallback(async () => {
    if (!id || !profile?.business_id) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", id)
      .eq("business_id", profile.business_id)
      .single();
    setTicket(data);
    if (data) {
      const msgs = await fetchMessages(id);
      setMessages(msgs);
      const logs = await fetchAuditLog(id);
      setAuditLog(logs);
    }
    setLoading(false);
  }, [id, profile?.business_id, fetchMessages, fetchAuditLog]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`ticket-msgs-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (p) => {
        if ((p.new as any)?.ticket_id === id) {
          setMessages(prev => [...prev, p.new as TicketMessage]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;
    await addMessage(id, newMessage, isInternal);
    setNewMessage("");
    setIsInternal(false);
  };

  const handleSearchClients = async () => {
    if (!clientSearch.trim() || !profile?.business_id) return;
    const q = clientSearch.trim();
    const { data } = await supabase
      .from("clients")
      .select("id, contact_name, company, email, phone, website")
      .eq("business_id", profile.business_id)
      .or(`contact_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,website.ilike.%${q}%`)
      .limit(10);
    setClientResults(data || []);
  };

  const handleLinkClient = async (clientId: string) => {
    if (!id) return;
    await linkToClient(id, clientId, saveAltEmail);
    setShowLinkDialog(false);
    fetchTicket();
  };

  const handleCreateClientFromTicket = async () => {
    if (!profile?.business_id || !newClientForm.contact_name.trim()) return;
    const { data, error } = await supabase.from("clients").insert({
      business_id: profile.business_id,
      contact_name: newClientForm.contact_name,
      company: newClientForm.company || null,
      email: newClientForm.email || ticket?.sender_email || null,
      phone: newClientForm.phone || null,
      website: newClientForm.website || null,
      city: newClientForm.city || null,
      state: newClientForm.state || null,
    }).select().single();
    if (error) { toast.error("Failed to create client"); return; }
    if (data && id) {
      await linkToClient(id, data.id, true);
      setShowCreateClient(false);
      setShowLinkDialog(false);
      fetchTicket();
      toast.success("Client created and linked");
    }
  };

  const handleAIAnalyze = async () => {
    if (!ticket) return;
    setShowAI(true); setAiTab("analysis");
    await analyzeTicket({ subject: ticket.subject, description: ticket.description, category: ticket.category, priority: ticket.priority, status: ticket.status });
  };

  const handleAISuggest = async () => {
    if (!ticket) return;
    setShowAI(true); setAiTab("replies");
    await suggestReplies({ subject: ticket.subject, description: ticket.description, category: ticket.category, comments: messages.map(m => m.content).filter(Boolean) });
  };

  const handleSmartReply = async () => {
    if (!ticket) return;
    setShowAI(true); setAiTab("contextual");
    await generateContextualReply({
      ticket: { subject: ticket.subject, description: ticket.description, category: ticket.category, priority: ticket.priority, sender_email: ticket.sender_email, sender_name: ticket.sender_name },
      conversation_history: messages.map(m => ({ type: m.sender_type, text: m.content, timestamp: m.created_at })),
    });
  };

  const handleEmailDraft = async () => {
    if (!ticket) return;
    setShowAI(true); setAiTab("email");
    await generateEmailDraft({
      purpose: `Reply to: ${ticket.subject}`,
      recipient_name: ticket.sender_name,
      recipient_email: ticket.sender_email,
      context: { ticket_subject: ticket.subject, ticket_description: ticket.description, conversation: messages.map(m => m.content).filter(Boolean) },
      tone: "professional",
    });
  };

  const useReply = (text: string) => { setNewMessage(text); };

  if (loading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-60 w-full" /></div>;
  if (!ticket) return <div className="text-center py-12"><p className="text-muted-foreground">Ticket not found</p><Button variant="outline" className="mt-4" onClick={() => navigate("/unified-tickets")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button></div>;

  const canLinkClient = isSuperAdmin || isBusinessAdmin;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/unified-tickets")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <Badge className={`text-[10px] border-0 ${priorityColors[ticket.priority]}`}>{ticket.priority}</Badge>
            <Badge className={`text-[10px] border-0 ${statusColors[ticket.status]}`}>{ticket.status?.replace(/_/g, " ")}</Badge>
            {ticket.client_match_status && ticket.client_match_status !== "matched" && (
              <Badge className="text-[10px] border-0 bg-destructive/10 text-destructive">
                <LinkIcon className="h-2.5 w-2.5 mr-0.5" /> {ticket.client_match_status}
              </Badge>
            )}
            {ticket.source_type && <Badge variant="secondary" className="text-[9px]">{ticket.source_type}</Badge>}
          </div>
          <h1 className="text-lg font-bold text-foreground truncate">{ticket.subject}</h1>
        </div>
      </div>

      {/* Unmatched Client Banner */}
      {ticket.client_match_status !== "matched" && canLinkClient && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {ticket.client_match_status === "suggested" ? "Possible client matches found" : "Client not identified"}
              </span>
              {ticket.sender_email && <span className="text-xs text-muted-foreground">({ticket.sender_email})</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowLinkDialog(true)}>
                <LinkIcon className="h-3.5 w-3.5 mr-1" /> Link to Client
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowCreateClient(true); setShowLinkDialog(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleAIAnalyze} disabled={analyzing}>
          <Brain className="h-3.5 w-3.5 mr-1.5" /> {analyzing ? "Analyzing..." : "AI Analyze"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleAISuggest} disabled={suggestingReplies}>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {suggestingReplies ? "..." : "AI Replies"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleSmartReply} disabled={generatingContextReply}>
          <Wand2 className="h-3.5 w-3.5 mr-1.5" /> {generatingContextReply ? "..." : "Smart Reply"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleEmailDraft} disabled={generatingDraft}>
          <Mail className="h-3.5 w-3.5 mr-1.5" /> {generatingDraft ? "..." : "Email Draft"}
        </Button>

        {(isSuperAdmin || isBusinessAdmin) && (
          <>
            {ticket.department && (
              <Select value={ticket.department} onValueChange={v => { changeDepartment(id!, v); fetchTicket(); }}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={ticket.priority} onValueChange={v => { changePriority(id!, v); fetchTicket(); }}>
              <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {ticket.status !== "closed" && (
              <Select value={ticket.status} onValueChange={v => { updateStatus(id!, v); fetchTicket(); }}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_client">Waiting for Client</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        )}
      </div>

      {/* Ticket Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {ticket.description && (
            <div><p className="text-xs font-medium text-muted-foreground mb-1">Description</p><p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p></div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground capitalize">{ticket.category?.replace(/_/g, " ")}</span></div>
            <div><span className="text-muted-foreground">Channel:</span> <span className="text-foreground">{ticket.channel || "—"}</span></div>
            <div><span className="text-muted-foreground">Department:</span> <span className="text-foreground capitalize">{ticket.department || "—"}</span></div>
            <div><span className="text-muted-foreground">Source:</span> <span className="text-foreground capitalize">{ticket.source_type || "manual"}</span></div>
            <div><span className="text-muted-foreground">From:</span> <span className="text-foreground">{ticket.sender_name || ticket.sender_email || "—"}</span></div>
            <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground">{format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}</span></div>
            {ticket.sla_due_at && <div><span className="text-muted-foreground">SLA Due:</span> <span className="text-foreground">{format(new Date(ticket.sla_due_at), "MMM d, h:mm a")}</span></div>}
            {ticket.sentiment && <div><span className="text-muted-foreground">Sentiment:</span> <span className="text-foreground capitalize">{ticket.sentiment}</span></div>}
          </div>
          {ticket.ai_tags && ticket.ai_tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {ticket.ai_tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>)}
            </div>
          )}
          {ticket.ai_summary && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-[10px] font-medium text-primary flex items-center gap-1 mb-1"><Bot className="h-3 w-3" /> AI Summary</p>
              <p className="text-xs text-foreground">{ticket.ai_summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Panel */}
      {showAI && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={aiTab} onValueChange={setAiTab}>
              <TabsList className="mb-3">
                <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                <TabsTrigger value="replies" className="text-xs">Suggestions</TabsTrigger>
                <TabsTrigger value="contextual" className="text-xs">Smart Reply</TabsTrigger>
                <TabsTrigger value="email" className="text-xs">Email Draft</TabsTrigger>
              </TabsList>
              <TabsContent value="analysis" className="space-y-3">
                {analyzing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Analyzing...</div>}
                {analysis && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Sentiment</p><p className="font-medium capitalize text-foreground">{analysis.sentiment}</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Escalation Risk</p><p className="font-medium text-foreground">{analysis.escalation_risk}%</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Category</p><p className="font-medium text-foreground">{analysis.category}</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Priority</p><p className="font-medium capitalize text-foreground">{analysis.recommended_priority}</p></div>
                    </div>
                    {analysis.suggested_reply && (
                      <div className="bg-background rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground mb-1">Suggested Reply</p>
                        <p className="text-xs text-foreground">{analysis.suggested_reply}</p>
                        <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => useReply(analysis.suggested_reply)}>
                          <Edit3 className="h-3 w-3 mr-1" /> Use
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="replies" className="space-y-2">
                {suggestingReplies && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Generating...</div>}
                {replySuggestions.map((r, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{r.style}</Badge>
                      <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => useReply(r.text)}><Edit3 className="h-3 w-3 mr-1" /> Use</Button>
                    </div>
                    <p className="text-xs text-foreground">{r.text}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="contextual" className="space-y-3">
                {generatingContextReply && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Generating...</div>}
                {contextualReply && (
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize text-[9px]">{contextualReply.tone}</Badge>
                      <Badge variant="outline" className="text-[9px]">{contextualReply.confidence}% confidence</Badge>
                    </div>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{contextualReply.reply}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => useReply(contextualReply.reply)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Use
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="email" className="space-y-3">
                {generatingDraft && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Drafting...</div>}
                {emailDraft && (
                  <div className="bg-background rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">Subject: {emailDraft.subject}</p>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{emailDraft.full_text}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => useReply(emailDraft.full_text)}>
                        <Edit3 className="h-3 w-3 mr-1" /> Use
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => { navigator.clipboard.writeText(emailDraft.full_text); toast.success("Copied"); }}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Conversation Thread */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Conversation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3 pr-4">
              {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No messages yet.</p>}
              {messages.map(msg => (
                <div key={msg.id} className={`rounded-lg p-3 ${msg.is_internal ? "bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/20" : msg.sender_type === "customer" ? "bg-muted/50" : "bg-primary/5"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_type === "customer" ? <User className="h-3 w-3 text-muted-foreground" /> : msg.sender_type === "system" ? <Bot className="h-3 w-3 text-primary" /> : <Shield className="h-3 w-3 text-primary" />}
                    <span className="text-xs font-medium text-foreground">{msg.sender_name || msg.sender_email || "System"}</span>
                    {msg.is_internal && <Badge variant="outline" className="text-[8px] bg-[hsl(var(--warning))]/10">Internal</Badge>}
                    <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reply Box */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Switch checked={isInternal} onCheckedChange={setIsInternal} id="internal-toggle" />
              <Label htmlFor="internal-toggle" className="text-xs">Internal note</Label>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={isInternal ? "Add internal note..." : "Reply to customer..."}
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="h-auto">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Activity Log</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2 pr-4">
              {auditLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-foreground font-medium">{entry.action_type.replace(/_/g, " ")}</span>
                    {entry.user_name && <span className="text-muted-foreground"> by {entry.user_name}</span>}
                    {entry.details && <span className="text-muted-foreground"> — {entry.details.slice(0, 100)}</span>}
                    <span className="text-muted-foreground block">{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Link to Client Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{showCreateClient ? "Create Client from Ticket" : "Link Ticket to Client"}</DialogTitle></DialogHeader>

          {showCreateClient ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Name *</Label><Input value={newClientForm.contact_name} onChange={e => setNewClientForm({ ...newClientForm, contact_name: e.target.value })} /></div>
                <div><Label>Company</Label><Input value={newClientForm.company} onChange={e => setNewClientForm({ ...newClientForm, company: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={newClientForm.email || ticket?.sender_email || ""} onChange={e => setNewClientForm({ ...newClientForm, email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={newClientForm.phone} onChange={e => setNewClientForm({ ...newClientForm, phone: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={newClientForm.website} onChange={e => setNewClientForm({ ...newClientForm, website: e.target.value })} /></div>
                <div><Label>State</Label><Input value={newClientForm.state} onChange={e => setNewClientForm({ ...newClientForm, state: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateClientFromTicket} disabled={!newClientForm.contact_name.trim()} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" /> Create & Link
                </Button>
                <Button variant="outline" onClick={() => setShowCreateClient(false)}>Back to Search</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, company, email, phone, domain..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearchClients()}
                />
                <Button onClick={handleSearchClients}><Search className="h-4 w-4" /></Button>
              </div>

              {/* Suggested matches */}
              {ticket.suggested_client_ids && ticket.suggested_client_ids.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Suggested matches based on domain/name:</p>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {clientResults.length === 0 && clientSearch && <p className="text-xs text-muted-foreground text-center py-4">No clients found. Try different search terms or create a new client.</p>}
                {clientResults.map(client => (
                  <div key={client.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{client.company} • {client.email}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleLinkClient(client.id)}>
                      <LinkIcon className="h-3 w-3 mr-1" /> Link
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="save-alt-email" checked={saveAltEmail} onCheckedChange={v => setSaveAltEmail(!!v)} />
                <Label htmlFor="save-alt-email" className="text-xs">
                  Save sender email ({ticket?.sender_email}) as alternate client contact
                </Label>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setShowCreateClient(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create New Client from This Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedTicketDetailPage;
