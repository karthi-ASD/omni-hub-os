import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity as logAI } from "@/lib/activity-logger";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Sparkles, MessageSquare, Clock, AlertTriangle,
  Send, Bot, Shield, Tag, ChevronRight, Mail, Wand2, CheckCircle2,
  Copy, Edit3, Zap, FileText, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  critical: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  resolved: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  closed: "bg-muted text-muted-foreground",
};

const TicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const {
    analyzing, analysis, analyzeTicket,
    suggestingReplies, replySuggestions, suggestReplies,
    generatingContextReply, contextualReply, generateContextualReply,
    generatingDraft, emailDraft, generateEmailDraft,
  } = useTicketAI();

  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiTab, setAiTab] = useState("analysis");
  const [editingReply, setEditingReply] = useState(false);

  useEffect(() => {
    if (!id || !profile?.business_id) return;
    const fetchTicket = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", id)
        .eq("business_id", profile.business_id)
        .single();
      setTicket(data);
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "support_ticket")
        .eq("entity_id", id)
        .order("created_at", { ascending: true })
        .limit(50);
      setComments(logs || []);
      setLoading(false);
    };
    fetchTicket();
  }, [id, profile?.business_id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id || !profile) return;
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: isInternal ? "INTERNAL_NOTE" : "TICKET_COMMENT",
      entity_type: "support_ticket",
      entity_id: id,
      new_value_json: { comment: newComment, is_internal: isInternal },
    } as any);
    toast.success(isInternal ? "Internal note added" : "Reply sent");
    setNewComment("");
    setEditingReply(false);
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "support_ticket")
      .eq("entity_id", id)
      .order("created_at", { ascending: true })
      .limit(50);
    setComments(logs || []);
  };

  const handleAIAnalyze = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    setAiTab("analysis");
    await analyzeTicket({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
    });
  };

  const handleAISuggestReplies = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    setAiTab("replies");
    await suggestReplies({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      comments: comments.map(c => (c as any).new_value_json?.comment).filter(Boolean),
    });
  };

  const handleContextualReply = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    setAiTab("contextual");
    // Fetch client context
    let clientData = null;
    if (ticket.sender_email) {
      const { data } = await supabase
        .from("clients")
        .select("id, contact_name, company, website, city, state")
        .eq("business_id", profile?.business_id)
        .eq("email", ticket.sender_email)
        .limit(1)
        .maybeSingle();
      clientData = data;
    }
    await generateContextualReply({
      ticket: {
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        sender_email: ticket.sender_email,
        sender_name: ticket.sender_name,
      },
      client: clientData,
      conversation_history: comments.map(c => ({
        type: (c as any).action_type,
        text: (c as any).new_value_json?.comment,
        timestamp: c.created_at,
      })).filter(c => c.text),
    });
  };

  const handleEmailDraft = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    setAiTab("email");
    await generateEmailDraft({
      purpose: `Reply to support ticket: ${ticket.subject}`,
      recipient_name: ticket.sender_name,
      recipient_email: ticket.sender_email,
      context: {
        ticket_subject: ticket.subject,
        ticket_description: ticket.description,
        ticket_category: ticket.category,
        conversation: comments.map(c => (c as any).new_value_json?.comment).filter(Boolean),
      },
      tone: "professional",
    });
  };

  const useReply = (text: string) => {
    setNewComment(text);
    setEditingReply(true);
  };

  const updateStatus = async (status: string) => {
    if (!id) return;
    await supabase.from("support_tickets").update({
      status,
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    setTicket((t: any) => ({ ...t, status }));
    logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: profile?.business_id, module: "tickets", actionType: "update", entityType: "ticket", entityId: id, description: `Ticket status → ${status}` });
    toast.success(`Status updated to ${status}`);
  };

  const applyAIAnalysis = async () => {
    if (!analysis || !id) return;
    await supabase.from("support_tickets").update({
      sentiment: analysis.sentiment,
      ai_summary: analysis.summary,
      ai_tags: analysis.tags,
      department: analysis.suggested_department || ticket?.department,
    } as any).eq("id", id);
    toast.success("AI analysis applied to ticket");
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/tickets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            <Badge className={`text-[10px] border-0 ${priorityColors[ticket.priority] || ""}`}>{ticket.priority}</Badge>
            <Badge className={`text-[10px] border-0 ${statusColors[ticket.status] || ""}`}>{ticket.status?.replace(/_/g, " ")}</Badge>
          </div>
          <h1 className="text-lg font-bold text-foreground truncate">{ticket.subject}</h1>
        </div>
      </div>

      {/* AI Actions Bar */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleAIAnalyze} disabled={analyzing}>
          <Brain className="h-3.5 w-3.5 mr-1.5" />
          {analyzing ? "Analyzing..." : "AI Analyze"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleAISuggestReplies} disabled={suggestingReplies}>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {suggestingReplies ? "Generating..." : "AI Replies"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleContextualReply} disabled={generatingContextReply}>
          <Wand2 className="h-3.5 w-3.5 mr-1.5" />
          {generatingContextReply ? "Generating..." : "Smart Reply"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleEmailDraft} disabled={generatingDraft}>
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          {generatingDraft ? "Drafting..." : "Email Draft"}
        </Button>
        {(isSuperAdmin || isBusinessAdmin) && ticket.status === "open" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("in_progress")}>Start</Button>
        )}
        {(isSuperAdmin || isBusinessAdmin) && ticket.status === "in_progress" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("resolved")}>Resolve</Button>
        )}
        {(isSuperAdmin || isBusinessAdmin) && ticket.status === "resolved" && (
          <Button size="sm" variant="outline" onClick={() => updateStatus("closed")}>Close</Button>
        )}
      </div>

      {/* Ticket Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {ticket.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground capitalize">{ticket.category?.replace(/_/g, " ")}</span></div>
            <div><span className="text-muted-foreground">Channel:</span> <span className="text-foreground">{ticket.channel || "email"}</span></div>
            <div><span className="text-muted-foreground">Created:</span> <span className="text-foreground">{format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}</span></div>
            {ticket.department && <div><span className="text-muted-foreground">Department:</span> <span className="text-foreground">{ticket.department}</span></div>}
            {ticket.sender_email && <div><span className="text-muted-foreground">From:</span> <span className="text-foreground">{ticket.sender_name || ticket.sender_email}</span></div>}
            {ticket.sentiment && <div><span className="text-muted-foreground">Sentiment:</span> <span className="text-foreground capitalize">{ticket.sentiment}</span></div>}
            {ticket.sla_due_at && <div><span className="text-muted-foreground">SLA Due:</span> <span className="text-foreground">{format(new Date(ticket.sla_due_at), "MMM d, h:mm a")}</span></div>}
          </div>
          {ticket.ai_tags && ticket.ai_tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {ticket.ai_tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
              ))}
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
      {showAIPanel && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Communication Assistant
            </CardTitle>
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
                {analyzing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Analyzing ticket...</div>}
                {analysis && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Sentiment</p><p className="font-medium capitalize text-foreground">{analysis.sentiment}</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Escalation Risk</p><p className="font-medium text-foreground">{analysis.escalation_risk}%</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Category</p><p className="font-medium text-foreground">{analysis.category}</p></div>
                      <div className="bg-background rounded-lg p-2"><p className="text-muted-foreground">Priority</p><p className="font-medium capitalize text-foreground">{analysis.recommended_priority}</p></div>
                    </div>
                    <div className="bg-background rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">AI Summary</p>
                      <p className="text-xs text-foreground">{analysis.summary}</p>
                    </div>
                    <div className="bg-background rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground mb-1">Suggested Reply</p>
                      <p className="text-xs text-foreground">{analysis.suggested_reply}</p>
                      <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => useReply(analysis.suggested_reply)}>
                        <Edit3 className="h-3 w-3 mr-1" /> Edit & Send
                      </Button>
                    </div>
                    <Button size="sm" onClick={applyAIAnalysis}><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Apply Analysis</Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="replies" className="space-y-2">
                {suggestingReplies && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Generating replies...</div>}
                {replySuggestions.map((r, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{r.style}</Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => { navigator.clipboard.writeText(r.text); toast.success("Copied"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => useReply(r.text)}>
                          <Edit3 className="h-3 w-3 mr-1" /> Edit & Send
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground">{r.text}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="contextual" className="space-y-3">
                {generatingContextReply && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Generating context-aware reply...</div>}
                {contextualReply && (
                  <>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Badge variant="outline" className="capitalize">{contextualReply.tone}</Badge>
                      <Badge variant={contextualReply.confidence > 80 ? "default" : "outline"} className="text-[9px]">
                        {contextualReply.confidence}% confidence
                      </Badge>
                      {contextualReply.escalation_needed && (
                        <Badge variant="destructive" className="text-[9px]">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Escalation Recommended
                        </Badge>
                      )}
                    </div>
                    {contextualReply.referenced_context.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        <span className="font-medium">Context used:</span> {contextualReply.referenced_context.join(", ")}
                      </div>
                    )}
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-foreground whitespace-pre-wrap">{contextualReply.reply}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => useReply(contextualReply.reply)}>
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit & Send
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(contextualReply.reply); toast.success("Copied"); }}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                      </Button>
                    </div>
                    {contextualReply.follow_up_actions.length > 0 && (
                      <div className="bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/10 rounded-lg p-2">
                        <p className="text-[10px] font-medium text-[hsl(var(--warning))] mb-1 flex items-center gap-1"><Zap className="h-3 w-3" /> Follow-up Actions</p>
                        <ul className="text-[10px] text-foreground space-y-0.5">
                          {contextualReply.follow_up_actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 mt-0.5 text-muted-foreground" /> {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {!generatingContextReply && !contextualReply && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-2">Generate a context-aware reply using client & project data</p>
                    <Button size="sm" onClick={handleContextualReply}><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Generate Smart Reply</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email" className="space-y-3">
                {generatingDraft && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 animate-spin" /> Drafting email...</div>}
                {emailDraft && (
                  <>
                    <div className="bg-background rounded-lg p-3 border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Subject: {emailDraft.subject}</span>
                      </div>
                      <div className="border-t border-border pt-2">
                        <p className="text-xs text-foreground whitespace-pre-wrap">{emailDraft.full_text}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => useReply(emailDraft.full_text)}>
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit & Send
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(emailDraft.full_text); toast.success("Email draft copied"); }}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                      </Button>
                    </div>
                  </>
                )}
                {!generatingDraft && !emailDraft && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-2">Generate a professional email draft for this ticket</p>
                    <Button size="sm" onClick={handleEmailDraft}><Mail className="h-3.5 w-3.5 mr-1.5" /> Generate Email Draft</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Comments / Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Activity & Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[300px]">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No activity yet</div>
            ) : (
              <div className="divide-y divide-border">
                {comments.map((c: any) => {
                  const isNote = c.action_type === "INTERNAL_NOTE";
                  const commentData = c.new_value_json as any;
                  return (
                    <div key={c.id} className={`px-4 py-3 ${isNote ? "bg-[hsl(var(--warning))]/5" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${isNote ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : ""}`}>
                          {isNote ? "Internal Note" : c.action_type?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {commentData?.comment && (
                        <p className="text-xs text-foreground whitespace-pre-wrap">{commentData.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          {/* Reply Editor */}
          <div className="border-t border-border p-3 space-y-2">
            {editingReply && (
              <div className="flex items-center gap-2 text-[10px] text-primary">
                <Bot className="h-3 w-3" />
                <span>AI-generated reply loaded — review and edit before sending</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isInternal ? "default" : "outline"}
                className="text-[10px] h-6"
                onClick={() => setIsInternal(!isInternal)}
              >
                <Shield className="h-3 w-3 mr-1" />
                {isInternal ? "Internal Note" : "Public Reply"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder={isInternal ? "Add internal note..." : "Type your reply..."}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
                {editingReply && (
                  <Button size="icon" variant="ghost" onClick={() => { setNewComment(""); setEditingReply(false); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetailPage;
