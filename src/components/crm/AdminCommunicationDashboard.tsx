import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Clock, TrendingUp, PhoneOff, Search, Mic, Brain, Tag } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
};

export function AdminCommunicationDashboard({ businessId }: AdminCommunicationDashboardProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, connected: 0, failed: 0, talkTime: 0, connectRate: 0, avgDuration: 0 });

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    db.from("crm_call_communications")
      .select("*")
      .eq("business_id", businessId)
      .order("start_time", { ascending: false })
      .limit(200)
      .then(({ data, error }: any) => {
        if (error) { console.error(error); setLoading(false); return; }
        const all = data || [];
        setRecords(all);

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

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.phone_number_raw?.toLowerCase().includes(q) ||
      r.matched_name?.toLowerCase().includes(q) ||
      r.matched_business_name?.toLowerCase().includes(q) ||
      r.disposition?.toLowerCase().includes(q) ||
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
          placeholder="Search by phone, name, tag, or disposition…"
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
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Disposition</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">AI</TableHead>
                  <TableHead className="text-xs">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No records found</TableCell></TableRow>
                )}
                {filtered.slice(0, 100).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.start_time), "dd MMM HH:mm")}</TableCell>
                    <TableCell className="text-xs font-mono">{r.phone_number_raw}</TableCell>
                    <TableCell className="text-xs">
                      {r.matched_name && <span className="font-medium">{r.matched_name}</span>}
                      {r.entity_type && <Badge variant="outline" className="ml-1 text-[8px]">{r.entity_type}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] ${STATUS_BADGE[r.call_status] || "bg-muted"}`}>{r.call_status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.disposition || "—"}</TableCell>
                    <TableCell className="text-xs">{r.duration_seconds > 0 ? fmtTime(r.duration_seconds) : "—"}</TableCell>
                    <TableCell>
                      {r.ai_synopsis_internal ? (
                        <Badge variant="outline" className="text-[8px]">
                          <Brain className="h-2.5 w-2.5 mr-0.5" />
                          {r.sentiment || "done"}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.auto_tags?.length > 0 ? (
                        <div className="flex gap-0.5 flex-wrap">
                          {r.auto_tags.slice(0, 3).map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-[7px] h-4 px-1">{t}</Badge>
                          ))}
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
