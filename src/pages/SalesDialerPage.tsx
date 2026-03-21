import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useDialer } from "@/hooks/useDialer";
import { useBrowserDialer } from "@/hooks/useBrowserDialer";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, PhoneOff, PhoneCall, Clock, User, Flame,
  Mic, MicOff, CheckCircle, XCircle, Brain, Copy, Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { Disposition } from "@/services/dialerService";
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  idle: { label: "Ready", className: "bg-muted text-muted-foreground" },
  initiating: { label: "Connecting…", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  ringing: { label: "Ringing", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 animate-pulse" },
  connected: { label: "Connected", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  busy: { label: "Busy", className: "bg-orange-500/15 text-orange-700" },
  "no-answer": { label: "No Answer", className: "bg-orange-500/15 text-orange-700" },
};

const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "callback_later", label: "Callback Later" },
  { value: "no_answer", label: "No Answer" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "converted", label: "Converted" },
];

export default function SalesDialerPage() {
  usePageTitle("Sales Dialer");
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const browserDialer = useBrowserDialer();
  const {
    session, callStatus, formattedTimer, isMuted, loading, isCallActive,
    startCall, endCall, toggleMute, submitDisposition, resetDialer,
  } = useDialer();

  const prefillPhone = searchParams.get("phone") || "";
  const prefillLeadId = searchParams.get("leadId") || "";
  const [phoneInput, setPhoneInput] = useState(prefillPhone);
  const [notes, setNotes] = useState("");
  const [disposition, setDisposition] = useState<Disposition | "">("");

  // Auto-start call if prefilled from leads page
  useEffect(() => {
    if (prefillPhone && prefillLeadId && !isCallActive && !loading && !session) {
      startCall(prefillPhone, prefillLeadId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch leads for quick-dial
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["dialer-leads", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, phone, priority_score, company_name")
        .eq("business_id", profile!.business_id!)
        .not("phone", "is", null)
        .order("priority_score", { ascending: false })
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 60_000,
  });

  // Recent call sessions
  const { data: recentCalls, isLoading: recentLoading } = useQuery({
    queryKey: ["dialer-recent", profile?.business_id, profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("id, phone_number, call_status, call_duration, ai_score, created_at, disposition")
        .eq("business_id", profile!.business_id!)
        .eq("user_id", profile!.user_id!)
        .order("created_at", { ascending: false })
        .limit(15);
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 15_000,
  });

  // 🔒 SECURITY: Only sales/admin roles can access this page
  if (!canAccessDialer) {
    return <Navigate to="/sales-dashboard" replace />;
  }

  const handleQuickDial = (lead: any) => {
    if (isCallActive || loading) return;
    setPhoneInput(lead.phone);
    startCall(lead.phone, lead.id);
  };

  const handleManualCall = () => {
    if (!phoneInput.trim() || isCallActive || loading) return;
    startCall(phoneInput.trim());
  };

  const handleSubmitDisposition = async () => {
    if (!disposition) return;
    await submitDisposition(disposition as Disposition, notes || undefined);
    setDisposition("");
    setNotes("");
    resetDialer();
  };

  const statusInfo = STATUS_BADGE[callStatus] || STATUS_BADGE.idle;
  const callEnded = ["ended", "failed", "busy", "no-answer"].includes(callStatus);

  const formatDuration = (secs: number | null) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Dialer"
        subtitle="Call leads directly and track conversations"
        icon={PhoneCall}
      />

      {/* Dialer Panel + Active Call */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Dialer Input */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" /> Dial Pad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Enter phone number…"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={isCallActive}
              className="text-lg font-mono tracking-wider"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleManualCall}
                disabled={!phoneInput.trim() || isCallActive || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-transform"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </Button>
              {isCallActive && (
                <Button
                  variant="destructive"
                  onClick={endCall}
                  className="flex-1 active:scale-[0.97] transition-transform"
                >
                  <PhoneOff className="h-4 w-4 mr-1.5" />
                  End
                </Button>
              )}
            </div>
            <div className="mt-2 rounded-md bg-destructive px-3 py-2 text-center text-sm font-bold text-destructive-foreground">
              🚨 NEW BUILD ACTIVE 🚨
            </div>
            {isCallActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                className="w-full active:scale-[0.97] transition-transform"
              >
                {isMuted ? <MicOff className="h-4 w-4 mr-1.5" /> : <Mic className="h-4 w-4 mr-1.5" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            )}

            {/* Status */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
              {callStatus === "connected" && (
                <span className="text-sm font-mono tabular-nums text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  {formattedTimer}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Call Info / Disposition */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isCallActive ? "Active Call" : callEnded && session ? "Call Complete" : "Call Info"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!session && !isCallActive ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select a lead or enter a number to start calling.
              </p>
            ) : (
              <div className="space-y-4">
                {session && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-mono">{session.phone_number}</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <Badge className={statusInfo.className}>{statusInfo.label}</Badge></div>
                    {callStatus === "connected" && (
                      <div><span className="text-muted-foreground">Duration:</span> <span className="font-mono tabular-nums">{formattedTimer}</span></div>
                    )}
                    {session.call_duration != null && callEnded && (
                      <div><span className="text-muted-foreground">Duration:</span> <span className="font-mono tabular-nums">{formatDuration(session.call_duration)}</span></div>
                    )}
                  </div>
                )}

                {/* Disposition form - show when call ends */}
                {callEnded && session && (
                  <div className="space-y-3 pt-3 border-t">
                    <Select value={disposition} onValueChange={(v) => setDisposition(v as Disposition)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select disposition…" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISPOSITIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Call notes…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitDisposition} disabled={!disposition} className="active:scale-[0.97] transition-transform">
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Save & Close
                      </Button>
                      <Button variant="ghost" onClick={resetDialer}>
                        <XCircle className="h-4 w-4 mr-1.5" /> Skip
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold">🔍 LIVE DEBUG LOG ({browserDialer.debugLogs.length})</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => {
                          const text = browserDialer.debugLogs
                            .map((l) => `[${l.timestamp.split("T")[1]?.slice(0, 12)}] ${l.event} ${l.data ? JSON.stringify(l.data) : ""}`)
                            .join("\n");
                          navigator.clipboard.writeText(text);
                          toast.success("Logs copied to clipboard");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                  <div className="h-[200px] overflow-y-auto rounded-md bg-foreground p-2 font-mono text-[10px] leading-4 text-background space-y-0.5">
                    {browserDialer.debugLogs.length === 0 ? (
                      <div className="text-center py-8 opacity-60">No logs yet — make a call to see events</div>
                    ) : (
                      browserDialer.debugLogs.map((log, i) => {
                        const time = log.timestamp.split("T")[1]?.slice(0, 12) || log.timestamp;
                        const isError = log.event.includes("FAIL") || log.event.includes("ERROR") || log.event.includes("DENIED");
                        const isSuccess = log.event.includes("SUCCESS") || log.event.includes("GRANTED") || log.event.includes("REGISTERED") || log.event.includes("ANSWERED") || log.event.includes("CONNECTED");
                        return (
                          <div key={i} className={isError ? "text-red-400" : isSuccess ? "text-emerald-400" : ""}>
                            <span className="opacity-60">[{time}]</span>{" "}
                            <span className="font-semibold">{log.event}</span>
                            {log.data && <span className="opacity-60"> {JSON.stringify(log.data)}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Quick Dial + Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Lead Quick Dial */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Quick Dial Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !leads?.length ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No leads with phone numbers.</p>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {leads.map((lead: any) => (
                  <button
                    key={lead.id}
                    onClick={() => handleQuickDial(lead)}
                    disabled={isCallActive || loading}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{lead.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.priority_score > 70 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                      <Badge variant="outline" className="text-[10px]">
                        {lead.priority_score ?? 0}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLoading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !recentCalls?.length ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No calls yet. Start dialing!</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Disposition</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCalls.map((call: any) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-mono text-sm">{call.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {call.call_status?.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-sm">{formatDuration(call.call_duration)}</TableCell>
                        <TableCell>
                          {call.ai_score != null ? (
                            <div className="flex items-center gap-1">
                              <Brain className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm">{call.ai_score}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="capitalize text-sm">{call.disposition?.replace("_", " ") || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
