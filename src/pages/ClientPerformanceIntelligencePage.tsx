import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useGoogleAnalyticsStats } from "@/hooks/useGoogleAnalyticsStats";
import { useClientDashboardData } from "@/hooks/useClientDashboardData";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Users, Eye,
  Activity, Sparkles, BarChart3, Loader2, Rocket,
  Timer, MousePointerClick, FileText, Target, Zap,
  ArrowUpRight, Globe,
} from "lucide-react";

const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
type Period = keyof typeof PERIOD_DAYS;

const ClientPerformanceIntelligencePage = () => {
  usePageTitle("Performance Intelligence");
  const { clientId, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const { stats, loading, aggregates, insights, trendData, sourceData } =
    useGoogleAnalyticsStats(undefined, clientId || undefined);
  const { data: crmData } = useClientDashboardData();

  // Filter trend data by selected period
  const filteredTrend = useMemo(() => {
    if (!trendData.length) return [];
    const cutoff = PERIOD_DAYS[period];
    return trendData.slice(-cutoff);
  }, [trendData, period]);

  // Top pages for bar chart
  const topPagesData = useMemo(() => {
    if (!aggregates?.latest?.top_pages_json) return [];
    return (aggregates.latest.top_pages_json as any[]).slice(0, 6).map((p: any) => ({
      page: (p.path || p.url || "/").replace(/^https?:\/\/[^/]+/, "").slice(0, 30),
      views: p.views || p.pageviews || 0,
    }));
  }, [aggregates]);

  // Leads vs Traffic data
  const leadsVsTraffic = useMemo(() => {
    if (!stats.length || !crmData) return [];
    const monthlyMap = new Map<string, { month: string; visitors: number; leads: number }>();
    stats.forEach((s) => {
      const m = new Date(s.snapshot_date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
      const entry = monthlyMap.get(m) || { month: m, visitors: 0, leads: 0 };
      entry.visitors += s.users_count || 0;
      monthlyMap.set(m, entry);
    });
    // Distribute leads evenly across months (approximation)
    const months = Array.from(monthlyMap.values());
    if (months.length > 0 && crmData.totalLeads > 0) {
      const perMonth = Math.round(crmData.totalLeads / months.length);
      months.forEach((m) => (m.leads = perMonth));
      // Put remainder in last month
      if (months.length > 0) {
        months[months.length - 1].leads = crmData.leadsThisMonth || perMonth;
      }
    }
    return months;
  }, [stats, crmData]);

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (!aggregates || stats.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <HeroEmpty />
        <ClientPortalEmptyState
          icon={BarChart3}
          title="Your performance data is being prepared"
          message="The Performance Intelligence Layer will light up once your campaign is active. Our team syncs analytics data regularly to showcase your growth."
        />
      </div>
    );
  }

  const chartConfig = {
    users: { label: "Visitors", color: "hsl(var(--chart-1))" },
    sessions: { label: "Sessions", color: "hsl(var(--chart-2))" },
    views: { label: "Views", color: "hsl(var(--chart-1))" },
    visitors: { label: "Visitors", color: "hsl(var(--chart-1))" },
    leads: { label: "Leads", color: "hsl(var(--chart-3))" },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* ── HERO SECTION ── */}
      <Card className="rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />
        <CardContent className="p-6 md:p-10 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Performance Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold mb-1 tracking-tight">
            Your Business Performance 🚀
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Real-time insights powered by NextWeb
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <AnimatedKPI
              label="Total Visitors"
              value={aggregates.totalUsers}
              icon={<Users className="h-4 w-4" />}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <AnimatedKPI
              label="Total Sessions"
              value={aggregates.totalSessions}
              icon={<Eye className="h-4 w-4" />}
              color="text-violet-500"
              bgColor="bg-violet-500/10"
            />
            <AnimatedKPI
              label="Conversion Rate"
              value={aggregates.conversionRate}
              suffix="%"
              icon={<Target className="h-4 w-4" />}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
            <AnimatedKPI
              label="Growth"
              value={Math.abs(aggregates.growthPct)}
              prefix={aggregates.growthPct >= 0 ? "↑ " : "↓ "}
              suffix="%"
              icon={aggregates.growthPct >= 0
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />}
              color={aggregates.growthPct >= 0 ? "text-emerald-500" : "text-red-500"}
              bgColor={aggregates.growthPct >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
              badge={aggregates.growthPct > 0
                ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] mt-1">Growing</Badge>
                : undefined}
            />
          </div>

          {aggregates.growthPct > 0 && (
            <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-fade-in">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ↑ {aggregates.growthPct}% growth compared to last period — Your website traffic is improving!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 1: TRAFFIC GROWTH ── */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Traffic Growth
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-7">
              <TabsTrigger value="7d" className="text-xs h-6 px-2">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs h-6 px-2">30D</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs h-6 px-2">90D</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={filteredTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#fillUsers)" />
              <Area type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#fillSessions)" strokeDasharray="5 5" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── SECTION 2 & 3: SOURCES + TOP PAGES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic Sources Pie */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" /> Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {sourceData.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip />
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
                {/* Top source insight */}
                {sourceData.length > 0 && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {sourceData[0].name} is your strongest traffic channel
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-8">Source breakdown will appear soon</p>
            )}
          </CardContent>
        </Card>

        {/* Top Pages Bar Chart */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" /> Top Performing Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPagesData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <BarChart data={topPagesData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/40" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="page" tick={{ fontSize: 10 }} width={120} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Top pages data will appear once more data is collected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4: ENGAGEMENT METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EngagementCard
          label="Bounce Rate"
          value={`${aggregates.avgBounce}%`}
          icon={<MousePointerClick className="h-5 w-5" />}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
          status={aggregates.avgBounce < 50 ? "good" : aggregates.avgBounce > 70 ? "bad" : "neutral"}
          hint={aggregates.avgBounce < 50 ? "Healthy — users are engaging well" : aggregates.avgBounce > 70 ? "High — consider improving engagement" : "Average range"}
        />
        <EngagementCard
          label="Avg Session Duration"
          value={`${Math.round(aggregates.avgDuration / 60)}m ${aggregates.avgDuration % 60}s`}
          icon={<Timer className="h-5 w-5" />}
          color="text-violet-500"
          bgColor="bg-violet-500/10"
          status={aggregates.avgDuration > 120 ? "good" : aggregates.avgDuration < 30 ? "bad" : "neutral"}
          hint={aggregates.avgDuration > 120 ? "Users are spending quality time" : "Users browse briefly"}
        />
        <EngagementCard
          label="Total Conversions"
          value={aggregates.totalConversions.toLocaleString()}
          icon={<Zap className="h-5 w-5" />}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          status={aggregates.totalConversions > 0 ? "good" : "neutral"}
          hint={aggregates.totalConversions > 0 ? "Conversions are being tracked" : "No conversions recorded yet"}
        />
      </div>

      {/* ── SECTION 5: AI INSIGHTS ── */}
      {insights.length > 0 && (
        <Card className="rounded-xl border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/50 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`mt-0.5 p-1.5 rounded-md ${
                    insight.color === "green" ? "bg-emerald-500/10 text-emerald-500" :
                    insight.color === "red" ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {insight.icon === "up" ? <TrendingUp className="h-3.5 w-3.5" /> :
                     insight.icon === "down" ? <TrendingDown className="h-3.5 w-3.5" /> :
                     <Minus className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm text-foreground">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SECTION 6: LEADS VS TRAFFIC ── */}
      {leadsVsTraffic.length > 0 && crmData && crmData.totalLeads > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" /> Visitors vs Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={leadsVsTraffic} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#fillVisitors)" />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--chart-3))" strokeWidth={2.5} fill="url(#fillLeads)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Data syncs automatically every 48 hours • Powered by NextWeb Analytics Engine
        </p>
      </div>
    </div>
  );
};

export default ClientPerformanceIntelligencePage;

/* ── Sub-components ── */

const HeroEmpty = () => (
  <Card className="rounded-2xl overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
    <CardContent className="p-6 md:p-10">
      <div className="flex items-center gap-2 mb-2">
        <Rocket className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-primary uppercase tracking-wide">Performance Intelligence</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Your Business Performance 🚀</h1>
      <p className="text-sm text-muted-foreground">Real-time insights powered by NextWeb</p>
    </CardContent>
  </Card>
);

const AnimatedKPI = ({
  label, value, prefix = "", suffix = "", icon, color, bgColor, badge,
}: {
  label: string; value: number; prefix?: string; suffix?: string;
  icon: React.ReactNode; color: string; bgColor: string; badge?: React.ReactNode;
}) => (
  <div className="p-4 rounded-xl bg-background/80 backdrop-blur border border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-md ${bgColor}`}>
        <span className={color}>{icon}</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-2xl md:text-3xl font-extrabold ${color}`}>
      {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
    </p>
    {badge}
  </div>
);

const EngagementCard = ({
  label, value, icon, color, bgColor, status, hint,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; bgColor: string;
  status: "good" | "bad" | "neutral"; hint: string;
}) => (
  <Card className="rounded-xl hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-extrabold mb-2">{value}</p>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          status === "good" ? "bg-emerald-500" : status === "bad" ? "bg-red-500" : "bg-amber-500"
        }`} />
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </CardContent>
  </Card>
);
