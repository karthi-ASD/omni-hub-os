import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import type { TranscriptLine, TranscriptStatus } from "@/hooks/useCallTranscript";

const STATUS_MAP: Record<TranscriptStatus, { label: string; color: string }> = {
  idle: { label: "Idle", color: "bg-muted text-muted-foreground" },
  connecting: { label: "Connecting", color: "bg-amber-500/20 text-amber-700" },
  live: { label: "Live", color: "bg-emerald-500/20 text-emerald-700" },
  delayed: { label: "Delayed", color: "bg-amber-500/20 text-amber-700" },
  failed: { label: "Failed", color: "bg-destructive/20 text-destructive" },
  stopped: { label: "Stopped", color: "bg-muted text-muted-foreground" },
};

interface LiveTranscriptPanelProps {
  lines: TranscriptLine[];
  status: TranscriptStatus;
}

export function LiveTranscriptPanel({ lines, status }: LiveTranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolledRef.current = !atBottom;
  };

  const statusInfo = STATUS_MAP[status];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Live Transcript
          </CardTitle>
          <Badge className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full max-h-[400px] overflow-y-auto space-y-1.5 pr-1"
        >
          {lines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <p>{status === "live" ? "Listening..." : "Transcript will appear during calls"}</p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.id}
                className={`text-xs px-2 py-1 rounded ${
                  line.speaker === "agent"
                    ? "bg-primary/5 border-l-2 border-primary/40"
                    : "bg-secondary/50 border-l-2 border-secondary"
                } ${!line.isFinal ? "opacity-60 italic" : ""}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-semibold text-[10px] uppercase ${
                    line.speaker === "agent" ? "text-primary" : "text-secondary-foreground"
                  }`}>
                    {line.speaker}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {formatMs(line.timestampMs)}
                  </span>
                  {line.confidence != null && (
                    <span className="text-[9px] text-muted-foreground">
                      {Math.round(line.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="leading-relaxed">{line.text}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
