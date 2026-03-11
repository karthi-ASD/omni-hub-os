import { useState, useMemo } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useClientReports } from "@/hooks/useClientReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, MapPin, FileText, ArrowUp, ArrowDown, Minus,
  Users, MousePointerClick, Search, Phone, Eye,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, subMonths, parseISO, isAfter } from "date-fns";

type TimeRange = "week" | "month" | "campaign";

const ClientReportsPage = () => {
  usePageTitle("My Reports");
  const { monthlyReports, seoReports, dailyMetrics, keywords, loading } = useClientReports();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Filter metrics by time range
  const filteredMetrics = useMemo(() => {
    if (!dailyMetrics.length) return [];
    const cutoff =
      timeRange === "week" ? subDays(new Date(), 7) :
      timeRange === "month" ? subMonths(new Date(), 1) :
      subMonths(new Date(), 6);
    return dailyMetrics.filter((m) => isAfter(parseISO(m.date), cutoff));
  }, [dailyMetrics, timeRange]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalSessions = filteredMetrics.reduce((s, m) => s + (m.sessions ?? 0), 0);
    const totalLeads = filteredMetrics.reduce((s, m) => s + (m.leads_count ?? 0), 0);
    const totalClicks = filteredMetrics.reduce((s, m) => s + (m.gsc_clicks ?? 0), 0);
    const totalCalls = filteredMetrics.reduce((s, m) => s + (m.calls_count ?? 0) + (m.gbp_calls ?? 0), 0);
    return { totalSessions, totalLeads, totalClicks, totalCalls };
  }, [filteredMetrics]);

  // Chart data
  const trafficChartData = useMemo(() =>
    filteredMetrics.map((m) => ({
      date: format(parseISO(m.date), "MMM d"),
      Sessions: m.sessions ?? 0,
      Clicks: m.gsc_clicks ?? 0,
      Leads: m.leads_count ?? 0,
    })), [filteredMetrics]);

  // Keyword movements
  const keywordMovements = useMemo(() =>
    keywords.filter((k) => k.current_ranking != null).map((k) => ({
      ...k,
      change: (k.previous_ranking ?? k.current_ranking!) - k.current_ranking!,
    })).sort((a, b) => b.change - a.change),
  [keywords]);

  // Top locations from keywords
  const topLocations = useMemo(() => {
    const locMap: Record<string, number> = {};
    keywords.forEach((k) => {
      const loc = k.location || "Unknown";
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    return Object.entries(locMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [keywords]);

  // Top services from keyword_type
  const topServices = useMemo(() => {
    const svcMap: Record<string, number> = {};
    keywords.forEach((k) => {
      const svc = k.keyword_type || "General";
      svcMap[svc] = (svcMap[svc] || 0) + 1;
    });
    return Object.entries(svcMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [keywords]);

  const RankingArrow = ({ change }: { change: number }) => {
    if (change > 0) return <span className="flex items-center gap-0.5 text-green-600"><ArrowUp className="h-3 w-3" />{change}</span>;
    if (change < 0) return <span className="flex items-center gap-0.5 text-red-500"><ArrowDown className="h-3 w-3" />{Math.abs(change)}</span>;
    return <span className="flex items-center gap-0.5 text-muted-foreground"><Minus className="h-3 w-3" />0</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Reports</h1>
            <p className="text-xs text-muted-foreground">
              {monthlyReports.length} monthly reports · {seoReports.length} campaign reports
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {([
          { value: "week", label: "Last 7 Days" },
          { value: "month", label: "Last 30 Days" },
          { value: "campaign", label: "Last 6 Months" },
        ] as { value: TimeRange; label: string }[]).map((t) => (
          <Button
            key={t.value}
            variant={timeRange === t.value ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setTimeRange(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sessions", value: stats.totalSessions, icon: Users, color: "text-blue-500" },
          { label: "GSC Clicks", value: stats.totalClicks, icon: MousePointerClick, color: "text-green-500" },
          { label: "Leads", value: stats.totalLeads, icon: TrendingUp, color: "text-primary" },
          { label: "Calls", value: stats.totalCalls, icon: Phone, color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="traffic">
        <TabsList className="w-full grid grid-cols-5 h-9">
          <TabsTrigger value="traffic" className="text-xs"><Eye className="h-3.5 w-3.5 mr-1" />Traffic</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs"><TrendingUp className="h-3.5 w-3.5 mr-1" />Leads</TabsTrigger>
          <TabsTrigger value="keywords" className="text-xs"><Search className="h-3.5 w-3.5 mr-1" />Keywords</TabsTrigger>
          <TabsTrigger value="services" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-1" />Services</TabsTrigger>
          <TabsTrigger value="locations" className="text-xs"><MapPin className="h-3.5 w-3.5 mr-1" />Locations</TabsTrigger>
        </TabsList>

        {/* Traffic Trends */}
        <TabsContent value="traffic" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Traffic Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trafficChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No traffic data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Sessions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Clicks" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Generated */}
        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Leads Generated</CardTitle>
            </CardHeader>
            <CardContent>
              {trafficChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lead data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keyword Movements */}
        <TabsContent value="keywords" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Keyword Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {keywordMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No keyword data available yet</p>
              ) : (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">
                    <div className="col-span-5">Keyword</div>
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-2 text-center">Change</div>
                    <div className="col-span-3">Location</div>
                  </div>
                  {keywordMovements.slice(0, 30).map((k) => (
                    <div key={k.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                      <div className="col-span-5 text-sm font-medium text-foreground truncate">{k.keyword}</div>
                      <div className="col-span-2 text-center">
                        <Badge variant="outline" className="text-xs">{k.current_ranking ?? "—"}</Badge>
                      </div>
                      <div className="col-span-2 text-center text-xs">
                        <RankingArrow change={k.change} />
                      </div>
                      <div className="col-span-3 text-xs text-muted-foreground truncate">{k.location || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performing Services */}
        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Performing Services</CardTitle>
            </CardHeader>
            <CardContent>
              {topServices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No service data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topServices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Keywords" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performing Locations */}
        <TabsContent value="locations" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Performing Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {topLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No location data available yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topLocations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Keywords" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Monthly Reports List */}
      {monthlyReports.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Monthly Reports
          </h2>
          <div className="space-y-2">
            {monthlyReports.map((r) => (
              <Card key={r.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.report_month}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Generated {format(parseISO(r.generated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  {r.report_pdf_url && (
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <a href={r.report_pdf_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3.5 w-3.5 mr-1" /> View PDF
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientReportsPage;
