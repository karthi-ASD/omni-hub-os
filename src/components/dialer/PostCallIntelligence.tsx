import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, RefreshCw } from "lucide-react";
import type { AICoachingInsight } from "@/hooks/useAICallAssistant";
import type { TranscriptLine } from "@/hooks/useCallTranscript";

interface PostCallIntelligenceProps {
  session: any;
  coaching: AICoachingInsight | null;
  transcriptLines: TranscriptLine[];
}

export function PostCallIntelligence({ session, coaching, transcriptLines }: PostCallIntelligenceProps) {
  const [pollCount, setPollCount] = useState(0);
  const [retried, setRetried] = useState(false);
  const maxPolls = 8; // 8 polls × 4s = 32s max wait

  // Poll for AI analysis if not yet available
  const { data: freshSession } = useQuery({
    queryKey: ["postcall-ai-poll", session.id, pollCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("ai_summary, ai_score, recording_url, call_duration")
        .eq("id", session.id)
        .single();
      return data as any;
    },
    enabled: !!session.id && !session.ai_summary && pollCount < maxPolls,
    staleTime: 0,
  });

  // Auto-poll every 4s if no summary yet, with a retry trigger
  useEffect(() => {
    if (session.ai_summary || (freshSession?.ai_summary)) {
      console.log("POST_CALL_AI_SUCCESS", { sessionId: session.id });
      return;
    }
    if (pollCount >= maxPolls) {
      // Try one manual retry of the AI analyze function
      if (!retried && session.id) {
        setRetried(true);
        console.log("POST_CALL_AI_RETRYING", { sessionId: session.id });
        supabase.functions.invoke("dialer-ai-analyze", { body: { session_id: session.id } })
          .then(() => setPollCount(0))
          .catch(() => console.log("POST_CALL_AI_FAILED", { sessionId: session.id }));
      } else {
        console.log("POST_CALL_AI_TIMEOUT", { sessionId: session.id });
      }
      return;
    }

    console.log("POST_CALL_AI_STARTED", { sessionId: session.id, poll: pollCount + 1 });
    const timer = setTimeout(() => {
      setPollCount(c => c + 1);
    }, 4000);

    return () => clearTimeout(timer);
  }, [pollCount, session.ai_summary, freshSession?.ai_summary, session.id, retried]);

  const aiSummary = session.ai_summary || freshSession?.ai_summary;
  const aiScore = session.ai_score ?? freshSession?.ai_score;
  const recordingUrl = session.recording_url || freshSession?.recording_url;
  const duration = session.call_duration || freshSession?.call_duration;
  const finalLines = transcriptLines.filter(l => l.isFinal);
  const isPolling = !aiSummary && pollCount < maxPolls;
  const pollFailed = !aiSummary && pollCount >= maxPolls;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" /> Post-Call Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {aiSummary ? (
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">AI Summary</p>
              <p className="text-xs leading-relaxed">{aiSummary}</p>
            </div>
            {aiScore != null && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Call Quality Score</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        aiScore >= 70 ? "bg-emerald-500" :
                        aiScore >= 40 ? "bg-amber-500" : "bg-destructive"
                      }`}
                      style={{ width: `${aiScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold">{aiScore}/100</span>
                </div>
              </div>
            )}
            {coaching && (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Intent:</span> {coaching.intent}
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Sentiment:</span> {coaching.sentiment}
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Risk:</span> {coaching.risk}
                </div>
                <div className="p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">Close:</span> {coaching.closeReadiness}
                </div>
              </div>
            )}
            {finalLines.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">
                  Transcript ({finalLines.length} segments)
                </p>
                <Badge variant="outline" className="text-[10px]">Available for review</Badge>
              </div>
            )}
            {recordingUrl && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Recording</p>
                <audio controls className="w-full h-8" src={recordingUrl} preload="none" />
              </div>
            )}
          </div>
        ) : isPolling ? (
          <div className="text-center py-4">
            <RefreshCw className="h-4 w-4 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Processing AI analysis…</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Attempt {pollCount + 1}/{maxPolls} — summary will appear shortly
            </p>
          </div>
        ) : pollFailed ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">AI analysis not available for this call.</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              The call may have been too short or the analysis timed out.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
