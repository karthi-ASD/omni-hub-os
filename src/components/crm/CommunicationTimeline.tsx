import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Clock, Mic, FileText, Brain, Play, User } from "lucide-react";
import { format } from "date-fns";
import {
  getCommunicationTimeline,
  type CommunicationRecord,
  getEntityCommunicationStats,
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
};

export function CommunicationTimeline({ entityType, entityId }: CommunicationTimelineProps) {
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    Promise.all([
      getCommunicationTimeline(entityType, entityId),
      getEntityCommunicationStats(entityType, entityId),
    ]).then(([timeline, entityStats]) => {
      setRecords(timeline);
      setStats(entityStats);
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Calls</p>
            <p className="text-lg font-bold">{stats.totalCalls}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase">Connected</p>
            <p className="text-lg font-bold text-emerald-600">{stats.connectedCalls}</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[9px] ${STATUS_BADGE[r.call_status] || "bg-muted"}`}>
                    {r.call_status}
                  </Badge>
                  {r.disposition && (
                    <Badge variant="outline" className="text-[9px]">{r.disposition}</Badge>
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

              {r.ai_synopsis_internal && (
                <div className="rounded bg-muted/50 p-2 text-[11px]">
                  <div className="flex items-center gap-1 mb-0.5 font-medium">
                    <Brain className="h-3 w-3" /> AI Synopsis
                  </div>
                  <p className="text-muted-foreground line-clamp-3">{r.ai_synopsis_internal}</p>
                </div>
              )}

              {r.transcript_text && (
                <details className="text-[10px]">
                  <summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <FileText className="h-3 w-3" /> View Transcript
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
