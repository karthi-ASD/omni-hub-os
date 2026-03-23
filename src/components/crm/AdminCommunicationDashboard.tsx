import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Clock, Search, Brain, Play, User, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { retryAIProcessing } from "@/services/crmCommunicationService";

const db = supabase as any;

interface AdminCommunicationDashboardProps {
  businessId: string;
}

const STATUS_BADGE: Record<string, string> = {
  connected: "bg-emerald-100 text-emerald-700",
  ended: "bg-muted text-muted-foreground",
  failed: "bg-destructive/20 text-destructive",
  "no-answer": "bg-amber-100 text-amber-700",
  busy: "bg-amber-100 text-amber-700",
  initiated: "bg-blue-100 text-blue-700",
};

const PROCESSING_LABELS: Record<string, { label: string; className: string }> = {
  completed: { label: "✓ Done", className: "border-emerald-400 text-emerald-600" },
  processing: { label: "Processing", className: "border-primary/40 text-primary" },
  pending: { label: "Pending", className: "border-amber-400 text-amber-600" },
  failed: { label: "Failed", className: "border-destructive/40 text-destructive" },
  idle: { label: "Awaiting", className: "border-muted-foreground/40 text-muted-foreground" },
};

export function AdminCommunicationDashboard({ businessId }: AdminCommunicationDashboardProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, connected: 0, failed: 0, talkTime: 0, connectRate: 0, avgDuration: 0 });

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);

    Promise.all([
      db.from("crm_call_communications")
        .select("*")
        .eq("business_id", businessId)
        .order("start_time", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("business_id", businessId),
    ]).then(([commResult, profileResult]: any[]) => {
      const all = commResult.data || [];
      setRecords(all);

      // Build profile lookup map
      const profileMap: Record<string, string> = {};
      (profileResult.data || []).forEach((p: any) => {
        profileMap[p.user_id] = p.full_name || p.email || "Unknown";
      });
      setProfiles(profileMap);

      const total = all.length;
      const connected = all.filter((r: any) => r.connected).length;
      const failed = all.filter((r: any) => r.call_status === "failed").length;
      const talkTime = all.reduce((s: number, r: any) => s + (r.talk_time_seconds || 0), 0);
      const totalDuration = all.reduce((s: number, r: any) => s + (r.duration_seconds || 0), 0);

      setStats({
        total,
        connected,
        failed,
        talkTime,
        connectRate: total > 0 ? Math.round((connected / total) * 100) : 0,
        avgDuration: connected > 0 ? Math.round(totalDuration / connected) : 0,
      });
      setLoading(false);
    });
  }, [businessId]);

  const handleRetry = async (commId: string) => {
    setRetrying(commId);
    const ok = await retryAIProcessing(commId);
    if (ok) {
      toast.success("AI processing retriggered");
      setRecords((prev) =>
        prev.map((r) => r.id === commId ? { ...r, processing_status: "processing" } : r)
      );
    } else {
      toast.error("Retry failed — preconditions not met");
    }
    setRetrying(null);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const agentName = profiles[r.user_id] || "";
    return (
      r.phone_number_raw?.toLowerCase().includes(q) ||
      r.matched_name?.toLowerCase().includes(q) ||
      r.matched_business_name?.toLowerCase().includes(q) ||
      r.disposition?.toLowerCase().includes(q) ||
      agentName.toLowerCase().includes(q) ||
      (r.auto_tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading communication data…</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Total Calls</p><p className="text-lg font-bold">{stats.total}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Connected</p><p className="text-lg font-bold text-emerald-600">{stats.connected}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Failed</p><p className="text-lg font-bold text-destructive">{stats.failed}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Talk Time</p><p className="text-lg font-bold">{fmtTime(stats.talkTime)}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Connect Rate</p><p className="text-lg font-bold">{stats.connectRate}%</p></Card>
        <Card className="p-3"><p className="text-[10px] text-muted-foreground uppercase">Avg Duration</p><p className="text-lg font-bold">{fmtTime(stats.avgDuration)}</p></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by phone, name, agent, tag, or disposition…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Agent</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Lead / Client</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Disposition</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Recording</TableHead>
                  <TableHead className="text-xs">AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No records found</TableCell></TableRow>
                )}
                {filtered.slice(0, 100).map((r) => {
                  const agentName = profiles[r.user_id] || "Unknown";
                  const entityName = r.matched_name || r.entity_name_snapshot || null;
                  const procStatus = r.processing_status || "idle";
                  const procMeta = PROCESSING_LABELS[procStatus] || PROCESSING_LABELS.idle;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(r.start_time), "dd MMM HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {agentName}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.phone_number_raw}</TableCell>
                      <TableCell className="text-xs">
                        {entityName ? (
                          <span className="font-medium">{entityName}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {r.entity_type && <Badge variant="outline" className="ml-1 text-[8px]">{r.entity_type}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] ${STATUS_BADGE[r.call_status] || "bg-muted"}`}>{r.call_status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.disposition || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {r.duration_seconds > 0 ? fmtTime(r.duration_seconds) : "—"}
                        {r.talk_time_seconds > 0 && r.talk_time_seconds !== r.duration_seconds && (
                          <span className="text-muted-foreground ml-1">({fmtTime(r.talk_time_seconds)} talk)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.recording_url ? (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" asChild>
                            <a href={r.recording_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-3 w-3 mr-0.5" /> Play
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No recording</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {procStatus === "completed" && r.ai_synopsis_internal ? (
                          <Badge variant="outline" className={`text-[8px] ${procMeta.className}`}>
                            <Brain className="h-2.5 w-2.5 mr-0.5" />
                            {r.sentiment || "done"}
                            {r.ai_score != null && ` (${r.ai_score})`}
                          </Badge>
                        ) : procStatus === "processing" ? (
                          <Badge variant="outline" className={`text-[8px] ${procMeta.className}`}>
                            <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" /> Processing
                          </Badge>
                        ) : procStatus === "failed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-5 px-1.5 text-[9px] text-destructive border-destructive/40"
                            disabled={retrying === r.id}
                            onClick={() => handleRetry(r.id)}
                          >
                            {retrying === r.id ? (
                              <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                            )}
                            Retry
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {r.connected && r.duration_seconds >= 3 ? "Pending" : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
