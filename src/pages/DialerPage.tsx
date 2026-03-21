import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useBrowserDialer, type BrowserDialerStatus } from "@/hooks/useBrowserDialer";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CallTagging } from "@/components/dialer/CallTagging";
import {
  Phone, PhoneOff, MicOff, Mic, Clock, User, Building2, Hash,
  CheckCircle, XCircle, PhoneForwarded, PhoneMissed, Play, Download,
  Calendar as CalendarIcon, Delete, ShieldAlert, UserX, AlertTriangle,
  Wifi, WifiOff, Bug, RotateCcw, Copy,
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
  registering: "Connecting to voice service...",
  registered: "Ready to call",
  requesting_permission: "Requesting microphone access...",
  device_ready: "Device ready",
  calling: "Calling destination...",
  ringing: "Ringing destination...",
  connected: "Connected",
  ended: "Call ended",
  failed: "Call failed",
  permission_denied: "Microphone access denied",
};

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  registering: "bg-amber-500/20 text-amber-700",
  registered: "bg-blue-500/20 text-blue-700",
  requesting_permission: "bg-amber-500/20 text-amber-700",
  device_ready: "bg-blue-500/20 text-blue-700",
  calling: "bg-amber-500/20 text-amber-700",
  ringing: "bg-blue-500/20 text-blue-700",
  connected: "bg-emerald-500/20 text-emerald-700",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  permission_denied: "bg-destructive/20 text-destructive",
};

interface LeadContext {
  id: string;
  name: string;
  phone: string;
  company?: string;
  clientId?: string;
}

