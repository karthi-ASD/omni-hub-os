import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useGoogleAnalyticsStats } from "@/hooks/useGoogleAnalyticsStats";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Users, Eye,
  Activity, Sparkles, BarChart3, Loader2, Rocket,
} from "lucide-react";

const ClientWebsitePerformancePage = () => {
  usePageTitle("Website Performance");
  const { clientId, loading: authLoading } = useAuth();
  const { stats, loading, aggregates, insights, trendData, sourceData } = useGoogleAnalyticsStats(undefined, clientId || undefined);

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (!aggregates || stats.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Website Performance
        </h1>
        <ClientPortalEmptyState
          icon={BarChart3}
          title="Your performance data is being prepared"
          message="Analytics data will appear here once your campaign is active. Our team syncs data regularly to show your growth."
        />
      </div>
    );
  }

  const chartConfig = {
    users: { label: "Visitors", color: "hsl(var(--chart-1))" },
    sessions: { label: "Sessions", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <Card className="rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Website Performance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Your Website is {aggregates.growthPct > 0 ? "Growing" : "Being Optimized"} {aggregates.growthPct > 0 ? "🚀" : "⚡"}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroStat
              label="Total Visitors"
              value={aggregates.totalUsers.toLocaleString()}
              icon={<Users className="h-4 w-4 text-blue-500" />}
            />
            <HeroStat
              label="Growth"
              value={
                <span className={aggregates.growthPct > 0 ? "text-emerald-600" : aggregates.growthPct < 0 ? "text-red-500" : ""}>
                  {aggregates.growthPct > 0 ? "↑" : aggregates.growthPct < 0 ? "↓" : ""} {Math.abs(aggregates.growthPct)}%
                </span>
              }
              icon={aggregates.growthPct >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              badge={
                aggregates.growthPct > 0
                  ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">Growing</Badge>
                  : undefined
              }
            />
            <HeroStat
              label="Sessions"
              value={aggregates.totalSessions.toLocaleString()}
              icon={<Eye className="h-4 w-4 text-violet-500" />}
            />
            <HeroStat
              label="Pageviews"
              value={aggregates.totalPageviews.toLocaleString()}
              icon={<Activity className="h-4 w-4 text-amber-500" />}
            />
          </div>

          {/* Growth Badge Banner */}
          {aggregates.growthPct > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ↑ {aggregates.growthPct}% Growth This Period — Your website traffic is improving!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visitors Growth Graph */}
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Visitors Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Where Visitors Come From</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {sourceData.length > 0 ? (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
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
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-8">Source breakdown will appear after more data is collected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      {aggregates.latest?.top_pages_json && (aggregates.latest.top_pages_json as any[]).length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Performing Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(aggregates.latest.top_pages_json as any[]).slice(0, 5).map((page: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <span className="truncate">{page.path || page.url || "/"}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{page.views || page.pageviews || 0} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="rounded-xl border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <div className={`mt-0.5 ${insight.color === "green" ? "text-emerald-500" : insight.color === "red" ? "text-red-500" : "text-blue-500"}`}>
                    {insight.icon === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : insight.icon === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-foreground">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientWebsitePerformancePage;

/* ── Sub-components ── */

const HeroStat = ({
  label, value, icon, badge,
}: {
  label: string; value: React.ReactNode; icon: React.ReactNode; badge?: React.ReactNode;
}) => (
  <div className="p-3 rounded-xl bg-background/80 backdrop-blur">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-xl font-bold">{value}</p>
    {badge && <div className="mt-1">{badge}</div>}
  </div>
);
