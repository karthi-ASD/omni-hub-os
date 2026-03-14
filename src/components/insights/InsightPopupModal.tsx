import { useState, useEffect, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTodayInsight, useInsightViews, useInsightComments } from "@/hooks/useDailyInsights";
import { Play, CheckCircle, MessageSquare, X, Sparkles } from "lucide-react";

const priorityColors: Record<string, string> = {
  normal: "bg-info/10 text-info",
  important: "bg-warning/10 text-warning",
  mandatory: "bg-destructive/10 text-destructive",
};

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  return url;
}

export function InsightPopupModal() {
  const { insight, loading } = useTodayInsight();
  const { myView, markViewed, acknowledge } = useInsightViews(insight?.id);
  const { comments, addComment } = useInsightComments(insight?.id);
  const [open, setOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    // Only show if there's an insight and user hasn't viewed it
    if (!loading && insight && !myView) {
      const timer = setTimeout(() => setOpen(true), 1500); // slight delay for UX
      return () => clearTimeout(timer);
    }
  }, [loading, insight, myView]);

  if (!insight) return null;

  const embedUrl = insight.video_url ? getEmbedUrl(insight.video_url) : null;

  const handleMarkViewed = () => {
    markViewed(insight.id);
    setOpen(false);
  };

  const handleAcknowledge = () => {
    acknowledge(insight.id);
    setOpen(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(commentText.trim());
    setCommentText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg">NextWeb Daily Insight</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Badge className={priorityColors[insight.priority_level] || ""}>{insight.priority_level}</Badge>
          <h3 className="text-xl font-bold">{insight.title}</h3>

          {/* Lazy-loaded video player */}
          {embedUrl && (
            <div>
              {showVideo ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <Button variant="outline" className="w-full gap-2 h-12" onClick={() => setShowVideo(true)}>
                  <Play className="h-5 w-5 text-primary" /> Watch Video
                </Button>
              )}
            </div>
          )}

          {insight.message && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Message</p>
              <p className="text-sm">{insight.message}</p>
            </div>
          )}

          {insight.nextweb_application && (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
              <p className="text-sm font-medium text-primary mb-1">How this applies to NextWeb</p>
              <p className="text-sm">{insight.nextweb_application}</p>
            </div>
          )}

          {/* Comments section */}
          {insight.allow_comments && (
            <div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="h-3.5 w-3.5" /> {comments.length} Comments
              </Button>
              {showComments && (
                <div className="mt-2 space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="bg-muted/50 rounded-lg p-2">
                      <p className="text-sm">{c.comment}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." rows={2} className="text-sm" />
                    <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Post</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleMarkViewed} className="gap-2 flex-1">
              <CheckCircle className="h-4 w-4" /> Mark as Viewed
            </Button>
            {insight.require_acknowledgement && (
              <Button onClick={handleAcknowledge} variant="secondary" className="gap-2 flex-1">
                <CheckCircle className="h-4 w-4" /> Acknowledge
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpen(false)} className="gap-2">
              <X className="h-4 w-4" /> Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
