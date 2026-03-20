import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDialer } from "@/hooks/useDialer";
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
  Calendar as CalendarIcon, Delete, ShieldAlert, UserX,
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const DIAL_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  initiating: "bg-amber-500/20 text-amber-700",
  ringing: "bg-blue-500/20 text-blue-700",
  connected: "bg-emerald-500/20 text-emerald-700",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  busy: "bg-orange-500/20 text-orange-700",
  "no-answer": "bg-orange-500/20 text-orange-700",
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
  const dialer = useDialer();
  
  const clientId = searchParams.get("clientId") || undefined;
  const { canAccessDialer, isClientUser } = useDialerAccess(clientId);

  const [phoneInput, setPhoneInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [leadContext, setLeadContext] = useState<LeadContext | null>(null);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Load lead context from URL params
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const company = searchParams.get("company");

    if (phone) setPhoneInput(phone);
    if (leadId && name) {
      setLeadContext({ id: leadId, name: name || "", phone: phone || "", company: company || "", clientId: clientId });
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
            <p className="text-sm text-muted-foreground max-w-md">
              You don't have permission to access the dialer. Contact your administrator if you believe this is an error.
            </p>
          </>
        )}
      </div>
    );
  }

  const handleDial = () => {
    if (!phoneInput.trim()) return;
    dialer.startCall(phoneInput.trim(), leadContext?.id, leadContext?.clientId);
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

  const isCallActive = ["initiating", "ringing", "connected"].includes(dialer.callStatus);
  const isCallEnded = dialer.callStatus === "ended" || dialer.callStatus === "failed";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NextWeb Dialer</h1>
          <p className="text-sm text-muted-foreground">Browser-based calling with CRM integration</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${dialer.agentState === "on_call" ? "border-emerald-500 text-emerald-600" : dialer.agentState === "offline" ? "border-destructive text-destructive" : "border-blue-500 text-blue-600"}`}>
            {dialer.agentState === "on_call" ? "On Call" : dialer.agentState === "offline" ? "Offline" : "Available"}
          </Badge>
        </div>
      </div>

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
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No lead loaded</p>
                <p className="text-xs mt-1">Click a phone icon in Leads, Clients, or Deals to load context</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT PANEL — Dialer */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Dialer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className={`${STATUS_COLORS[dialer.callStatus]} text-sm px-3 py-1`}>
                {dialer.callStatus === "idle" ? "Ready" : dialer.callStatus.charAt(0).toUpperCase() + dialer.callStatus.slice(1)}
              </Badge>
              {isCallActive && (
                <p className="text-2xl font-mono font-bold mt-2 tabular-nums">{dialer.formattedTimer}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+61 4XX XXX XXX"
                className="font-mono text-lg text-center tracking-wider"
                disabled={isCallActive}
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
                <Button
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleDial}
                  disabled={!phoneInput.trim() || dialer.loading}
                >
                  <Phone className="h-4 w-4 mr-2" /> {dialer.loading ? "Connecting..." : "Call"}
                </Button>
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
          </CardContent>
        </Card>

        {/* BOTTOM / RIGHT PANEL — Disposition */}
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

                {/* Call Tagging */}
                {dialer.session && (
                  <CallTagging onTag={dialer.tagCall} disabled={!dialer.session} />
                )}

                {/* Follow-up scheduler */}
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
    </div>
  );
}
