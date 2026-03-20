import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CallDetailDrawer } from "@/components/dialer/CallDetailDrawer";
import { formatTalkTime } from "@/hooks/useDialerMetrics";
import { format } from "date-fns";
import { Mic, Play, ExternalLink, Search, Brain, Download } from "lucide-react";

export default function DialerRecordingsPage() {
  usePageTitle("Call Recordings");
  const { profile } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [recordingFilter, setRecordingFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: calls, isLoading } = useQuery({
    queryKey: ["dialer-recordings", profile?.business_id, statusFilter, dispositionFilter, recordingFilter, search],
    queryFn: async () => {
      let q = supabase
        .from("dialer_sessions")
        .select("id, phone_number, call_status, call_duration, ai_score, ai_summary, created_at, disposition, recording_url, user_id, lead_id, notes")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") q = q.eq("call_status", statusFilter);
      if (dispositionFilter !== "all") q = q.eq("disposition", dispositionFilter);
      if (recordingFilter === "yes") q = q.not("recording_url", "is", null);
      if (recordingFilter === "no") q = q.is("recording_url", null);
      if (search) q = q.ilike("phone_number", `%${search}%`);

      const { data } = await q;
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 15_000,
  });

  // Fetch caller names
  const userIds = [...new Set((calls || []).map((c: any) => c.user_id))];
  const { data: profiles } = useQuery({
    queryKey: ["dialer-profiles", userIds.join(",")],
    queryFn: async () => {
      if (!userIds.length) return {};
      const { data } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Fetch lead names
  const leadIds = [...new Set((calls || []).filter((c: any) => c.lead_id).map((c: any) => c.lead_id))];
  const { data: leads } = useQuery({
    queryKey: ["dialer-lead-names", leadIds.join(",")],
    queryFn: async () => {
      if (!leadIds.length) return {};
      const { data } = await supabase.from("leads").select("id, name").in("id", leadIds);
      const map: Record<string, string> = {};
      (data || []).forEach((l: any) => { map[l.id] = l.name; });
      return map;
    },
    enabled: leadIds.length > 0,
  });

  if (!canAccessDialer) return <Navigate to="/sales-dashboard" replace />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Call Recordings" subtitle="Browse, play, and review all recorded calls" icon={Mic} />

      {/* Filters */}
      <Card>
        <CardContent className="py-3 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search phone…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="no-answer">No Answer</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Disposition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dispositions</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="callback_later">Callback</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              <SelectItem value="wrong_number">Wrong Number</SelectItem>
            </SelectContent>
          </Select>
          <Select value={recordingFilter} onValueChange={setRecordingFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Recording" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="yes">Has Recording</SelectItem>
              <SelectItem value="no">No Recording</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Recordings Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !calls?.length ? (
            <div className="py-16 text-center">
              <Mic className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No recordings found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Disposition</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call: any) => {
                    const caller = profiles?.[call.user_id];
                    const leadName = leads?.[call.lead_id];
                    return (
                      <TableRow key={call.id} className="cursor-pointer" onClick={() => setSelectedSession(call.id)}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(call.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell className="text-sm">{caller?.full_name || "—"}</TableCell>
                        <TableCell className="text-sm">{leadName || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{call.phone_number}</TableCell>
                        <TableCell className="font-mono tabular-nums text-xs">{formatTalkTime(call.call_duration || 0)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{call.call_status?.replace("-", " ")}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{call.disposition?.replace("_", " ") || "—"}</Badge></TableCell>
                        <TableCell>
                          {call.ai_score != null ? (
                            <div className="flex items-center gap-1"><Brain className="h-3 w-3 text-primary" /><span className="text-xs tabular-nums">{call.ai_score}</span></div>
                          ) : "—"}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          {call.recording_url ? (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPlayingId(playingId === call.id ? null : call.id)}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                                <Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No recording</span>
                          )}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedSession(call.id)}>Details</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Inline player */}
              {playingId && calls.find((c: any) => c.id === playingId)?.recording_url && (
                <div className="p-3 border-t bg-muted/30">
                  <audio controls autoPlay className="w-full" src={calls.find((c: any) => c.id === playingId).recording_url} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CallDetailDrawer sessionId={selectedSession} open={!!selectedSession} onOpenChange={o => !o && setSelectedSession(null)} />
    </div>
  );
}
