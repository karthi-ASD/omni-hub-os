import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock } from "lucide-react";

export function ActivityLogsTab() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["hr-activity-logs", bid],
    queryFn: async () => {
      const { data } = await (supabase.from("system_activity_logs" as any) as any)
        .select("*")
        .eq("business_id", bid!)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!bid,
  });

  // Also get employee sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["hr-sessions", bid],
    queryFn: async () => {
      const { data } = await supabase.from("employee_sessions")
        .select("*")
        .eq("business_id", bid!)
        .order("login_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!bid,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-primary">{logs.length}</p>
            <p className="text-[10px] text-muted-foreground">Activity Logs</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-blue-500">{sessions.length}</p>
            <p className="text-[10px] text-muted-foreground">Login Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading activity...</div>
        ) : logs.length === 0 && sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity logs yet</p>
          </div>
        ) : (
          <>
            {/* Merge and sort logs + sessions */}
            {[
              ...logs.map((l: any) => ({ type: "log", ...l, ts: l.created_at })),
              ...sessions.map((s: any) => ({ type: "session", ...s, ts: s.login_at })),
            ]
              .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
              .slice(0, 80)
              .map((item: any, i: number) => (
                <Card key={`${item.type}-${item.id || i}`} className="rounded-xl border-0 shadow-sm">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === "session" ? "bg-blue-500/10" : "bg-primary/10"
                    }`}>
                      {item.type === "session" ? (
                        <Clock className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.type === "session"
                          ? `Login session: ${item.user_email || "User"}`
                          : item.action || item.event_type || "Activity"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.type === "session"
                          ? `IP: ${item.ip_address || "—"} • ${item.device_info || "Web"}`
                          : item.details || item.description || ""}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.ts), { addSuffix: true })}
                      </p>
                    </div>
                    {item.type === "log" && item.action_type && (
                      <Badge variant="outline" className="text-[9px] shrink-0">{item.action_type}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
