import { Badge } from "@/components/ui/badge";
import { Phone, Disc, FileText, Sparkles, Wifi } from "lucide-react";
import type { TranscriptStatus } from "@/hooks/useCallTranscript";
import type { AIAssistStatus } from "@/hooks/useAICallAssistant";

interface CallStatusBarProps {
  callStatus: string;
  isCallActive: boolean;
  recordingActive: boolean;
  transcriptStatus: TranscriptStatus;
  aiStatus: AIAssistStatus;
  connectionState: string;
  formattedTimer: string;
}

export function CallStatusBar({
  callStatus,
  isCallActive,
  recordingActive,
  transcriptStatus,
  aiStatus,
  connectionState,
  formattedTimer,
}: CallStatusBarProps) {
  if (!isCallActive) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700">
        <Phone className="h-3 w-3" />
        {callStatus === "connected" ? `Connected ${formattedTimer}` : callStatus === "ringing" ? "Ringing..." : "Dialing..."}
      </Badge>
      <Badge variant="outline" className={`gap-1 ${recordingActive ? "border-red-300 text-red-600" : "border-muted text-muted-foreground"}`}>
        <Disc className={`h-3 w-3 ${recordingActive ? "animate-pulse" : ""}`} />
        {recordingActive ? "Recording" : "Rec Off"}
      </Badge>
      <Badge variant="outline" className={`gap-1 ${
        transcriptStatus === "live" ? "border-emerald-300 text-emerald-600" :
        transcriptStatus === "connecting" ? "border-amber-300 text-amber-600" :
        transcriptStatus === "failed" ? "border-destructive text-destructive" :
        "border-muted text-muted-foreground"
      }`}>
        <FileText className="h-3 w-3" />
        Transcript: {transcriptStatus}
      </Badge>
      <Badge variant="outline" className={`gap-1 ${
        aiStatus === "active" ? "border-purple-300 text-purple-600" :
        aiStatus === "processing" ? "border-amber-300 text-amber-600" :
        "border-muted text-muted-foreground"
      }`}>
        <Sparkles className="h-3 w-3" />
        AI: {aiStatus}
      </Badge>
      <Badge variant="outline" className={`gap-1 ${connectionState === "connected" ? "border-emerald-300 text-emerald-600" : "border-muted text-muted-foreground"}`}>
        <Wifi className="h-3 w-3" />
        {connectionState}
      </Badge>
    </div>
  );
}
