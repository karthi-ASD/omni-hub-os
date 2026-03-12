import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useInternalTickets, InternalTicket, TicketComment } from "@/hooks/useInternalTickets";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MessageSquare, Brain, Clock, User, Send, Sparkles,
  Edit3, Copy, RotateCcw, Bot, Wand2, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  under_review: "bg-accent/20 text-accent-foreground border-accent/30",
  in_progress: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  resolved: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/20 text-primary",
  high: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  critical: "bg-destructive/20 text-destructive",
};

const InternalTicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { updateTicketStatus, fetchComments, addComment } = useInternalTickets();
  const {
    analyzing, analysis, analyzeTicket,
    suggestingReplies, replySuggestions,
    generateInternalReply,
  } = useTicketAI();

  const [ticket, setTicket] = useState<InternalTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
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

  useEffect(() => { loadTicket(); loadComments(); }, [loadTicket, loadComments]);

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
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateTicketStatus(id, status);
    loadTicket();
  };

  const handleAIAnalysis = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    await analyzeTicket({
      subject: ticket.title,
      description: ticket.description,
      department: ticket.department,
      priority: ticket.priority,
    });
  };

  const handleAISuggestReplies = async () => {
    if (!ticket) return;
    setShowAIPanel(true);
    await generateInternalReply({
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
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

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/internal-tickets")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Back to Tickets
      </Button>

      {/* Ticket Header */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="bg-accent/20 text-accent-foreground">{ticket.department}</Badge>
              </div>
              <CardTitle className="text-xl">{ticket.title}</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(isSuperAdmin || isBusinessAdmin) && ticket.status !== "closed" && (
                <>
                  {ticket.status === "open" && <Button size="sm" onClick={() => handleStatusChange("under_review")}>Review</Button>}
                  {ticket.status === "under_review" && <Button size="sm" onClick={() => handleStatusChange("in_progress")}>Start Work</Button>}
                  {ticket.status === "in_progress" && <Button size="sm" onClick={() => handleStatusChange("resolved")}>Resolve</Button>}
                  {ticket.status === "resolved" && <Button size="sm" onClick={() => handleStatusChange("closed")}>Close</Button>}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ticket.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Created {new Date(ticket.created_at).toLocaleString()}</span>
            {ticket.resolved_at && <span className="flex items-center gap-1">Resolved {new Date(ticket.resolved_at).toLocaleString()}</span>}
          </div>
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

      {/* Discussion Thread */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Discussion ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Start the discussion below.</p>}
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
    </div>
  );
};

export default InternalTicketDetailPage;