export default function DialerPage() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const dialer = useBrowserDialer();

  const clientId = searchParams.get("clientId") || undefined;
  const { canAccessDialer, isClientUser } = useDialerAccess(clientId);

  const [phoneInput, setPhoneInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [leadContext, setLeadContext] = useState<LeadContext | null>(null);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [uiDebugState, setUiDebugState] = useState<{ clicked: boolean; lastClick: string | null }>({ clicked: false, lastClick: null });

  useEffect(() => {
    if (dialer.callStatus === "connected") {
      document.body.style.backgroundColor = "#065f46";
    } else if (dialer.callStatus === "failed") {
      document.body.style.backgroundColor = "#7f1d1d";
    } else if (uiDebugState.clicked && (dialer.callStatus === "calling" || dialer.callStatus === "ringing")) {
      document.body.style.backgroundColor = "#1e293b";
    } else {
      document.body.style.backgroundColor = "";
    }
    return () => { document.body.style.backgroundColor = ""; };
  }, [dialer.callStatus, uiDebugState.clicked]);

  // Load lead context from URL params
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const company = searchParams.get("company");

    if (phone) setPhoneInput(phone);
    if (leadId && name) {
      setLeadContext({ id: leadId, name: name || "", phone: phone || "", company: company || "", clientId });
      dialer.loadLeadHistory(leadId);
    }
  }, [searchParams]);

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
    setUiDebugState({ lastClick: new Date().toISOString(), clicked: true });
    dialer.logEvent("USER_CLICK_CALL_VISUAL", {
      phoneInput,
      registered: dialer.registered,
      status: dialer.callStatus,
      time: new Date().toISOString(),
    });
    if (!phoneInput.trim()) {
      dialer.logEvent("HANDLE_DIAL_BLOCKED_EMPTY_INPUT");
      toast.error("Enter a phone number first");
      return;
    }
    await dialer.startCall(phoneInput.trim(), leadContext?.id, leadContext?.clientId);
  };

  const handleDialPadPress = (digit: string) => {
    setPhoneInput((p) => p + digit);
  };

  const handleDisposition = async (disposition: "interested" | "not_interested" | "callback_later" | "no_answer" | "wrong_number" | "converted") => {
    if (disposition === "callback_later") {
      setShowFollowUp(true);
      return;
    }
    await dialer.submitDisposition(disposition, notesInput);
    dialer.resetDialer();
    setNotesInput("");
  };

  const handleFollowUpSubmit = async () => {
    await dialer.submitDisposition("callback_later", notesInput, followUpDate?.toISOString());
    dialer.resetDialer();
    setNotesInput("");
    setFollowUpDate(undefined);
    setShowFollowUp(false);
  };

  const isCallActive = dialer.isCallActive;
  const isCallEnded = dialer.callStatus === "ended" || dialer.callStatus === "failed";
  const canDial = phoneInput.trim().length > 0 && !dialer.loading && !isCallActive;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ===== VISUAL DEBUG PANEL ===== */}
      <div style={{ background: "#111", color: "#0f0", padding: "10px", fontSize: "12px", fontFamily: "monospace", borderRadius: "8px", border: "2px solid #0f0" }}>
        <div>BUILD: <strong>pending-dial-fix-v5</strong></div>
        <div>Registered: <strong style={{ color: dialer.registered ? "#4ade80" : "#f87171" }}>{String(dialer.registered)}</strong></div>
        <div>Status: <strong>{dialer.callStatus}</strong></div>
        <div>Clicked: <strong style={{ color: uiDebugState.clicked ? "#4ade80" : "#f87171" }}>{String(uiDebugState.clicked)}</strong></div>
        <div>Last Click: <strong>{uiDebugState.lastClick || "none"}</strong></div>
        <div>Pending Dial: <strong>{dialer.pendingDial || "none"}</strong></div>
        <div>Last Error: <strong style={{ color: "#f87171" }}>{dialer.lastError || "none"}</strong></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NextWeb Dialer</h1>
          <p className="text-sm text-muted-foreground">Browser-based calling — audio plays through your laptop</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${dialer.registered ? "border-emerald-500 text-emerald-600" : dialer.callStatus === "registering" ? "border-amber-500 text-amber-600" : "border-destructive text-destructive"}`}>
            {dialer.registered ? (
              <><Wifi className="h-3 w-3 mr-1" /> Voice Ready</>
            ) : dialer.callStatus === "registering" ? (
              "Connecting..."
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
            )}
          </Badge>
          <Badge variant="outline" className={`${dialer.agentState === "on_call" ? "border-emerald-500 text-emerald-600" : "border-blue-500 text-blue-600"}`}>
            {dialer.agentState === "on_call" ? "On Call" : "Available"}
          </Badge>
          {dialer.pendingDial && (
            <Badge variant="outline" className="border-amber-500 text-amber-600 animate-pulse">
              ⏳ Call queued
            </Badge>
          )}
        </div>
      </div>

      {/* Mic permission warning */}
      {dialer.micPermission === "denied" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Microphone access denied</p>
              <p className="text-xs text-muted-foreground">
                Browser calling requires microphone access. Click the lock icon in your browser's address bar → Site settings → Allow Microphone.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => dialer.requestMicPermission()} className="shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error banner */}
      {dialer.lastError && !isCallActive && (
        <Card className="border-amber-500/50 bg-amber-50/50">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">
                {dialer.callStatus === "failed" && dialer.registered ? "Call Failed" : "Voice Service Issue"}
              </p>
              <p className="text-xs text-muted-foreground">{dialer.lastError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={dialer.resetDialer} className="shrink-0">
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL — Lead Context */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Lead Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leadContext ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{leadContext.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{leadContext.phone}</span>
                  </div>
                  {leadContext.company && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{leadContext.company}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Previous Calls</p>
                  {dialer.previousCalls.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No previous calls</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {dialer.previousCalls.map((call) => (
                        <div key={call.id} className="p-2 rounded-md bg-muted/50 text-xs space-y-1">
                          <div className="flex justify-between">
                            <Badge variant="outline" className="text-[10px]">{call.disposition || call.call_status}</Badge>
                            <span className="text-muted-foreground">{call.call_duration ? `${Math.floor(call.call_duration / 60)}:${(call.call_duration % 60).toString().padStart(2, "0")}` : "--"}</span>
                          </div>
                          <p className="text-muted-foreground">{format(new Date(call.created_at), "dd MMM yyyy HH:mm")}</p>
                          {call.recording_url && (
                            <div className="flex gap-1 mt-1">
                              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" asChild>
                                <a href={call.recording_url} target="_blank" rel="noopener noreferrer"><Play className="h-3 w-3 mr-0.5" /> Play</a>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" asChild>
                                <a href={call.recording_url} download><Download className="h-3 w-3 mr-0.5" /> DL</a>
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
                  <Textarea
                    placeholder="Add call notes..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="text-sm min-h-[80px]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No lead loaded</p>
                  <p className="text-xs mt-1">Click a phone icon in Leads, Clients, or Deals to load context</p>
                </div>

                {/* Recent Numbers */}
                {dialer.recentNumbers.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recent Numbers</p>
                      <div className="space-y-1">
                        {dialer.recentNumbers.slice(0, 5).map((num) => (
                          <button
                            key={num}
                            className="w-full text-left text-xs font-mono px-2 py-1.5 rounded-md hover:bg-muted/50 flex items-center justify-between group"
                            onClick={() => setPhoneInput(num)}
                          >
                            <span>{num}</span>
                            <Phone className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CENTER PANEL — Dialer */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Browser Dialer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className={`${STATUS_COLORS[dialer.callStatus] || "bg-muted text-muted-foreground"} text-sm px-3 py-1`}>
                {STATUS_LABELS[dialer.callStatus] || dialer.callStatus}
              </Badge>
              {isCallActive && (
                <p className="text-2xl font-mono font-bold mt-2 tabular-nums">{dialer.formattedTimer}</p>
              )}
              {dialer.callStatus === "ringing" && (
                <p className="text-xs text-muted-foreground mt-1 animate-pulse">🔊 Ringback playing in your speakers</p>
              )}
              {dialer.diagnostics.destinationNumber && isCallActive && (
                <p className="text-xs font-mono text-muted-foreground mt-1">{dialer.diagnostics.destinationNumber}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+61 4XX XXX XXX"
                className="font-mono text-lg text-center tracking-wider"
                disabled={isCallActive}
                onKeyDown={(e) => { if (e.key === "Enter") handleDial(); }}
              />
              <Button variant="ghost" size="icon" onClick={() => setPhoneInput((p) => p.slice(0, -1))} disabled={isCallActive}>
                <Delete className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DIAL_PAD.flat().map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-12 text-lg font-mono"
                  onClick={() => handleDialPadPress(digit)}
                  disabled={isCallActive}
                >
                  {digit}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              {!isCallActive ? (
                <>
                  <Button
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleDial}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {dialer.loading ? "Starting..." : !dialer.registered ? "Call (will queue)" : "Call from Browser"}
                  </Button>
                  <Button variant="outline" className="h-12" onClick={() => dialer.startCall("+61400000000")}>
                    TEST CALL
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-12" onClick={dialer.toggleMute}>
                    {dialer.isMuted ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                    {dialer.isMuted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={dialer.endCall}
                  >
                    <PhoneOff className="h-4 w-4 mr-2" /> Hang Up
                  </Button>
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 justify-center">
              {dialer.lastCalledNumber && !isCallActive && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={dialer.redialLast}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Redial {dialer.lastCalledNumber}
                </Button>
              )}
              {dialer.diagnostics.destinationNumber && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { navigator.clipboard.writeText(dialer.diagnostics.destinationNumber); toast.success("Copied"); }}>
                  <Copy className="h-3 w-3 mr-1" /> Copy number
                </Button>
              )}
            </div>

            {/* Audio info */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                🎧 Audio uses your laptop speakers & microphone
              </p>
              {dialer.micPermission === "unknown" || dialer.micPermission === "prompt" ? (
                <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1" onClick={() => dialer.requestMicPermission()}>
                  Grant microphone access
                </Button>
              ) : dialer.micPermission === "granted" ? (
                <p className="text-xs text-emerald-600 mt-1">✓ Microphone access granted</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL — Disposition */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Hash className="h-4 w-4" /> Disposition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCallEnded || dialer.session ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-14 flex-col gap-1 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400" onClick={() => handleDisposition("interested")}>
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs">Interested</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1 border-red-200 hover:bg-red-50 hover:border-red-400" onClick={() => handleDisposition("not_interested")}>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-xs">Not Interested</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1 border-blue-200 hover:bg-blue-50 hover:border-blue-400" onClick={() => handleDisposition("callback_later")}>
                    <PhoneForwarded className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Callback Later</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1 border-amber-200 hover:bg-amber-50 hover:border-amber-400" onClick={() => handleDisposition("no_answer")}>
                    <PhoneMissed className="h-5 w-5 text-amber-600" />
                    <span className="text-xs">No Answer</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1 border-gray-200 hover:bg-gray-50 hover:border-gray-400" onClick={() => handleDisposition("wrong_number")}>
                    <PhoneOff className="h-5 w-5 text-gray-600" />
                    <span className="text-xs">Wrong Number</span>
                  </Button>
                  <Button variant="outline" className="h-14 flex-col gap-1 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500" onClick={() => handleDisposition("converted")}>
                    <CheckCircle className="h-5 w-5 text-emerald-700" />
                    <span className="text-xs">Converted</span>
                  </Button>
                </div>

                {dialer.session && (
                  <CallTagging onTag={dialer.tagCall} disabled={!dialer.session} />
                )}

                {showFollowUp && (
                  <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                    <p className="text-xs font-medium">Schedule Follow-up</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Button className="w-full" size="sm" onClick={handleFollowUpSubmit} disabled={!followUpDate}>
                      Save & Schedule
                    </Button>
                  </div>
                )}

                {!leadContext && (
                  <Textarea
                    placeholder="Add call notes..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                )}

                {dialer.session?.recording_url && (
                  <div className="border rounded-md p-3 space-y-2">
                    <p className="text-xs font-medium">Recording</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={dialer.session.recording_url} target="_blank" rel="noopener noreferrer">
                          <Play className="h-3.5 w-3.5 mr-1" /> Play
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={dialer.session.recording_url} download>
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Make a call to set disposition</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics & Debug Panel */}
      <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Bug className="h-3 w-3 mr-1" /> {showDiagnostics ? "Hide" : "Show"} Diagnostics & Logs
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 border-dashed">
            <CardContent className="py-3 space-y-4">
              {/* State Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">SDK Loaded</p>
                  <p className={dialer.diagnostics.sdkLoaded ? "text-emerald-600" : "text-destructive"}>
                    {dialer.diagnostics.sdkLoaded ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Voice Registered</p>
                  <p className={dialer.diagnostics.registered ? "text-emerald-600" : "text-destructive"}>
                    {dialer.diagnostics.registered ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Mic Permission</p>
                  <p className={dialer.diagnostics.micPermission === "granted" ? "text-emerald-600" : dialer.diagnostics.micPermission === "denied" ? "text-destructive" : "text-amber-600"}>
                    {dialer.diagnostics.micPermission}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Call Mode</p>
                  <p className="text-blue-600">{dialer.diagnostics.callMode}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <p>{dialer.diagnostics.currentStatus}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Voice Client</p>
                  <p>{dialer.diagnostics.voiceClientRegistration}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Destination</p>
                  <p className="font-mono">{dialer.diagnostics.destinationNumber || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Caller ID</p>
                  <p>{dialer.diagnostics.selectedCallerId || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Pending Dial</p>
                  <p className="font-mono">{dialer.diagnostics.pendingDialNumber || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Provider Status</p>
                  <p>{dialer.diagnostics.latestProviderStatus || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Media Status</p>
                  <p>{dialer.diagnostics.latestBrowserMediaStatus || "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Error</p>
                  <p className="text-destructive truncate">{dialer.diagnostics.lastError || "—"}</p>
                </div>
              </div>

              {/* Live Log Feed */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Live Call Logs (last {dialer.debugLogs.length})</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      const text = dialer.debugLogs
                        .map((l) => `[DIALER][${l.timestamp}] ${l.event} ${l.data ? JSON.stringify(l.data) : ""}`)
                        .join("\n");
                      navigator.clipboard.writeText(text);
                      toast.success("Logs copied to clipboard");
                    }}
                  >
                    Copy All Logs
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-md border p-2 max-h-[300px] overflow-y-auto font-mono text-[10px] leading-4 space-y-0.5">
                  {dialer.debugLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No logs yet — make a call to see events</p>
                  ) : (
                    dialer.debugLogs.map((log, i) => {
                      const time = log.timestamp.split("T")[1]?.slice(0, 12) || log.timestamp;
                      const isError = log.event.includes("FAIL") || log.event.includes("ERROR") || log.event.includes("DENIED") || log.event.includes("BLOCKED");
                      const isSuccess = log.event.includes("SUCCESS") || log.event.includes("GRANTED") || log.event.includes("REGISTERED") || log.event.includes("ANSWERED") || log.event.includes("CONNECTED") || log.event.includes("INVOKED");
                      const isWarn = log.event.includes("WAITING") || log.event.includes("PENDING") || log.event.includes("PROCEEDING");
                      return (
                        <div key={i} className={`flex gap-1 ${isError ? "text-destructive" : isSuccess ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-foreground/80"}`}>
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
