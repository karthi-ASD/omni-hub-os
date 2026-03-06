import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle,
  Users, Zap, ThumbsUp,
} from "lucide-react";
import { useCSTickets } from "@/hooks/useCSTickets";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  pending: "bg-muted text-muted-foreground",
  escalated: "bg-destructive/10 text-destructive",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const CustomerServiceDashboard = () => {
  usePageTitle("Customer Service Dashboard");
  const { tickets, stats, loading } = useCSTickets();

  const statCards = [
    { label: "Open Tickets", value: String(stats.open), icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Overdue", value: String(stats.overdue), icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Avg Response", value: stats.avgResponseMin ? `${stats.avgResponseMin}m` : "—", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Resolved Today", value: String(stats.resolvedToday), icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "CSAT Score", value: stats.csatAvg ? `${stats.csatAvg}%` : "—", icon: ThumbsUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "AI Handled", value: stats.aiHandledPct ? `${stats.aiHandledPct}%` : "—", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Service Hub</h1>
          <p className="text-xs text-muted-foreground">AI-powered support operations at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                {loading ? <Skeleton className="h-5 w-10" /> : <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.slice(0, 10).map((t: any) => (
                <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{t.ticket_number}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[t.priority] || ""}`}>
                        {t.priority}
                      </Badge>
                      {t.channel && (
                        <span className="text-[10px] text-muted-foreground">• {t.channel}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                    {t.department && (
                      <span className="text-[10px] text-muted-foreground">{t.department}</span>
                    )}
                  </div>
                  <Badge className={`text-[10px] ${statusColors[t.status] || ""} border-0`}>
                    {t.status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerServiceDashboard;
