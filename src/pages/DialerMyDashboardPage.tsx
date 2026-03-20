import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCallerMetrics, useHourlyMetrics, useDailyMetrics, formatTalkTime } from "@/hooks/useDialerMetrics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Phone, PhoneForwarded, PhoneOff, Clock, Brain, TrendingUp, Headphones, Calendar } from "lucide-react";

const DISPOSITION_COLORS = ["hsl(142 76% 36%)", "hsl(0 84% 60%)", "hsl(45 93% 47%)", "hsl(221 83% 53%)", "hsl(280 67% 50%)", "hsl(20 90% 48%)"];

export default function DialerMyDashboardPage() {
  usePageTitle("My Call Dashboard");
  const { profile } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const { data: metrics } = useCallerMetrics(period);
  const { data: hourly } = useHourlyMetrics(profile?.user_id);
  const { data: daily } = useDailyMetrics(profile?.user_id);

  if (!canAccessDialer) return <Navigate to="/sales-dashboard" replace />;

  const m = metrics || {
    total_calls: 0, connected_calls: 0, ended_calls: 0, failed_calls: 0,
    busy_calls: 0, no_answer_calls: 0, total_talk_time: 0, avg_duration: 0,
    avg_ai_score: 0, recordings_count: 0, interested_count: 0, converted_count: 0,
    callback_count: 0, not_interested_count: 0, wrong_number_count: 0,
  };

  const connectionRate = m.total_calls > 0 ? Math.round((m.connected_calls / m.total_calls) * 100) : 0;
  const conversionRate = m.connected_calls > 0 ? Math.round((m.converted_count / m.connected_calls) * 100) : 0;

  const dispositionData = [
    { name: "Interested", value: m.interested_count },
    { name: "Converted", value: m.converted_count },
    { name: "Callback", value: m.callback_count },
    { name: "Not Interested", value: m.not_interested_count },
    { name: "No Answer", value: m.no_answer_calls },
    { name: "Wrong #", value: m.wrong_number_count },
  ].filter(d => d.value > 0);

  const hourlyData = (hourly || []).map((h: any) => ({
    hour: `${h.hour}:00`,
    calls: h.total,
    connected: h.connected,
  }));

  const dailyData = (daily || []).map((d: any) => ({
    date: d.day,
    calls: d.total,
    connected: d.connected,
    conversions: d.conversions,
  }));

  // Best hour
  const bestHour = hourlyData.reduce((best: any, cur: any) => (!best || cur.calls > best.calls) ? cur : best, null);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Call Dashboard" subtitle={`Personal performance for ${profile?.full_name || "you"}`} icon={Headphones} />

      <Tabs value={period} onValueChange={v => setPeriod(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Total Calls" value={m.total_calls} icon={Phone} gradient="from-primary to-accent" />
        <StatCard label="Connected" value={m.connected_calls} icon={PhoneForwarded} gradient="from-emerald-500 to-green-600" />
        <StatCard label="Talk Time" value={formatTalkTime(m.total_talk_time)} icon={Clock} gradient="from-blue-500 to-sky-500" />
        <StatCard label="Avg Duration" value={formatTalkTime(m.avg_duration)} icon={Clock} gradient="from-amber-500 to-yellow-500" />
        <StatCard label="AI Score" value={m.avg_ai_score} icon={Brain} gradient="from-purple-500 to-fuchsia-500" />
        <StatCard label="Conversions" value={m.converted_count} icon={TrendingUp} gradient="from-emerald-600 to-teal-500" />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Connection Rate</p>
          <p className="text-2xl font-bold tabular-nums">{connectionRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold tabular-nums">{conversionRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold tabular-nums">{m.failed_calls}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Recordings</p>
          <p className="text-2xl font-bold tabular-nums">{m.recordings_count}</p>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Calls by Hour (Today)</CardTitle></CardHeader>
          <CardContent>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="connected" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Connected" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No hourly data yet</p>}
            {bestHour && <p className="text-xs text-muted-foreground mt-1">Best hour: <span className="font-medium text-foreground">{bestHour.hour}</span> ({bestHour.calls} calls)</p>}
          </CardContent>
        </Card>

        {/* Daily */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Calls by Day</CardTitle></CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" dot={false} />
                  <Line type="monotone" dataKey="connected" stroke="hsl(142 76% 36%)" strokeWidth={2} name="Connected" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No daily data yet</p>}
          </CardContent>
        </Card>

        {/* Disposition Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Disposition Breakdown</CardTitle></CardHeader>
          <CardContent>
            {dispositionData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={dispositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {dispositionData.map((_, i) => <Cell key={i} fill={DISPOSITION_COLORS[i % DISPOSITION_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {dispositionData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: DISPOSITION_COLORS[i % DISPOSITION_COLORS.length] }} />
                      <span className="flex-1">{d.name}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No dispositions yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
