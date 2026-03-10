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
import { ArrowLeft, MessageSquare, Brain, Clock, User, Send } from "lucide-react";
import { toast } from "sonner";

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

const InternalTicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { updateTicketStatus, fetchComments, addComment } = useInternalTickets();
  const { analyzing, analysis, analyzeTicket } = useTicketAI();

  const [ticket, setTicket] = useState<InternalTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Realtime comments
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
    loadComments();
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await updateTicketStatus(id, status);
    loadTicket();
  };

  const handleAIAnalysis = async () => {
    if (!ticket) return;
    await analyzeTicket({ subject: ticket.title, description: ticket.description, department: ticket.department, priority: ticket.priority });
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
            <div className="flex gap-2 flex-wrap" >
              {(isSuperAdmin || isBusinessAdmin) && ticket.status !== "closed" && (
                <>
                  {ticket.status === "open" && <Button size="sm" onClick={() => handleStatusChange("under_review")}>Review</Button>}
                  {ticket.status === "under_review" && <Button size="sm" onClick={() => handleStatusChange("in_progress")}>Start Work</Button>}
                  {ticket.status === "in_progress" && <Button size="sm" onClick={() => handleStatusChange("resolved")}>Resolve</Button>}
                  {ticket.status === "resolved" && <Button size="sm" onClick={() => handleStatusChange("closed")}>Close</Button>}
                </>
              )}
              <Button size="sm" variant="outline" onClick={handleAIAnalysis} disabled={analyzing}>
                <Brain className="h-4 w-4 mr-1" />{analyzing ? "Analyzing…" : "AI Analyze"}
              </Button>
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

      {/* AI Analysis */}
      {analysis && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />AI Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted-foreground">Sentiment</p><p className="text-sm font-medium capitalize">{analysis.sentiment}</p></div>
              <div><p className="text-xs text-muted-foreground">Recommended Priority</p><p className="text-sm font-medium capitalize">{analysis.recommended_priority}</p></div>
              <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium capitalize">{analysis.category}</p></div>
              <div><p className="text-xs text-muted-foreground">Escalation Risk</p><p className="text-sm font-medium">{Math.round(analysis.escalation_risk * 100)}%</p></div>
            </div>
            {analysis.summary && <div><p className="text-xs text-muted-foreground mb-1">Summary</p><p className="text-sm">{analysis.summary}</p></div>}
            {analysis.suggested_reply && <div><p className="text-xs text-muted-foreground mb-1">Suggested Action</p><p className="text-sm bg-muted/50 p-3 rounded-md">{analysis.suggested_reply}</p></div>}
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
          <div className="flex gap-2">
            <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…" rows={2} className="flex-1" />
            <Button onClick={handleAddComment} disabled={!newComment.trim()} size="icon" className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalTicketDetailPage;
