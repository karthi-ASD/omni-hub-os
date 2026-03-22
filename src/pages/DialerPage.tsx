import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDialerContext } from "@/contexts/BrowserDialerContext";
import type { BrowserDialerStatus } from "@/hooks/useBrowserDialer";
import { useCallTranscript } from "@/hooks/useCallTranscript";
import { useAICallAssistant } from "@/hooks/useAICallAssistant";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { useAuth } from "@/contexts/AuthContext";
import { DialerErrorBoundary } from "@/components/dialer/DialerErrorBoundary";
import { LiveTranscriptPanel } from "@/components/dialer/LiveTranscriptPanel";
import { AISuggestionsPanel } from "@/components/dialer/AISuggestionsPanel";
import { AICoachPanel } from "@/components/dialer/AICoachPanel";
import { CallStatusBar } from "@/components/dialer/CallStatusBar";
import { CallReadinessPanel } from "@/components/dialer/CallReadinessPanel";
import { CallTagging } from "@/components/dialer/CallTagging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone, PhoneOff, MicOff, Mic, Clock, User, Building2, Hash,
  CheckCircle, XCircle, PhoneForwarded, PhoneMissed, Play, Download,
  Calendar as CalendarIcon, Delete, ShieldAlert, UserX, AlertTriangle,
  Wifi, WifiOff, Bug, RotateCcw, Copy, Activity, FileText, Sparkles, Brain,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DIAL_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const STATUS_LABELS: Record<BrowserDialerStatus, string> = {
  idle: "Ready",
  initializing: "Initializing...",
  registering: "Connecting to voice service...",
  registered: "Ready to call",
  requesting_permission: "Requesting microphone access...",
  device_ready: "Device ready",
  dialing: "Dialing...",
  ringing: "Ringing...",
  connected: "Connected",
  ending: "Ending call...",
  ended: "Call ended",
  failed: "Call failed",
  permission_denied: "Microphone access denied",
  auth_required: "🔒 Login required",
};

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  initializing: "bg-amber-500/20 text-amber-700",
  registering: "bg-amber-500/20 text-amber-700",
  registered: "bg-blue-500/20 text-blue-700",
  requesting_permission: "bg-amber-500/20 text-amber-700",
  device_ready: "bg-blue-500/20 text-blue-700",
  dialing: "bg-amber-500/20 text-amber-700",
  ringing: "bg-blue-500/20 text-blue-700",
  connected: "bg-emerald-500/20 text-emerald-700",
  ending: "bg-amber-500/20 text-amber-700",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  permission_denied: "bg-destructive/20 text-destructive",
  auth_required: "bg-destructive/20 text-destructive",
};

interface LeadContext {
  id: string;
  name: string;
  phone: string;
  company?: string;
  clientId?: string;
}

