import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { useCSTickets } from "@/hooks/useCSTickets";

const CSReportsPage = () => {
  usePageTitle("CS Reports & Analytics");
  const { tickets, stats, loading } = useCSTickets();

  const channelBreakdown = tickets.reduce((acc: Record<string, number>, t: any) => {
    const ch = t.channel || "email";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});

  const channels = Object.entries(channelBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([channel, count]) => ({
      channel,
      tickets: count as number,
      pct: tickets.length > 0 ? Math.round(((count as number) / tickets.length) * 100) : 0,
    }));

  const metrics = [
    { label: "Total Tickets", value: String(tickets.length) },
    { label: "Open", value: String(stats.open) },
    { label: "Overdue", value: String(stats.overdue) },
    { label: "Resolved Today", value: String(stats.resolvedToday) },
    { label: "CSAT Score", value: stats.csatAvg ? `${stats.csatAvg}%` : "—" },
    { label: "AI Handled", value: stats.aiHandledPct ? `${stats.aiHandledPct}%` : "—" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">CS Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground">Customer service performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
              {loading ? <Skeleton className="h-5 w-10" /> : <p className="text-lg font-bold text-foreground">{m.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Channel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : channels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
          ) : (
            channels.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-24 capitalize">{c.channel}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{c.tickets} ({c.pct}%)</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CSReportsPage;
