import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useGoogleAnalyticsStats } from "@/hooks/useGoogleAnalyticsStats";
import { useClientDashboardData } from "@/hooks/useClientDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Users, Eye,
  Activity, Sparkles, BarChart3, Loader2, Rocket,
  Timer, MousePointerClick, FileText, Target, Zap,
  ArrowUpRight, Globe, CheckCircle2, Clock, AlertCircle,
  ShieldCheck, RefreshCw,
} from "lucide-react";

const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
type Period = keyof typeof PERIOD_DAYS;

const ClientPerformanceIntelligencePage = () => {
  usePageTitle("Performance Intelligence Layer");
  const { clientId, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const { stats, loading, aggregates, insights, trendData, sourceData, syncStatus } =
    useGoogleAnalyticsStats(undefined, clientId || undefined);
  const { data: crmData } = useClientDashboardData();

  const filteredTrend = useMemo(() => {
    if (!trendData.length) return [];
    return trendData.slice(-PERIOD_DAYS[period]);
  }, [trendData, period]);

  const topPagesData = useMemo(() => {
    if (!aggregates?.latest?.top_pages_json) return [];
    return (aggregates.latest.top_pages_json as any[]).slice(0, 6).map((p: any) => ({
      page: (p.path || p.url || "/").replace(/^https?:\/\/[^/]+/, "").slice(0, 30),
      views: p.views || p.pageviews || 0,
    }));
  }, [aggregates]);

  const leadsVsTraffic = useMemo(() => {
    if (!stats.length || !crmData) return [];
    const monthlyMap = new Map<string, { month: string; visitors: number; leads: number }>();
    stats.forEach((s) => {
      const m = new Date(s.snapshot_date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
      const entry = monthlyMap.get(m) || { month: m, visitors: 0, leads: 0 };
      entry.visitors += s.users_count || 0;
      monthlyMap.set(m, entry);
    });
    const months = Array.from(monthlyMap.values());
    if (months.length > 0 && crmData.totalLeads > 0) {
      const perMonth = Math.round(crmData.totalLeads / months.length);
      months.forEach((m) => (m.leads = perMonth));
      if (months.length > 0) months[months.length - 1].leads = crmData.leadsThisMonth || perMonth;
    }
    return months;
  }, [stats, crmData]);

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Loading Performance Intelligence</p>
            <p className="text-xs text-muted-foreground mt-1">Preparing your business insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aggregates || stats.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <HeroEmpty />
        <Card className="rounded-2xl border-dashed border-2 border-primary/20">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-6">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Your Performance Intelligence Layer is Getting Ready</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Analytics data will appear here after the first successful sync. Our team syncs your business data automatically every 48 hours to showcase your growth.
            </p>
            <SyncStatusBadge syncStatus={syncStatus} />
          </CardContent>
        </Card>
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
      {/* ═══ HERO SECTION ═══ */}
      <Card className="rounded-2xl overflow-hidden border-0 shadow-xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/8 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.12),transparent_70%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,hsl(var(--primary)/0.06),transparent_70%)]" />
        <CardContent className="p-6 md:p-10 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Performance Intelligence Layer
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Real-time business growth insights powered by NextWeb
                </p>
              </div>
            </div>
            <SyncStatusBadge syncStatus={syncStatus} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
            <AnimatedKPI
              label="Visitors"
              sublabel="Last 30 days"
              value={aggregates.totalUsers}
              icon={<Users className="h-5 w-5" />}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <AnimatedKPI
              label="Sessions"
              sublabel="Last 30 days"
              value={aggregates.totalSessions}
              icon={<Eye className="h-5 w-5" />}
              color="text-violet-500"
              bgColor="bg-violet-500/10"
            />
            <AnimatedKPI
              label="Conversion Rate"
              sublabel="Sessions → Conversions"
              value={aggregates.conversionRate}
              suffix="%"
              icon={<Target className="h-5 w-5" />}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
            <AnimatedKPI
              label="Growth"
              sublabel="vs Previous 30 days"
              value={Math.abs(aggregates.growthPct)}
              prefix={aggregates.growthPct >= 0 ? "↑ " : "↓ "}
              suffix="%"
              icon={aggregates.growthPct >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              color={aggregates.growthPct >= 0 ? "text-emerald-500" : "text-red-500"}
              bgColor={aggregates.growthPct >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
              badge={aggregates.growthPct > 0
                ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] mt-1.5">Growing</Badge>
                : aggregates.growthPct < 0
                ? <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-[10px] mt-1.5">Declining</Badge>
                : undefined}
            />
          </div>

          {aggregates.growthPct > 0 && (
            <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 animate-fade-in">
              <ArrowUpRight className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                ↑ {aggregates.growthPct}% growth compared to previous period — Your business is growing!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ SECTION B: TRAFFIC GROWTH ═══ */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Growth Story
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs h-7 px-3">7 Days</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs h-7 px-3">30 Days</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs h-7 px-3">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={filteredTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="pil-fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pil-fillSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#pil-fillUsers)" />
              <Area type="monotone" dataKey="sessions" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#pil-fillSessions)" strokeDasharray="5 5" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ═══ SECTION C & D: SOURCES + TOP PAGES ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traffic Sources */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" /> Traffic Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {sourceData.length > 0 ? (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {sourceData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 justify-center">
                  {sourceData.map((s) => {
                    const total = sourceData.reduce((a, b) => a + b.value, 0);
                    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                    return (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ background: s.fill }} />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                {sourceData.length > 0 && (
                  <div className="mt-4 px-4 py-2.5 rounded-lg bg-blue-500/10 text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    {sourceData[0].name} is your strongest traffic channel
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-10">Traffic source data will appear after more data is collected</p>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" /> Top Performing Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPagesData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={topPagesData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted/30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="page" tick={{ fontSize: 10 }} width={130} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Top pages data will appear once more data is collected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ SECTION E: ENGAGEMENT SNAPSHOT ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <EngagementCard
          label="Bounce Rate"
          value={`${aggregates.avgBounce}%`}
          icon={<MousePointerClick className="h-5 w-5" />}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
          status={aggregates.avgBounce < 50 ? "good" : aggregates.avgBounce > 70 ? "bad" : "neutral"}
          hint={aggregates.avgBounce < 50 ? "Healthy" : aggregates.avgBounce > 70 ? "Needs attention" : "Average"}
        />
        <EngagementCard
          label="Avg Duration"
          value={formatDuration(aggregates.avgDuration)}
          icon={<Timer className="h-5 w-5" />}
          color="text-violet-500"
          bgColor="bg-violet-500/10"
          status={aggregates.avgDuration > 120 ? "good" : aggregates.avgDuration < 30 ? "bad" : "neutral"}
          hint={aggregates.avgDuration > 120 ? "Quality time" : "Brief visits"}
        />
        <EngagementCard
          label="Pageviews"
          value={aggregates.totalPageviews.toLocaleString()}
          icon={<Activity className="h-5 w-5" />}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          status="neutral"
          hint="Last 30 days"
        />
        <EngagementCard
          label="Conversions"
          value={aggregates.totalConversions.toLocaleString()}
          icon={<Zap className="h-5 w-5" />}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          status={aggregates.totalConversions > 0 ? "good" : "neutral"}
          hint={aggregates.totalConversions > 0 ? "Being tracked" : "Pending"}
        />
      </div>

      {/* ═══ SECTION F: SMART INSIGHTS ═══ */}
      {insights.length > 0 && (
        <Card className="rounded-xl border-primary/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    insight.color === "green" ? "bg-emerald-500/10 text-emerald-500" :
                    insight.color === "red" ? "bg-red-500/10 text-red-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {insight.icon === "up" ? <TrendingUp className="h-4 w-4" /> :
                     insight.icon === "down" ? <TrendingDown className="h-4 w-4" /> :
                     <Minus className="h-4 w-4" />}
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SECTION: LEADS VS TRAFFIC ═══ */}
      {leadsVsTraffic.length > 0 && crmData && crmData.totalLeads > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" /> Visitors vs Leads Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <AreaChart data={leadsVsTraffic} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="pil-fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pil-fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="visitors" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#pil-fillVisitors)" />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--chart-3))" strokeWidth={2.5} fill="url(#pil-fillLeads)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ DATA FRESHNESS FOOTER ═══ */}
      <Card className="rounded-xl bg-muted/30 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Data syncs automatically every 48 hours</p>
              <p className="text-[11px] text-muted-foreground">Powered by NextWeb Analytics Engine • Read-only client view</p>
            </div>
          </div>
          <SyncStatusBadge syncStatus={syncStatus} showDetail />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPerformanceIntelligencePage;

/* ═══ Sub-components ═══ */

const HeroEmpty = () => (
  <Card className="rounded-2xl overflow-hidden border-0 shadow-xl relative">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
    <CardContent className="p-6 md:p-10 relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Performance Intelligence Layer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time business growth insights powered by NextWeb</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SyncStatusBadge = ({
  syncStatus,
  showDetail = false,
}: {
  syncStatus: { last_sync_at: string | null; sync_status: string; error_message: string | null; next_sync_at: string | null } | null;
  showDetail?: boolean;
}) => {
  if (!syncStatus) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Awaiting first sync</span>
      </div>
    );
  }

  const isOk = syncStatus.sync_status === "synced";
  const isError = syncStatus.sync_status === "error" || syncStatus.sync_status === "failed";
  const lastSync = syncStatus.last_sync_at
    ? new Date(syncStatus.last_sync_at).toLocaleDateString("en-AU", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
        isOk ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
        isError ? "bg-red-500/10 text-red-500 border-red-500/20" :
        "bg-amber-500/10 text-amber-600 border-amber-500/20"
      }`}>
        {isOk ? <CheckCircle2 className="h-3 w-3" /> :
         isError ? <AlertCircle className="h-3 w-3" /> :
         <RefreshCw className="h-3 w-3" />}
        <span className="font-medium capitalize">{syncStatus.sync_status}</span>
      </div>
      {showDetail && lastSync && (
        <span className="text-[11px] text-muted-foreground">Last sync: {lastSync}</span>
      )}
    </div>
  );
};

const AnimatedKPI = ({
  label, sublabel, value, prefix = "", suffix = "", icon, color, bgColor, badge,
}: {
  label: string; sublabel?: string; value: number; prefix?: string; suffix?: string;
  icon: React.ReactNode; color: string; bgColor: string; badge?: React.ReactNode;
}) => (
  <div className="p-4 md:p-5 rounded-xl bg-background/90 backdrop-blur border border-border/60 shadow-sm hover:shadow-md transition-all animate-fade-in group">
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`p-2 rounded-lg ${bgColor} transition-transform group-hover:scale-110`}>
        <span className={color}>{icon}</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">{label}</span>
        {sublabel && <span className="text-[10px] text-muted-foreground/70">{sublabel}</span>}
      </div>
    </div>
    <p className={`text-2xl md:text-3xl font-extrabold tracking-tight ${color}`}>
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
    <CardContent className="p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-extrabold mb-1.5">{value}</p>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          status === "good" ? "bg-emerald-500" : status === "bad" ? "bg-red-500" : "bg-amber-500"
        }`} />
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
    </CardContent>
  </Card>
);

function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds + "s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
