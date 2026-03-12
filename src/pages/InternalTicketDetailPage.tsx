import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useInternalTickets, InternalTicket, TicketComment, TicketActivity, DEPARTMENTS, TICKET_STATUSES } from "@/hooks/useInternalTickets";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, MessageSquare, Brain, Clock, User, Send, Sparkles,
  Edit3, Copy, RotateCcw, Bot, Wand2, ArrowRight, History,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  need_extra_time: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  closed: "bg-muted text-muted-foreground border-border",
  under_review: "bg-accent/20 text-accent-foreground border-accent/30",
  in_progress: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  resolved: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  critical: "bg-destructive/20 text-destructive",
};

const actionLabels: Record<string, string> = {
  created: "Ticket Created",
  status_changed: "Status Changed",
  reassigned: "Department Reassigned",
  assigned_user: "User Assigned",
  comment_added: "Comment Added",
};

const InternalTicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { updateTicketStatus, reassignDepartment, fetchComments, addComment, fetchActivity } = useInternalTickets();
  const {
    analyzing, analysis, analyzeTicket,
    suggestingReplies, replySuggestions, generateInternalReply,
  } = useTicketAI();

  const [ticket, setTicket] = useState<InternalTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [activity, setActivity] = useState<TicketActivity[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [editingReply, setEditingReply] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("internal_tickets").select("*").eq("id", id).single();
    if (data) setTicket(data as any);
    setLoading(false);
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    const data = await fetchComments(id);
    setComments(data as TicketComment[]);
  }, [id, fetchComments]);

  const loadActivity = useCallback(async () => {
    if (!id) return;
    const data = await fetchActivity(id);
    setActivity(data as TicketActivity[]);
  }, [id, fetchActivity]);

  useEffect(() => { loadTicket(); loadComments(); loadActivity(); }, [loadTicket, loadComments, loadActivity]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`ticket-comments-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "internal_ticket_comments", filter: `ticket_id=eq.${id}` }, () => {
        loadComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, loadComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    await addComment(id, newComment);
    setNewComment("");
    setEditingReply(false);
    loadComments();
    loadActivity();
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateTicketStatus(id, status);
    loadTicket();
    loadActivity();
  };

  const handleReassign = async (dept: string) => {
    if (!id) return;
    await reassignDepartment(id, dept);
    loadTicket();
    loadActivity();
  };

  const handleAIAnalysis = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    await analyzeTicket({
      subject: ticket.title,
      description: ticket.description,
      department: ticket.assigned_to_department || ticket.department,
      priority: ticket.priority,
    });
  };

  const handleAISuggestReplies = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    await generateInternalReply({
      title: ticket.title,
      description: ticket.description,
      department: ticket.assigned_to_department || ticket.department,
      priority: ticket.priority,
      status: ticket.status,
      comments: comments.map(c => ({ user: c.user_name, text: c.content })),
    });
  };

  const useReply = (text: string) => {
    setNewComment(text);
    setEditingReply(true);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!ticket) return <div className="text-center py-12 text-muted-foreground">Ticket not found</div>;

  const canManage = isSuperAdmin || isBusinessAdmin;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/internal-tickets")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Back to Tickets
      </Button>

      {/* Ticket Header */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                <Badge variant="outline" className={statusColors[ticket.status] || "bg-muted text-muted-foreground"}>
                  {ticket.status.replace(/_/g, " ")}
                </Badge>
                {(ticket.source_department || ticket.assigned_to_department) && (
                  <Badge variant="outline" className="bg-accent/10 text-accent-foreground flex items-center gap-1">
                    {ticket.source_department || "?"} <ArrowRight className="h-3 w-3" /> {ticket.assigned_to_department || ticket.department}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created {new Date(ticket.created_at).toLocaleString()}</span>
            {ticket.resolved_at && <span>Resolved {new Date(ticket.resolved_at).toLocaleString()}</span>}
          </div>

          {/* Admin controls: Status dropdown + Reassign */}
          {canManage && ticket.status !== "closed" && (
            <div className="flex gap-3 flex-wrap items-end border-t border-border pt-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reassign To</Label>
                <Select value={ticket.assigned_to_department || ticket.department} onValueChange={handleReassign}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={handleAIAnalysis} disabled={analyzing}>
          <Brain className="h-4 w-4 mr-1" />{analyzing ? "Analyzing…" : "AI Analyze"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleAISuggestReplies} disabled={suggestingReplies}>
          <Wand2 className="h-4 w-4 mr-1" />{suggestingReplies ? "Generating…" : "AI Reply Suggestions"}
        </Button>
      </div>

      {/* AI Panel */}
      {showAIPanel && (analysis || replySuggestions.length > 0) && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />AI Assistant</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {analysis && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><p className="text-xs text-muted-foreground">Sentiment</p><p className="text-sm font-medium capitalize">{analysis.sentiment}</p></div>
                  <div><p className="text-xs text-muted-foreground">Recommended Priority</p><p className="text-sm font-medium capitalize">{analysis.recommended_priority}</p></div>
                  <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium capitalize">{analysis.category}</p></div>
                  <div><p className="text-xs text-muted-foreground">Escalation Risk</p><p className="text-sm font-medium">{Math.round(analysis.escalation_risk * 100)}%</p></div>
                </div>
                {analysis.summary && <div><p className="text-xs text-muted-foreground mb-1">Summary</p><p className="text-sm">{analysis.summary}</p></div>}
                {analysis.suggested_reply && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Suggested Action</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{analysis.suggested_reply}</p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => useReply(analysis.suggested_reply)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Edit & Send
                    </Button>
                  </div>
                )}
              </>
            )}
            {replySuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Reply Suggestions</p>
                {replySuggestions.map((r, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{r.style}</Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { navigator.clipboard.writeText(r.text); toast.success("Copied"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => useReply(r.text)}>
                          <Edit3 className="h-3 w-3 mr-1" /> Use
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Discussion & Activity Tabs */}
      <Tabs defaultValue="discussion">
        <TabsList>
          <TabsTrigger value="discussion" className="gap-1"><MessageSquare className="h-3.5 w-3.5" />Discussion ({comments.length})</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1"><History className="h-3.5 w-3.5" />Activity Log ({activity.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discussion">
          <Card className="border-border">
            <CardContent className="space-y-4 pt-4">
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{c.user_name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              <Separator />
              {editingReply && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Bot className="h-3 w-3" />
                  <span>AI-generated reply — review and edit before sending</span>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…" rows={3} className="flex-1" />
                <div className="flex flex-col gap-1 self-end">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                  {editingReply && (
                    <Button size="icon" variant="ghost" onClick={() => { setNewComment(""); setEditingReply(false); }}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-border">
            <CardContent className="pt-4">
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity recorded.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{actionLabels[a.action_type] || a.action_type}</span>
                          <span className="text-xs text-muted-foreground">by {a.user_name || "System"}</span>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        {a.old_value && a.new_value && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {a.old_value} → {a.new_value}
                          </p>
                        )}
                        {a.details && <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalTicketDetailPage;
