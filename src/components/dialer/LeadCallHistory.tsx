import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import { format } from "date-fns";
import type { DialerSession } from "@/services/dialerService";

interface LeadCallHistoryProps {
  leadId: string;
}

export function LeadCallHistory({ leadId }: LeadCallHistoryProps) {
  const { data: calls, isLoading } = useQuery({
    queryKey: ["lead-call-history", leadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as unknown as DialerSession[]) || [];
    },
    enabled: !!leadId,
  });

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading call history...</p>;
  if (!calls?.length) return <p className="text-xs text-muted-foreground">No call history</p>;

  const statusColor = (s: string) => {
    if (s === "ended" || s === "connected") return "bg-emerald-500/10 text-emerald-700";
    if (s === "failed" || s === "busy") return "bg-destructive/10 text-destructive";
    if (s === "no-answer") return "bg-amber-500/10 text-amber-700";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Call History ({calls.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-72 overflow-y-auto">
        {calls.map((call) => (
          <div key={call.id} className="p-2.5 rounded-lg bg-muted/40 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-[10px] ${statusColor(call.call_status)}`}>
                {call.call_status}
              </Badge>
              <span className="text-muted-foreground tabular-nums">
                {call.call_duration ? `${Math.floor(call.call_duration / 60)}:${(call.call_duration % 60).toString().padStart(2, "0")}` : "--:--"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              {call.disposition && (
                <Badge variant="secondary" className="text-[10px]">
                  {call.disposition.replace(/_/g, " ")}
                </Badge>
              )}
              <span className="text-muted-foreground text-[10px]">
                {format(new Date(call.created_at), "dd MMM yyyy HH:mm")}
              </span>
            </div>
            {call.notes && <p className="text-muted-foreground line-clamp-2">{call.notes}</p>}
            {call.recording_url && (
              <div className="flex gap-1.5 pt-1">
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" asChild>
                  <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                    <Play className="h-3 w-3 mr-0.5" /> Play
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" asChild>
                  <a href={call.recording_url} download>
                    <Download className="h-3 w-3 mr-0.5" /> Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
