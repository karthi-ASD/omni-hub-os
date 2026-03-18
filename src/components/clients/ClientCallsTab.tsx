import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, MousePointer, PhoneCall } from "lucide-react";
import { format, isToday, subDays, isAfter } from "date-fns";

interface Props {
  clientId: string;
}

interface CallEntry {
  id: string;
  phone: string | null;
  source: string;
  event_type: string;
  page_url: string | null;
  created_at: string;
  origin: "call_log" | "call_click";
}

export const ClientCallsTab = ({ clientId }: Props) => {
  const [calls, setCalls] = useState<CallEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    setLoading(true);

    // Fetch CRM call logs
    const [crmCalls, clickCalls] = await Promise.all([
      supabase
        .from("call_logs")
        .select("id, call_type, call_time, notes, created_at")
        .eq("client_id", clientId)
        .order("call_time", { ascending: false })
        .limit(200),
      supabase
        .from("seo_captured_leads")
        .select("id, phone, source, page_url, created_at")
        .eq("client_id", clientId)
        .eq("source", "call_click")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const merged: CallEntry[] = [
      ...(crmCalls.data || []).map((c: any) => ({
        id: c.id,
        phone: null,
        source: "crm",
        event_type: c.call_type || "call",
        page_url: null,
        created_at: c.call_time || c.created_at,
        origin: "call_log" as const,
      })),
      ...(clickCalls.data || []).map((c: any) => ({
        id: c.id,
        phone: c.phone,
        source: "website",
        event_type: "call_click",
        page_url: c.page_url,
        created_at: c.created_at,
        origin: "call_click" as const,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setCalls(merged);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const totalClicks = calls.filter(c => c.origin === "call_click").length;
  const todayClicks = calls.filter(c => c.origin === "call_click" && c.created_at && isToday(new Date(c.created_at))).length;
  const weekClicks = calls.filter(c => c.origin === "call_click" && c.created_at && isAfter(new Date(c.created_at), subDays(new Date(), 7))).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Call Clicks", value: totalClicks, icon: MousePointer },
          { label: "Today", value: todayClicks, icon: PhoneCall },
          { label: "Last 7 Days", value: weekClicks, icon: Phone },
        ].map(s => (
          <Card key={s.label} className="rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calls Table */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Call & Click Log ({calls.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {calls.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No call activity recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Page URL</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map(call => (
                    <TableRow key={call.id}>
                      <TableCell className="text-sm">{call.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={call.event_type === "call_click" ? "secondary" : "default"}
                          className="text-[10px]"
                        >
                          {call.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{call.source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">
                        {call.page_url || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {call.created_at ? format(new Date(call.created_at), "dd MMM yyyy, HH:mm") : "—"}
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
  );
};