function DialerPageContent() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const dialer = useDialerContext();

  const clientId = searchParams.get("clientId") || undefined;
  const { canAccessDialer, isClientUser } = useDialerAccess(clientId);

  const [phoneInput, setPhoneInput] = useState(() => {
    return sessionStorage.getItem("dialer_phone_draft") || "";
  });
  const [notesInput, setNotesInput] = useState(() => {
    return sessionStorage.getItem("dialer_notes_draft") || "";
  });
  const [leadContext, setLeadContext] = useState<LeadContext | null>(() => {
    try {
      const saved = sessionStorage.getItem("dialer_lead_context");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(() => {
    const saved = sessionStorage.getItem("dialer_followup_draft");
    return saved ? new Date(saved) : undefined;
  });
  const [showFollowUp, setShowFollowUp] = useState(() => {
    return sessionStorage.getItem("dialer_show_followup") === "true";
  });
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [rightTab, setRightTab] = useState(() => {
    return sessionStorage.getItem("dialer_right_tab") || "transcript";
  });

  // Persist drafts to sessionStorage (survives route changes)
  useEffect(() => {
    sessionStorage.setItem("dialer_phone_draft", phoneInput);
  }, [phoneInput]);
  useEffect(() => {
    sessionStorage.setItem("dialer_notes_draft", notesInput);
  }, [notesInput]);
  useEffect(() => {
    if (leadContext) {
      sessionStorage.setItem("dialer_lead_context", JSON.stringify(leadContext));
    }
  }, [leadContext]);
  useEffect(() => {
    if (followUpDate) {
      sessionStorage.setItem("dialer_followup_draft", followUpDate.toISOString());
    } else {
      sessionStorage.removeItem("dialer_followup_draft");
    }
  }, [followUpDate]);
  useEffect(() => {
    sessionStorage.setItem("dialer_show_followup", String(showFollowUp));
  }, [showFollowUp]);
  useEffect(() => {
    sessionStorage.setItem("dialer_right_tab", rightTab);
  }, [rightTab]);

  // Live transcript — safe when dialer is null
  const noopLog = useRef((_e: string, _d?: Record<string, unknown>) => {}).current;
  const transcript = useCallTranscript({
    sessionId: dialer?.session?.id || null,
    businessId: profile?.business_id || null,
    userId: profile?.user_id || null,
    isCallConnected: dialer?.callStatus === "connected",
    onLog: dialer?.logEvent || noopLog,
  });

  // AI assistant
  const aiAssistant = useAICallAssistant({
    sessionId: dialer?.session?.id || null,
    businessId: profile?.business_id || null,
    onLog: dialer?.logEvent || noopLog,
  });

  // Periodically feed transcript to AI during active call
  const lastAIRequestRef = useRef<number>(0);
  useEffect(() => {
    if (!dialer?.isCallActive || transcript.lines.length === 0) return;
    const finalLines = transcript.lines.filter((l) => l.isFinal);
    if (finalLines.length < 2) return;
    const now = Date.now();
    if (now - lastAIRequestRef.current < 10000) return;
    lastAIRequestRef.current = now;
    aiAssistant.requestAIAssist(transcript.lines);
  }, [transcript.lines, dialer?.isCallActive]);

  // UI rebind safety — detect if we're mounting into an active call
  useEffect(() => {
    if (dialer?.isCallActive) {
      dialer.logEvent("UI_REBOUND_TO_ACTIVE_CALL", {
        sessionId: dialer.session?.id,
        status: dialer.callStatus,
      });
    }
  }, []); // only on mount

  // Reset AI on call end
  useEffect(() => {
    if (!dialer?.isCallActive && transcript.status === "stopped") {
      // Don't reset immediately - let user review
    }
  }, [dialer?.isCallActive]);

  // Load lead context from URL params
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const company = searchParams.get("company");

    if (phone) setPhoneInput(phone);
    if (leadId && name) {
      setLeadContext({ id: leadId, name: name || "", phone: phone || "", company: company || "", clientId });
      dialer?.loadLeadHistory(leadId);
    }
  }, [searchParams]);

  // ── GATE: If provider not ready, show loading (after all hooks) ──
  if (!dialer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Permission gate
  if (!canAccessDialer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        {isClientUser ? (
          <>
            <UserX className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Dialer Not Available</h2>
            <p className="text-sm text-muted-foreground max-w-md">The dialer is only available to sales team members.</p>
          </>
        ) : (
          <>
            <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Dialer Access Restricted</h2>
            <p className="text-sm text-muted-foreground max-w-md">You don't have permission to access the dialer.</p>
          </>
        )}
      </div>
    );
  }

  const handleDial = async () => {
    dialer.logEvent("CALL_BUTTON_CLICKED", { phoneInput, registered: dialer.registered, status: dialer.callStatus });
    if (dialer.micPermission !== "granted") {
      toast.error("Please enable microphone before making calls.");
      return;
    }
    if (!phoneInput.trim()) {
      toast.error("Enter a phone number first");
      return;
    }
    transcript.clearTranscript();
    aiAssistant.resetAssistant();
    await dialer.startCall(phoneInput.trim(), leadContext?.id, leadContext?.clientId);
  };

  const handleDialPadPress = (digit: string) => setPhoneInput((p) => p + digit);

  const handleDisposition = async (disposition: "interested" | "not_interested" | "callback_later" | "no_answer" | "wrong_number" | "converted") => {
    if (disposition === "callback_later") {
      setShowFollowUp(true);
      return;
    }
    await dialer.submitDisposition(disposition, notesInput);
    dialer.resetDialer();
    setNotesInput("");
    sessionStorage.removeItem("dialer_notes_draft");
    sessionStorage.removeItem("dialer_phone_draft");
    sessionStorage.removeItem("dialer_followup_draft");
    sessionStorage.removeItem("dialer_show_followup");
  };

  const handleFollowUpSubmit = async () => {
    await dialer.submitDisposition("callback_later", notesInput, followUpDate?.toISOString());
    dialer.resetDialer();
    setNotesInput("");
    sessionStorage.removeItem("dialer_notes_draft");
    sessionStorage.removeItem("dialer_phone_draft");
    sessionStorage.removeItem("dialer_followup_draft");
    sessionStorage.removeItem("dialer_show_followup");
    setFollowUpDate(undefined);
    setShowFollowUp(false);
  };

  const isCallActive = dialer.isCallActive;
  const isCallEnded = dialer.callStatus === "ended" || dialer.callStatus === "failed";
  const isAuthRequired = dialer.callStatus === "auth_required";
  const isRegistering = dialer.callStatus === "registering" || dialer.callStatus === "initializing";
  const canDial = phoneInput.trim().length > 0 && !dialer.loading && !isCallActive && !isAuthRequired && !isRegistering;

  const getCallButtonText = () => {
    if (dialer.loading) return "Dialing…";
    if (dialer.callStatus === "registering" || dialer.callStatus === "initializing") return "Registering…";
    return "Call";
  };

  const getCallHelperText = () => {
    if (dialer.pendingDial) return "Call queued. Will auto-dial when ready.";
    if (dialer.callStatus === "registering" || dialer.callStatus === "initializing") return "Waiting for voice registration…";
    if (!dialer.registered && dialer.callStatus !== "failed") return "Connecting to voice service…";
    if (dialer.registered && dialer.micPermission === "granted") return "Ready to call";
    if (dialer.micPermission !== "granted") return "Microphone access required";
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* ===== TOP STATUS BAR ===== */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="py-3 px-4 space-y-2">
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Build:</span>
              <span className="font-semibold">{dialer.buildVersion}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div>
              <span className="text-muted-foreground">Registered: </span>
              <span className={dialer.registered ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
                {String(dialer.registered)}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-semibold">{dialer.callStatus}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div>
              <span className="text-muted-foreground">Mic: </span>
              <span className={dialer.micPermission === "granted" ? "text-emerald-600" : "text-amber-600"}>
                {dialer.micPermission}
              </span>
            </div>
            {dialer.lastError && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="text-destructive truncate max-w-[200px]" title={dialer.lastError}>
                  ⚠ {dialer.lastError}
                </div>
              </>
            )}
          </div>
          {/* Live call status chips */}
          <CallStatusBar
            callStatus={dialer.callStatus}
            isCallActive={isCallActive}
            recordingActive={isCallActive && dialer.callStatus === "connected"}
            transcriptStatus={transcript.status}
            aiStatus={aiAssistant.status}
            connectionState={dialer.diagnostics.connectionState}
            formattedTimer={dialer.formattedTimer}
          />
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Sales Command Center</h1>
          <p className="text-sm text-muted-foreground">Browser-based calling with live AI coaching & transcription</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${dialer.registered ? "border-emerald-500 text-emerald-600" : dialer.callStatus === "registering" ? "border-amber-500 text-amber-600" : "border-destructive text-destructive"}`}>
            {dialer.registered ? (
              <><Wifi className="h-3 w-3 mr-1" /> Voice Ready</>
            ) : dialer.callStatus === "registering" || dialer.callStatus === "initializing" ? (
              "Connecting..."
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
            )}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {dialer.callStatus === "auth_required" ? "🔒" : ""}
            Calls may be recorded & AI-assisted
          </Badge>
        </div>
      </div>

      {/* Auth / Mic / Error warnings */}
      {dialer.callStatus === "auth_required" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">🔒 Please log in to use calling features</p>
              <p className="text-xs text-muted-foreground">The dialer requires an active user session.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {dialer.micPermission === "denied" && dialer.callStatus !== "auth_required" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Microphone access denied</p>
              <p className="text-xs text-muted-foreground">Click the lock icon in your browser's address bar → Allow Microphone.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => dialer.requestMicPermission()} className="shrink-0">Retry</Button>
          </CardContent>
        </Card>
      )}

      {dialer.lastError && !isCallActive && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {dialer.callStatus === "failed" && dialer.registered ? "Call Failed" : "Voice Service Issue"}
              </p>
              <p className="text-xs text-muted-foreground">{dialer.lastError}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {dialer.callStatus === "failed" && phoneInput.trim() && (
                <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { dialer.resetDialer(); setTimeout(() => handleDial(), 300); }}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Retry Call
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={dialer.resetDialer}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== MAIN LAYOUT — 2 COLUMN ON DESKTOP ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN — Dialer Controls */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Lead Context */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Lead</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {leadContext ? (
                <>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{leadContext.name}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /><span className="font-mono text-xs">{leadContext.phone}</span></div>
                    {leadContext.company && <div className="flex items-center gap-2"><Building2 className="h-3 w-3 text-muted-foreground" /><span>{leadContext.company}</span></div>}
                  </div>
                  {dialer.previousCalls.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">Previous ({dialer.previousCalls.length})</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {dialer.previousCalls.slice(0, 3).map((call) => (
                          <div key={call.id} className="flex items-center justify-between text-[10px] px-1.5 py-1 rounded bg-muted/50">
                            <Badge variant="outline" className="text-[9px] h-4">{call.disposition || call.call_status}</Badge>
                            <span className="text-muted-foreground">{format(new Date(call.created_at), "dd MMM HH:mm")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <Phone className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p>No lead loaded. Click a phone icon in Leads to load context.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dial Pad */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" /> Dialer</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="text-center">
                <Badge className={`${STATUS_COLORS[dialer.callStatus] || "bg-muted text-muted-foreground"} text-xs px-3 py-0.5`}>
                  {STATUS_LABELS[dialer.callStatus] || dialer.callStatus}
                </Badge>
                {isCallActive && <p className="text-2xl font-mono font-bold mt-1 tabular-nums">{dialer.formattedTimer}</p>}
              </div>

              <div className="flex gap-2">
                <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="+61 4XX XXX XXX" className="font-mono text-base text-center tracking-wider" disabled={isCallActive || isAuthRequired} onKeyDown={(e) => { if (e.key === "Enter" && canDial) handleDial(); }} />
                <Button variant="ghost" size="icon" onClick={() => setPhoneInput((p) => p.slice(0, -1))} disabled={isCallActive || isAuthRequired}><Delete className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {DIAL_PAD.flat().map((digit) => (
                  <Button key={digit} variant="outline" className="h-10 text-base font-mono" onClick={() => handleDialPadPress(digit)} disabled={isCallActive || isAuthRequired}>{digit}</Button>
                ))}
              </div>

              <div className="flex gap-2 justify-center flex-wrap">
                {!isCallActive ? (
                  <Button onClick={handleDial} disabled={!canDial} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    {getCallButtonText()}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="h-11" onClick={dialer.toggleMute}>
                      {dialer.isMuted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                      {dialer.isMuted ? "Unmute" : "Mute"}
                    </Button>
                    <Button className="flex-1 h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={dialer.endCall} disabled={dialer.callStatus === "ending"}>
                      <PhoneOff className="h-4 w-4 mr-2" /> Hang Up
                    </Button>
                  </>
                )}
              </div>

              {(() => {
                const helper = getCallHelperText();
                return helper ? <p className={`text-[10px] text-center ${dialer.pendingDial ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`}>{helper}</p> : null;
              })()}

              {dialer.lastCalledNumber && !isCallActive && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={dialer.redialLast}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Redial {dialer.lastCalledNumber}
                </Button>
              )}

              <p className="text-[10px] text-center text-muted-foreground">🎧 Audio uses your laptop speakers & mic</p>
            </CardContent>
          </Card>

          {/* Disposition */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4" /> Disposition</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {isCallEnded || dialer.session ? (
                <>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px] border-emerald-200 hover:bg-emerald-50" onClick={() => handleDisposition("interested")}><CheckCircle className="h-4 w-4 text-emerald-600" />Interested</Button>
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px] border-red-200 hover:bg-red-50" onClick={() => handleDisposition("not_interested")}><XCircle className="h-4 w-4 text-red-600" />Not Interested</Button>
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px] border-blue-200 hover:bg-blue-50" onClick={() => handleDisposition("callback_later")}><PhoneForwarded className="h-4 w-4 text-blue-600" />Callback</Button>
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px] border-amber-200 hover:bg-amber-50" onClick={() => handleDisposition("no_answer")}><PhoneMissed className="h-4 w-4 text-amber-600" />No Answer</Button>
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px]" onClick={() => handleDisposition("wrong_number")}><PhoneOff className="h-4 w-4 text-muted-foreground" />Wrong #</Button>
                    <Button variant="outline" className="h-10 flex-col gap-0.5 text-[10px] border-emerald-300 hover:bg-emerald-100" onClick={() => handleDisposition("converted")}><CheckCircle className="h-4 w-4 text-emerald-700" />Converted</Button>
                  </div>
                  {dialer.session && <CallTagging onTag={dialer.tagCall} disabled={!dialer.session} />}
                  <Textarea placeholder="Call notes..." value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="text-xs min-h-[50px]" />
                  {showFollowUp && (
                    <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                      <p className="text-xs font-medium">Schedule Follow-up</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-xs">
                            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                            {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} initialFocus /></PopoverContent>
                      </Popover>
                      <Button className="w-full" size="sm" onClick={handleFollowUpSubmit} disabled={!followUpDate}>Save & Schedule</Button>
                    </div>
                  )}
                  {dialer.session?.recording_url && (
                    <div className="border rounded p-2 space-y-1">
                      <p className="text-[10px] font-medium">Recording</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild><a href={dialer.session.recording_url} target="_blank" rel="noopener noreferrer"><Play className="h-3 w-3 mr-1" /> Play</a></Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" asChild><a href={dialer.session.recording_url} download><Download className="h-3 w-3 mr-1" /> DL</a></Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  <Clock className="h-6 w-6 mx-auto mb-1 opacity-40" />
                  <p>Make a call to set disposition</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — AI Intelligence Panels */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Tabs value={rightTab} onValueChange={setRightTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="transcript" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Transcript
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> AI Suggestions
              </TabsTrigger>
              <TabsTrigger value="coach" className="gap-1.5 text-xs">
                <Brain className="h-3.5 w-3.5" /> AI Coach
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="mt-3">
              <LiveTranscriptPanel lines={transcript.lines} status={transcript.status} />
            </TabsContent>

            <TabsContent value="suggestions" className="mt-3">
              <AISuggestionsPanel
                suggestions={aiAssistant.suggestions}
                status={aiAssistant.status}
                onCopy={aiAssistant.markSuggestionCopied}
                onRefresh={() => aiAssistant.requestAIAssist(transcript.lines)}
              />
            </TabsContent>

            <TabsContent value="coach" className="mt-3">
              <AICoachPanel coaching={aiAssistant.coaching} status={aiAssistant.status} />
            </TabsContent>
          </Tabs>

          {/* Post-call intelligence preview when call ended */}
          {(isCallEnded && dialer.session) && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Post-Call Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {dialer.session.ai_summary ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground">AI Summary</p>
                      <p className="text-xs leading-relaxed">{dialer.session.ai_summary}</p>
                    </div>
                    {dialer.session.ai_score != null && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Call Quality Score</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dialer.session.ai_score >= 70 ? "bg-emerald-500" :
                                dialer.session.ai_score >= 40 ? "bg-amber-500" : "bg-destructive"
                              }`}
                              style={{ width: `${dialer.session.ai_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold">{dialer.session.ai_score}/100</span>
                        </div>
                      </div>
                    )}
                    {/* Coaching summary from AI */}
                    {aiAssistant.coaching && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-1.5 rounded bg-muted/50">
                          <span className="text-muted-foreground">Intent:</span> {aiAssistant.coaching.intent}
                        </div>
                        <div className="p-1.5 rounded bg-muted/50">
                          <span className="text-muted-foreground">Sentiment:</span> {aiAssistant.coaching.sentiment}
                        </div>
                        <div className="p-1.5 rounded bg-muted/50">
                          <span className="text-muted-foreground">Risk:</span> {aiAssistant.coaching.risk}
                        </div>
                        <div className="p-1.5 rounded bg-muted/50">
                          <span className="text-muted-foreground">Close:</span> {aiAssistant.coaching.closeReadiness}
                        </div>
                      </div>
                    )}
                    {/* Transcript summary */}
                    {transcript.lines.filter(l => l.isFinal).length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Transcript ({transcript.lines.filter(l => l.isFinal).length} segments)</p>
                        <Badge variant="outline" className="text-[10px]">Available for review</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground animate-pulse">Processing AI analysis...</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Summary will appear shortly after call ends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== DIAGNOSTICS (Collapsible) ===== */}
      <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Bug className="h-3 w-3 mr-1" /> {showDiagnostics ? "Hide" : "Show"} Diagnostics & Logs
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-2">
          <CallReadinessPanel
            diagnostics={dialer.diagnostics}
            buildVersion={dialer.buildVersion}
            deployedAt={dialer.deployedAt}
            registered={dialer.registered}
            micPermission={dialer.micPermission}
            clientHealthy={dialer.diagnostics.clientHealthy}
            audioContextState={dialer.diagnostics.latestBrowserMediaStatus}
            callStatus={dialer.callStatus}
            logEvent={dialer.logEvent}
            startCall={dialer.startCall}
            onReconnect={dialer.reconnectVoice}
            requestMicPermission={dialer.requestMicPermission}
            onTestRegistration={dialer.testRegistration}
            onTestToken={dialer.testTokenFetch}
            onTestXml={dialer.testAnswerXml}
          />

          <Card className="border-dashed">
            <CardContent className="py-3 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><p className="font-medium text-muted-foreground">SDK Loaded</p><p className={dialer.diagnostics.sdkLoaded ? "text-emerald-600" : "text-destructive"}>{dialer.diagnostics.sdkLoaded ? "✓" : "✗"}</p></div>
                <div><p className="font-medium text-muted-foreground">Registered</p><p className={dialer.diagnostics.registered ? "text-emerald-600" : "text-destructive"}>{dialer.diagnostics.registered ? "✓" : "✗"}</p></div>
                <div><p className="font-medium text-muted-foreground">Mic</p><p className={dialer.diagnostics.micPermission === "granted" ? "text-emerald-600" : "text-amber-600"}>{dialer.diagnostics.micPermission}</p></div>
                <div><p className="font-medium text-muted-foreground">Client</p><p className={dialer.diagnostics.clientHealthy ? "text-emerald-600" : "text-destructive"}>{dialer.diagnostics.clientHealthy ? "✓" : "✗"}</p></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Live Logs ({dialer.debugLogs.length})</p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => {
                    const text = dialer.debugLogs.map((l) => `[${l.timestamp.split("T")[1]?.slice(0, 12)}] ${l.event} ${l.data ? JSON.stringify(l.data) : ""}`).join("\n");
                    navigator.clipboard.writeText(text);
                    toast.success("Logs copied");
                  }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-md border p-2 max-h-[250px] overflow-y-auto font-mono text-[10px] leading-4 space-y-0.5">
                  {dialer.debugLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No logs yet</p>
                  ) : (
                    dialer.debugLogs.map((log, i) => {
                      const time = log.timestamp.split("T")[1]?.slice(0, 12) || log.timestamp;
                      const isError = log.event.includes("FAIL") || log.event.includes("ERROR") || log.event.includes("DENIED");
                      const isSuccess = log.event.includes("SUCCESS") || log.event.includes("GRANTED") || log.event.includes("REGISTERED") || log.event.includes("CONNECTED");
                      return (
                        <div key={i} className={`flex gap-1 ${isError ? "text-destructive" : isSuccess ? "text-emerald-600" : "text-foreground/80"}`}>
                          <span className="text-muted-foreground shrink-0">{time}</span>
                          <span className="font-semibold shrink-0">{log.event}</span>
                          {log.data && <span className="text-muted-foreground truncate">{JSON.stringify(log.data)}</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function DialerPage() {
  return (
    <DialerErrorBoundary>
      <DialerPageContent />
    </DialerErrorBoundary>
  );
}
