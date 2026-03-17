import { useGoogleAnalyticsStats } from "@/hooks/useGoogleAnalyticsStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer,
} from "recharts";
import {
  Users, Eye, Clock, TrendingUp, TrendingDown, Minus,
  Activity, RefreshCw, Loader2, BarChart3, Sparkles,
} from "lucide-react";

interface AnalyticsDashboardPanelProps {
  projectId: string;
}

export const AnalyticsDashboardPanel = ({ projectId }: AnalyticsDashboardPanelProps) => {
  const { stats, loading, aggregates, insights, trendData, sourceData, refetch } = useGoogleAnalyticsStats(projectId);

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!aggregates || stats.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="text-center py-12">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">No analytics data yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Analytics data will appear here once synced. Sync runs automatically every 48 hours.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Check for Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  const GrowthBadge = ({ value }: { value: number }) => {
    if (value > 0) return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
        <TrendingUp className="h-3 w-3" /> +{value}%
      </Badge>
    );
    if (value < 0) return (
      <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1">
        <TrendingDown className="h-3 w-3" /> {value}%
      </Badge>
    );
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus className="h-3 w-3" /> 0%
      </Badge>
    );
  };

  const chartConfig = {
    users: { label: "Users", color: "hsl(var(--chart-1))" },
    sessions: { label: "Sessions", color: "hsl(var(--chart-2))" },
    pageviews: { label: "Pageviews", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Analytics Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.length} data points · Last updated: {new Date(stats[stats.length - 1].created_at).toLocaleDateString()}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value={aggregates.totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          badge={<GrowthBadge value={aggregates.growthPct} />}
          gradient="from-blue-500/10 to-cyan-500/10"
          iconColor="text-blue-500"
        />
        <KpiCard
          title="Total Sessions"
          value={aggregates.totalSessions.toLocaleString()}
          icon={<Eye className="h-4 w-4" />}
          gradient="from-violet-500/10 to-purple-500/10"
          iconColor="text-violet-500"
        />
        <KpiCard
          title="Conversion Rate"
          value={aggregates.conversionRate + "%"}
          icon={<TrendingUp className="h-4 w-4" />}
          gradient="from-emerald-500/10 to-green-500/10"
          iconColor="text-emerald-500"
        />
        <KpiCard
          title="Bounce Rate"
          value={aggregates.avgBounce + "%"}
          icon={<Activity className="h-4 w-4" />}
          gradient="from-amber-500/10 to-orange-500/10"
          iconColor="text-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic Trend Line Chart */}
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Traffic Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Traffic Source Pie Chart */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement + Top Pages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement Cards */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Avg Bounce Rate</p>
              <p className="text-xl font-bold mt-1">{aggregates.avgBounce}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Avg Session Duration</p>
              <p className="text-xl font-bold mt-1">{formatDuration(aggregates.avgDuration)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Pageviews</p>
              <p className="text-xl font-bold mt-1">{aggregates.totalPageviews.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Conversions</p>
              <p className="text-xl font-bold mt-1">{aggregates.totalConversions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregates.latest?.top_pages_json && (aggregates.latest.top_pages_json as any[]).length > 0 ? (
              <div className="space-y-2">
                {(aggregates.latest.top_pages_json as any[]).slice(0, 5).map((page: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="truncate flex-1 text-muted-foreground">{page.path || page.url || "/"}</span>
                    <Badge variant="outline" className="text-xs ml-2">{page.views || page.pageviews || 0} views</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Top pages data will appear after sync</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="rounded-xl border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className={`mt-0.5 ${insight.color === "green" ? "text-emerald-500" : insight.color === "red" ? "text-red-500" : "text-blue-500"}`}>
                    {insight.icon === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : insight.icon === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-muted-foreground">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ── Sub-components ── */

const KpiCard = ({
  title, value, icon, badge, gradient, iconColor,
}: {
  title: string; value: string; icon: React.ReactNode;
  badge?: React.ReactNode; gradient: string; iconColor: string;
}) => (
  <Card className={`rounded-xl bg-gradient-to-br ${gradient} border-0 shadow-sm`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-background/80 ${iconColor}`}>{icon}</div>
        {badge}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
    </CardContent>
  </Card>
);

function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds + "s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
