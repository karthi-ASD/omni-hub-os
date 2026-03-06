import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageSquare, Clock, Users, TrendingUp, ThumbsUp, Zap } from "lucide-react";
import { useCSTickets } from "@/hooks/useCSTickets";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = [
  "hsl(210, 85%, 52%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 55%)", "hsl(0, 72%, 51%)", "hsl(180, 60%, 40%)",
];

const CSReportsPage = () => {
  usePageTitle("CS Reports & Analytics");
  const { tickets, stats, loading } = useCSTickets();

  // Channel breakdown
  const channelData = Object.entries(
    tickets.reduce((acc: Record<string, number>, t: any) => {
      const ch = t.channel || "email";
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  // Priority breakdown
  const priorityData = ["critical", "high", "medium", "low"].map(p => ({
    name: p,
    value: tickets.filter((t: any) => t.priority === p).length,
  }));

  // Status breakdown
  const statusData = ["open", "in_progress", "resolved", "closed"].map(s => ({
    name: s.replace("_", " "),
    value: tickets.filter((t: any) => t.status === s).length,
  }));

  // Daily ticket trend (last 14 days)
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const count = tickets.filter((t: any) => t.created_at?.startsWith(dayStr)).length;
    return { date: format(day, "MMM d"), tickets: count };
  });

  // Sentiment breakdown
  const sentimentData = Object.entries(
    tickets.reduce((acc: Record<string, number>, t: any) => {
      const s = t.sentiment || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));

  // Resolution metrics
  const resolvedTickets = tickets.filter((t: any) => t.resolved_at);
  const avgResolutionHours = resolvedTickets.length > 0
    ? Math.round(resolvedTickets.reduce((s: number, t: any) => {
        const created = new Date(t.created_at).getTime();
        const resolved = new Date(t.resolved_at).getTime();
        return s + (resolved - created) / (1000 * 60 * 60);
      }, 0) / resolvedTickets.length)
    : 0;

  const metrics = [
    { label: "Total Tickets", value: String(tickets.length), icon: MessageSquare },
    { label: "Open", value: String(stats.open), icon: Clock },
    { label: "Overdue", value: String(stats.overdue), icon: TrendingUp },
    { label: "Resolved Today", value: String(stats.resolvedToday), icon: ThumbsUp },
    { label: "CSAT", value: stats.csatAvg ? `${stats.csatAvg}%` : "—", icon: ThumbsUp },
    { label: "Avg Resolution", value: avgResolutionHours ? `${avgResolutionHours}h` : "—", icon: Clock },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">CS Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground">Deep dive into support performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <m.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                {loading ? <Skeleton className="h-5 w-10" /> : <p className="text-lg font-bold text-foreground">{m.value}</p>}
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs">Channels</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Status Distribution */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(210, 85%, 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Priority Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {priorityData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-16 capitalize">{p.name}</span>
                  <Progress value={tickets.length > 0 ? (p.value / tickets.length) * 100 : 0} className="flex-1 h-2" />
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{p.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sentiment */}
          {sentimentData.length > 0 && sentimentData[0].name !== "unknown" && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sentiment Analysis</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, value }) => `${name}: ${value}`}>
                      {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Channel Distribution</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : channelData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {channelData.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-medium text-foreground capitalize flex-1">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.value} tickets</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">14-Day Ticket Trend</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="tickets" stroke="hsl(210, 85%, 52%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSReportsPage;
