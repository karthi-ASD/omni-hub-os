import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Volume2, Phone, RotateCcw, CheckCircle, XCircle, Loader2, KeyRound, ShieldCheck, FileCode2 } from "lucide-react";
import type { BrowserDialerDiagnostics } from "@/hooks/useBrowserDialer";

interface CallReadinessPanelProps {
  diagnostics: BrowserDialerDiagnostics;
  buildVersion: string;
  deployedAt: string;
  registered: boolean;
  micPermission: string;
  clientHealthy: boolean;
  audioContextState: string | null;
  callStatus: string;
  logEvent: (event: string, data?: Record<string, unknown>) => void;
  startCall: (number: string) => Promise<void>;
  onReconnect: () => void;
  requestMicPermission: () => Promise<boolean>;
  onTestRegistration: () => Promise<void>;
  onTestToken: () => Promise<unknown>;
  onTestXml: () => Promise<unknown>;
}

export function CallReadinessPanel({
  diagnostics,
  buildVersion,
  deployedAt,
  registered,
  micPermission,
  clientHealthy,
  audioContextState,
  callStatus,
  logEvent,
  startCall,
  onReconnect,
  requestMicPermission,
  onTestRegistration,
  onTestToken,
  onTestXml,
}: CallReadinessPanelProps) {
  console.log("TEST_PANEL_RENDERED");
  const [micTesting, setMicTesting] = useState(false);
  const [micResult, setMicResult] = useState<"idle" | "success" | "failed">("idle");
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [speakerResult, setSpeakerResult] = useState<"idle" | "success" | "fallback_success" | "blocked" | "failed" | "timeout">("idle");
  const [speakerMessage, setSpeakerMessage] = useState<string | null>(null);
  const [tokenTesting, setTokenTesting] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);
  const [tokenResult, setTokenResult] = useState<"idle" | "success" | "failed">("idle");
  const [registrationTesting, setRegistrationTesting] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<"idle" | "success" | "failed">("idle");
  const [xmlTesting, setXmlTesting] = useState(false);
  const [xmlMessage, setXmlMessage] = useState<string | null>(null);
  const [xmlResult, setXmlResult] = useState<"idle" | "success" | "failed">("idle");

  const isCallActive = ["dialing", "ringing", "connected"].includes(callStatus);
  const disabledForAuth = callStatus === "auth_required";

  const handleTestMic = async () => {
    setMicTesting(true);
    setMicResult("idle");
    setMicMessage(null);
    logEvent("MIC_TEST_START");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      logEvent("MIC_PERMISSION_STATUS", { permission: "granted" });
      logEvent("MIC_STREAM_SUCCESS", { streamObtained: true });
      logEvent("MIC_TRACK_DETAILS", { label: track?.label || "Unknown", enabled: track?.enabled ?? false });
      stream.getTracks().forEach((t) => t.stop());
      logEvent("MIC_TEST_SUCCESS");
      setMicResult("success");
      setMicMessage(track ? `${track.label || "Microphone detected"} • enabled=${String(track.enabled)}` : "Microphone ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("MIC_PERMISSION_STATUS", { permission: "blocked" });
      logEvent("MIC_STREAM_FAILED", { error: msg });
      logEvent("MIC_TEST_FAILED", { error: msg });
      setMicResult("failed");
      setMicMessage(msg);
      alert("Please allow microphone access in browser settings.");
    } finally {
      setMicTesting(false);
    }
  };

  const speakerTestGuard = useRef(false);

  const handleTestSpeaker = async () => {
    if (speakerTestGuard.current) {
      logEvent("SPEAKER_TEST_CONCURRENT_BLOCKED");
      return;
    }
    speakerTestGuard.current = true;
    setSpeakerTesting(true);
    setSpeakerResult("idle");
    setSpeakerMessage(null);
    logEvent("SPEAKER_TEST_START");

    const TIMEOUT_MS = 4000;
    let sinkIdWorked = true;

    try {
      const result = await Promise.race<"success" | "fallback" | "blocked" | "timeout">([
        (async () => {
          const audio = new Audio();
          audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
          audio.volume = 0.5;

          if (typeof (audio as any).setSinkId === "function") {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const speaker = devices.find((d: MediaDeviceInfo) => d.kind === "audiooutput");
              if (speaker?.deviceId) {
                await (audio as any).setSinkId(speaker.deviceId);
              }
            } catch {
              sinkIdWorked = false;
              logEvent("SPEAKER_SINKID_UNSUPPORTED");
            }
          } else {
            sinkIdWorked = false;
          }

          logEvent("SPEAKER_TEST_PLAYING");
          try {
            await audio.play();
            logEvent("SPEAKER_TEST_PLAYED");
            return sinkIdWorked ? ("success" as const) : ("fallback" as const);
          } catch (playErr) {
            logEvent("SPEAKER_TEST_PLAY_BLOCKED", { error: playErr instanceof Error ? playErr.message : String(playErr) });
            return "blocked" as const;
          }
        })(),
        new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
      ]);

      switch (result) {
        case "success":
          logEvent("SPEAKER_TEST_COMPLETED_SUCCESS");
          setSpeakerResult("success");
          setSpeakerMessage("Speaker working — playback successful");
          break;
        case "fallback":
          logEvent("SPEAKER_TEST_COMPLETED_FALLBACK");
          setSpeakerResult("fallback_success");
          setSpeakerMessage("Speaker working (default output — sink routing unsupported)");
          break;
        case "blocked":
          logEvent("SPEAKER_TEST_COMPLETED_BLOCKED");
          setSpeakerResult("blocked");
          setSpeakerMessage("Browser blocked playback. Click anywhere and retry.");
          break;
        case "timeout":
          logEvent("SPEAKER_TEST_COMPLETED_TIMEOUT");
          setSpeakerResult("timeout");
          setSpeakerMessage("Speaker test timed out. Audio may still work — try a test call.");
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("SPEAKER_TEST_COMPLETED_FAILED", { error: msg });
      setSpeakerResult("failed");
      setSpeakerMessage(`Speaker test failed: ${msg}`);
    } finally {
      setSpeakerTesting(false);
      speakerTestGuard.current = false;
    }
  };

  const handleTestRegistration = async () => {
    setRegistrationTesting(true);
    setRegistrationResult("idle");
    setRegistrationMessage(null);
    try {
      await onTestRegistration();
      setRegistrationResult("success");
      setRegistrationMessage("Registration test started — check live status chips for updates");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logEvent("REG_TEST_FAILED", { error: msg });
      setRegistrationResult("failed");
      setRegistrationMessage(msg);
    } finally {
      setRegistrationTesting(false);
    }
  };

  const handleTestToken = async () => {
    setTokenTesting(true);
    setTokenResult("idle");
    setTokenMessage(null);
    try {
      await onTestToken();
      setTokenResult("success");
      setTokenMessage("Token fetch succeeded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTokenResult("failed");
      setTokenMessage(msg);
    } finally {
      setTokenTesting(false);
    }
  };

  const handleTestXml = async () => {
    setXmlTesting(true);
    setXmlResult("idle");
    setXmlMessage(null);
    try {
      await onTestXml();
      setXmlResult("success");
      setXmlMessage("Backend XML endpoint returned valid XML");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setXmlResult("failed");
      setXmlMessage(msg);
    } finally {
      setXmlTesting(false);
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
    <Card className="border-border shadow-sm relative z-10 block">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          Dialer Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <StatusDot ok={micPermission === "granted"} />
            <span className="text-muted-foreground">Mic</span>
            <span className="font-medium">{micPermission === "granted" ? "Granted" : "Blocked"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={audioContextState === "running" || audioContextState?.includes("running") === true} />
            <span className="text-muted-foreground">Audio</span>
            <span className="font-medium">{audioContextState?.includes("running") ? "Running" : audioContextState || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={registered} />
            <span className="text-muted-foreground">Registered</span>
            <span className="font-medium">{registered ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={clientHealthy} />
            <span className="text-muted-foreground">Connection</span>
            <span className="font-medium">{diagnostics.connectionState}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={diagnostics.hasAccessToken} />
            <span className="text-muted-foreground">Access Token</span>
            <span className="font-medium">{diagnostics.hasAccessToken ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot ok={diagnostics.lastAnswerXmlStatus === 200} />
            <span className="text-muted-foreground">XML</span>
            <span className="font-medium">{diagnostics.lastAnswerXmlStatus ?? "—"}</span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestMic}
            disabled={micTesting || isCallActive || disabledForAuth}
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
            disabled={speakerTesting || isCallActive || disabledForAuth}
          >
            {speakerTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
            Test Speaker
            {(speakerResult === "success" || speakerResult === "fallback_success") && <CheckCircle className="h-3 w-3 text-emerald-500" />}
            {(speakerResult === "failed" || speakerResult === "blocked") && <XCircle className="h-3 w-3 text-destructive" />}
            {speakerResult === "timeout" && <CheckCircle className="h-3 w-3 text-amber-500" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestToken}
            disabled={tokenTesting || disabledForAuth}
          >
            {tokenTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Test Token
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestRegistration}
            disabled={registrationTesting || isCallActive || disabledForAuth}
          >
            {registrationTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Test Registration
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestXml}
            disabled={xmlTesting}
          >
            {xmlTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCode2 className="h-3.5 w-3.5" />}
            Test XML
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleTestCall}
            disabled={!registered || isCallActive || disabledForAuth}
          >
            <Phone className="h-3.5 w-3.5" />
            Test Call
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleReconnect}
            disabled={isCallActive || disabledForAuth}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reinit
          </Button>
        </div>

        <div className="grid gap-2 text-[11px] text-muted-foreground">
          {micMessage && <p>Mic: {micMessage}</p>}
          {speakerMessage && <p>Speaker: {speakerMessage}</p>}
          {registrationMessage && <p>Registration: {registrationMessage}</p>}
          {tokenMessage && <p>Token: {tokenMessage}</p>}
          {xmlMessage && <p>XML: {xmlMessage}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border bg-muted/40 p-2 space-y-1">
            <p><span className="text-muted-foreground">Input device:</span> {diagnostics.selectedInputDevice}</p>
            <p><span className="text-muted-foreground">Output device:</span> {diagnostics.selectedOutputDevice}</p>
            <p><span className="text-muted-foreground">Visibility:</span> {diagnostics.tabVisibilityState}</p>
            <p><span className="text-muted-foreground">Init:</span> {diagnostics.plivoClientInitStatus}</p>
            <p><span className="text-muted-foreground">User:</span> {diagnostics.userIdentifier || "—"}</p>
            <p><span className="text-muted-foreground">Environment:</span> {diagnostics.environment}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-2 space-y-1">
            <p><span className="text-muted-foreground">Token status:</span> {diagnostics.lastTokenFetchStatus ?? "—"}</p>
            <p><span className="text-muted-foreground">Token user:</span> {diagnostics.lastTokenUsername || "—"}</p>
            <p><span className="text-muted-foreground">App ID:</span> {diagnostics.lastTokenAppId || "—"}</p>
            <p><span className="text-muted-foreground">Password exists:</span> {diagnostics.lastTokenHasPassword ? "Yes" : "No"}</p>
            <p><span className="text-muted-foreground">Active call:</span> {diagnostics.hasActiveCall ? "Yes" : "No"}</p>
            <p><span className="text-muted-foreground">Audio playable:</span> {diagnostics.audioPlayable ? "Yes" : "No"}</p>
          </div>
        </div>

        {diagnostics.lastAnswerXmlBody && (
          <div className="rounded-md border border-border bg-muted/40 p-2">
            <p className="text-xs font-medium mb-1">Last XML Response</p>
            <pre className="max-h-40 overflow-auto text-[10px] whitespace-pre-wrap break-all">{diagnostics.lastAnswerXmlBody}</pre>
          </div>
        )}

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

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span>Build: {buildVersion}</span>
          <span>Deployed: {new Date(deployedAt).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
