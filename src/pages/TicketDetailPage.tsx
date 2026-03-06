import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTicketAI } from "@/hooks/useTicketAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Sparkles, MessageSquare, Clock, AlertTriangle,
  Send, Bot, Shield, Tag, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const TicketDetailPage = () => {
  usePageTitle("Ticket Detail");
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { analyzing, analysis, analyzeTicket, suggestingReplies, replySuggestions, suggestReplies } = useTicketAI();

  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

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
      // Fetch comments from audit_logs as comment proxy
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
    toast.success(isInternal ? "Internal note added" : "Comment added");
    setNewComment("");
    // Refresh comments
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
    await suggestReplies({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      comments: comments.map(c => (c as any).new_value_json?.comment).filter(Boolean),
    });
  };

  const updateStatus = async (status: string) => {
    if (!id) return;
    await supabase.from("support_tickets").update({
      status,
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    setTicket((t: any) => ({ ...t, status }));
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
          {suggestingReplies ? "Generating..." : "AI Reply Suggestions"}
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

      {/* AI Analysis Panel */}
      {showAIPanel && (analysis || replySuggestions.length > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis && (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-muted-foreground">Sentiment</p>
                    <p className="font-medium capitalize text-foreground">{analysis.sentiment}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-muted-foreground">Escalation Risk</p>
                    <p className="font-medium text-foreground">{analysis.escalation_risk}%</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium text-foreground">{analysis.category}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2">
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize text-foreground">{analysis.recommended_priority}</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">AI Summary</p>
                  <p className="text-xs text-foreground">{analysis.summary}</p>
                </div>
                <div className="bg-background rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Suggested Reply</p>
                  <p className="text-xs text-foreground">{analysis.suggested_reply}</p>
                  <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setNewComment(analysis.suggested_reply)}>
                    Use as Reply
                  </Button>
                </div>
                <Button size="sm" onClick={applyAIAnalysis}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Apply AI Analysis to Ticket
                </Button>
              </>
            )}
            {replySuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Reply Suggestions</p>
                {replySuggestions.map((r, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px] capitalize">{r.style}</Badge>
                      <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => setNewComment(r.text)}>
                        Use <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <p className="text-xs text-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comments / Audit Trail */}
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
                    <div key={c.id} className={`px-4 py-3 ${isNote ? "bg-warning/5" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${isNote ? "bg-warning/10 text-warning" : ""}`}>
                          {isNote ? "Internal Note" : c.action_type?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {commentData?.comment && (
                        <p className="text-xs text-foreground">{commentData.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          {/* Add Comment */}
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isInternal ? "default" : "outline"}
                className="text-[10px] h-6"
                onClick={() => setIsInternal(!isInternal)}
              >
                <Shield className="h-3 w-3 mr-1" />
                {isInternal ? "Internal Note" : "Public Comment"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder={isInternal ? "Add internal note..." : "Add comment..."}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetailPage;
