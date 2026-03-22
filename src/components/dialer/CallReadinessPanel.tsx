import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Volume2, Phone, RotateCcw, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CallReadinessPanelProps {
  registered: boolean;
  micPermission: string;
  clientHealthy: boolean;
  audioContextState: string | null;
  callStatus: string;
  logEvent: (event: string, data?: Record<string, unknown>) => void;
  startCall: (number: string) => Promise<void>;
  onReconnect: () => void;
  requestMicPermission: () => Promise<boolean>;
}

export function CallReadinessPanel({
  registered,
  micPermission,
  clientHealthy,
  audioContextState,
  callStatus,
  logEvent,
  startCall,
  onReconnect,
  requestMicPermission,
}: CallReadinessPanelProps) {
  const [micTesting, setMicTesting] = useState(false);
  const [micResult, setMicResult] = useState<"idle" | "success" | "failed">("idle");
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [speakerResult, setSpeakerResult] = useState<"idle" | "success" | "failed">("idle");

  const isCallActive = ["dialing", "ringing", "connected"].includes(callStatus);

  const handleTestMic = async () => {
    setMicTesting(true);
    setMicResult("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      logEvent("MIC_TEST_SUCCESS");
      setMicResult("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("MIC_TEST_FAILED", { error: msg });
      setMicResult("failed");
      alert("Please allow microphone access in browser settings.");
    } finally {
      setMicTesting(false);
    }
  };

  const handleTestSpeaker = async () => {
    setSpeakerTesting(true);
    setSpeakerResult("idle");
    try {
      const audio = new Audio("https://www.soundjay.com/button/beep-07.wav");
      audio.volume = 0.5;
      await audio.play();
      logEvent("SPEAKER_TEST_PLAYED");
      setSpeakerResult("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("SPEAKER_TEST_FAILED", { error: msg });
      setSpeakerResult("failed");
    } finally {
      setSpeakerTesting(false);
    }
  };

  const handleTestCall = async () => {
    if (!registered) {
      alert("Not connected to voice service. Please wait or reconnect.");
      return;
    }
    if (micPermission !== "granted") {
      alert("Please enable microphone before making calls.");
      const granted = await requestMicPermission();
      if (!granted) return;
    }
    const testNumber = "+919902328888";
    logEvent("TEST_CALL_TRIGGERED");
    logEvent("TEST_CALL_START", { number: testNumber });
    await startCall(testNumber);
  };

  const handleReconnect = () => {
    logEvent("MANUAL_RECONNECT_TRIGGERED");
    onReconnect();
  };

  const StatusDot = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-destructive"}`} />
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          Call Readiness Check
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <StatusDot ok={micPermission === "granted"} />
            <span className="text-muted-foreground">Mic:</span>
            <span className="font-medium">{micPermission === "granted" ? "Granted" : "Blocked"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={audioContextState === "running" || audioContextState?.includes("running") === true} />
            <span className="text-muted-foreground">Audio:</span>
            <span className="font-medium">{audioContextState?.includes("running") ? "Running" : audioContextState || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={registered} />
            <span className="text-muted-foreground">Registered:</span>
            <span className="font-medium">{registered ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={clientHealthy} />
            <span className="text-muted-foreground">Connection:</span>
            <span className="font-medium">{clientHealthy ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <Separator />

        {/* Test buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestMic}
            disabled={micTesting || isCallActive}
          >
            {micTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
            Test Mic
            {micResult === "success" && <CheckCircle className="h-3 w-3 text-emerald-500" />}
            {micResult === "failed" && <XCircle className="h-3 w-3 text-destructive" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestSpeaker}
            disabled={speakerTesting || isCallActive}
          >
            {speakerTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
            Test Speaker
            {speakerResult === "success" && <CheckCircle className="h-3 w-3 text-emerald-500" />}
            {speakerResult === "failed" && <XCircle className="h-3 w-3 text-destructive" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestCall}
            disabled={!registered || isCallActive}
          >
            <Phone className="h-3.5 w-3.5" />
            Test Call
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleReconnect}
            disabled={isCallActive}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reconnect
          </Button>
        </div>

        {/* Readiness summary */}
        {micPermission === "granted" && registered && clientHealthy ? (
          <Badge variant="outline" className="w-full justify-center border-emerald-300 text-emerald-600 text-xs py-1">
            ✓ All checks passed — Ready to call
          </Badge>
        ) : (
          <Badge variant="outline" className="w-full justify-center border-amber-300 text-amber-600 text-xs py-1">
            ⚠ {!micPermission || micPermission !== "granted" ? "Mic required" : !registered ? "Voice not registered" : "Client unhealthy"} — fix before calling
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
