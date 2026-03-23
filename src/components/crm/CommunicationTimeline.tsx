import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Clock, Mic, FileText, Brain, Play, User, PhoneForwarded, Tag, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getCommunicationTimeline,
  type CommunicationRecord,
  getEntityCommunicationStats,
  retryAIProcessing,
} from "@/services/crmCommunicationService";

interface CommunicationTimelineProps {
  entityType: string;
  entityId: string;
}

const STATUS_BADGE: Record<string, string> = {
  connected: "bg-emerald-100 text-emerald-700",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  "no-answer": "bg-amber-100 text-amber-700",
  busy: "bg-amber-100 text-amber-700",
  initiated: "bg-blue-100 text-blue-700",
};

export function CommunicationTimeline({ entityType, entityId }: CommunicationTimelineProps) {
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const handleRetry = async (commId: string) => {
    setRetrying(commId);
    const ok = await retryAIProcessing(commId);
    if (ok) {
      toast.success("AI processing retriggered");
      setRecords((prev) =>
        prev.map((r) => r.id === commId ? { ...r, processing_status: "processing" } : r)
      );
    } else {
      toast.error("Retry failed — preconditions not met");
    }
    setRetrying(null);
  };

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    Promise.all([
      getCommunicationTimeline(entityType, entityId),
      getEntityCommunicationStats(entityType, entityId),
    ]).then(([timeline, entityStats]) => {
      setRecords(timeline);
      setStats(entityStats);

      // Fetch agent profiles for all user_ids in timeline
      const userIds = [...new Set(timeline.map((r) => r.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds)
          .then(({ data }) => {
            const map: Record<string, string> = {};
            (data || []).forEach((p: any) => {
              map[p.user_id] = p.full_name || p.email || "Unknown";
            });
            setProfiles(map);
          });
      }
      setLoading(false);
    });
  }, [entityType, entityId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading communication history…
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Phone className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No call communications recorded yet.
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Calls</p>
            <p className="text-lg font-bold">{stats.totalCalls}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Connected</p>
            <p className="text-lg font-bold text-emerald-600">{stats.connectedCalls}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Connect Rate</p>
            <p className="text-lg font-bold">{stats.connectRate}%</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Talk Time</p>
            <p className="text-lg font-bold">{formatDuration(stats.totalTalkTime)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Last Call</p>
            <p className="text-xs font-medium">
              {stats.lastCallDate ? format(new Date(stats.lastCallDate), "dd MMM HH:mm") : "—"}
            </p>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" /> Communication History ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2 max-h-[400px] overflow-y-auto">
          {records.map((r) => (
            <div key={r.id} className="rounded-lg border p-3 space-y-1.5 text-xs">
              {/* Agent + Date row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-medium">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {profiles[r.user_id] || "Unknown Agent"}
                  </span>
                  <Badge className={`text-[9px] ${STATUS_BADGE[r.call_status] || "bg-muted"}`}>
                    {r.call_status}
                  </Badge>
                  {r.disposition && (
                    <Badge variant="outline" className="text-[9px]">{r.disposition}</Badge>
                  )}
                  {r.callback_required && (
                    <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-700">
                      <PhoneForwarded className="h-2.5 w-2.5 mr-0.5" /> Callback
                    </Badge>
                  )}
                  {/* Processing status */}
                  {r.processing_status === "processing" && (
                    <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                      <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" /> Processing
                    </Badge>
                  )}
                  {r.processing_status === "completed" && (
                    <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-600">✓ AI Done</Badge>
                  )}
                  {r.processing_status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 px-1.5 text-[9px] text-destructive border-destructive/40"
                      disabled={retrying === r.id}
                      onClick={() => handleRetry(r.id)}
                    >
                      {retrying === r.id ? (
                        <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      Retry AI
                    </Button>
                  )}
                </div>
                <span className="text-muted-foreground text-[10px]">
                  {format(new Date(r.start_time), "dd MMM yyyy HH:mm")}
                </span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.duration_seconds > 0 ? formatDuration(r.duration_seconds) : "0:00"}
                </span>
                {r.talk_time_seconds > 0 && (
                  <span className="flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    {formatDuration(r.talk_time_seconds)} talk
                  </span>
                )}
                {r.recording_url && (
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" asChild>
                    <a href={r.recording_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-3 w-3 mr-0.5" /> Recording
                    </a>
                  </Button>
                )}
              </div>

              {/* Auto tags */}
              {r.auto_tags && r.auto_tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {r.auto_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[8px] h-4 px-1">{tag}</Badge>
                  ))}
                </div>
              )}

              {r.ai_synopsis_internal && (
                <div className="rounded bg-muted/50 p-2 text-[11px]">
                  <div className="flex items-center gap-1 mb-0.5 font-medium">
                    <Brain className="h-3 w-3" /> AI Synopsis
                    {r.sentiment && (
                      <Badge variant="outline" className="text-[8px] ml-1">
                        {r.sentiment}
                      </Badge>
                    )}
                    {r.ai_score != null && (
                      <Badge variant="outline" className="text-[8px] ml-1">
                        Score: {r.ai_score}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-3">{r.ai_synopsis_internal}</p>
                </div>
              )}

              {r.transcript_text && (
                <details className="text-[10px]">
                  <summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <FileText className="h-3 w-3" /> View Transcript
                    <Badge variant="outline" className="text-[8px] ml-1">{r.transcript_status}</Badge>
                  </summary>
                  <div className="mt-1 p-2 rounded bg-muted/30 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {r.transcript_text}
                  </div>
                </details>
              )}

              {r.disposition_notes && (
                <p className="text-muted-foreground italic">📝 {r.disposition_notes}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
