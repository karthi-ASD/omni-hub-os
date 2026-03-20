import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTeamMetrics, useHourlyMetrics, useDailyMetrics, formatTalkTime } from "@/hooks/useDialerMetrics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Phone, PhoneForwarded, Clock, Brain, TrendingUp, Users, Trophy, BarChart3 } from "lucide-react";
import { startOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";

const COLORS = ["hsl(142 76% 36%)", "hsl(221 83% 53%)", "hsl(45 93% 47%)", "hsl(0 84% 60%)", "hsl(280 67% 50%)", "hsl(20 90% 48%)"];

export default function DialerTeamDashboardPage() {
  usePageTitle("Team Call Dashboard");
  const { roles } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const [range, setRange] = useState("today");

  const isManager = roles.some(r => ["super_admin", "business_admin", "admin", "sales_manager"].includes(r));

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "yesterday": return { from: startOfDay(subDays(now, 1)), to: startOfDay(now) };
      case "7days": return { from: subDays(now, 7), to: now };
      case "30days": return { from: subDays(now, 30), to: now };
      case "week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
      case "month": return { from: startOfMonth(now), to: now };
      default: return { from: startOfDay(now), to: now };
    }
  }, [range]);

  const { data: team } = useTeamMetrics(dateRange.from, dateRange.to);
  const { data: hourly } = useHourlyMetrics(null, dateRange.from, dateRange.to);
  const { data: daily } = useDailyMetrics(null, dateRange.from, dateRange.to);

  if (!canAccessDialer) return <Navigate to="/sales-dashboard" replace />;
  if (!isManager) return <Navigate to="/sales/dialer/my-dashboard" replace />;

  const s = team?.summary || { total_calls: 0, connected_calls: 0, total_talk_time: 0, avg_ai_score: 0, recordings_count: 0, conversions: 0, active_callers: 0 };
  const agents = team?.agents || [];

  const hourlyData = (hourly || []).map((h: any) => ({ hour: `${h.hour}:00`, calls: h.total, connected: h.connected }));
  const dailyData = (daily || []).map((d: any) => ({ date: d.day, calls: d.total, connected: d.connected, conversions: d.conversions }));

  // Performance score for leaderboard
  const rankedAgents = agents.map((a: any) => {
    const connRate = a.total > 0 ? (a.connected / a.total) * 100 : 0;
    const convRate = a.connected > 0 ? (a.converted / a.connected) * 100 : 0;
    const score = Math.round(
      (Math.min(a.total, 50) / 50) * 30 +
      (connRate / 100) * 20 +
      (convRate / 100) * 25 +
      (Math.min(a.avg_ai_score, 100) / 100) * 15 +
      (a.callbacks > 0 ? 10 : 0)
    );
    return { ...a, score, connRate: Math.round(connRate), convRate: Math.round(convRate) };
  }).sort((a: any, b: any) => b.score - a.score);

  const dispositionData = [
    { name: "Interested", value: agents.reduce((s: number, a: any) => s + (a.interested || 0), 0) },
    { name: "Converted", value: agents.reduce((s: number, a: any) => s + (a.converted || 0), 0) },
    { name: "Callback", value: agents.reduce((s: number, a: any) => s + (a.callbacks || 0), 0) },
    { name: "Not Interested", value: agents.reduce((s: number, a: any) => s + (a.not_interested || 0), 0) },
    { name: "No Answer", value: agents.reduce((s: number, a: any) => s + (a.no_answer || 0), 0) },
    { name: "Failed", value: agents.reduce((s: number, a: any) => s + (a.failed || 0), 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Team Call Dashboard" subtitle="Team-wide dialer performance and leaderboard" icon={Users} />
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Total Calls" value={s.total_calls} icon={Phone} gradient="from-primary to-accent" />
        <StatCard label="Connected" value={s.connected_calls} icon={PhoneForwarded} gradient="from-emerald-500 to-green-600" />
        <StatCard label="Talk Time" value={formatTalkTime(s.total_talk_time)} icon={Clock} gradient="from-blue-500 to-sky-500" />
        <StatCard label="Avg AI Score" value={s.avg_ai_score} icon={Brain} gradient="from-purple-500 to-fuchsia-500" />
        <StatCard label="Recordings" value={s.recordings_count} icon={BarChart3} gradient="from-amber-500 to-yellow-500" />
        <StatCard label="Conversions" value={s.conversions} icon={TrendingUp} gradient="from-emerald-600 to-teal-500" />
        <StatCard label="Active Callers" value={s.active_callers} icon={Users} gradient="from-rose-500 to-pink-500" />
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Caller Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rankedAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No caller data for selected period</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead className="text-center">Calls</TableHead>
                    <TableHead className="text-center">Connected</TableHead>
                    <TableHead className="text-center">Talk Time</TableHead>
                    <TableHead className="text-center">Avg Dur.</TableHead>
                    <TableHead className="text-center">AI Score</TableHead>
                    <TableHead className="text-center">Conn %</TableHead>
                    <TableHead className="text-center">Conv %</TableHead>
                    <TableHead className="text-center">Converted</TableHead>
                    <TableHead className="text-center">Callbacks</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedAgents.map((a: any, i: number) => (
                    <TableRow key={a.user_id}>
                      <TableCell className="font-medium">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</TableCell>
                      <TableCell className="font-medium">{a.agent_name}</TableCell>
                      <TableCell className="text-center tabular-nums">{a.total}</TableCell>
                      <TableCell className="text-center tabular-nums">{a.connected}</TableCell>
                      <TableCell className="text-center tabular-nums">{formatTalkTime(a.talk_time)}</TableCell>
                      <TableCell className="text-center tabular-nums">{formatTalkTime(a.avg_duration)}</TableCell>
                      <TableCell className="text-center tabular-nums">{a.avg_ai_score}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${a.connRate >= 50 ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}>{a.connRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${a.convRate >= 20 ? "border-emerald-300 text-emerald-700" : ""}`}>{a.convRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{a.converted}</TableCell>
                      <TableCell className="text-center tabular-nums">{a.callbacks}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] ${a.score >= 70 ? "bg-emerald-500/15 text-emerald-700" : a.score >= 40 ? "bg-amber-500/15 text-amber-700" : "bg-muted text-muted-foreground"}`}>{a.score}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Calls by Hour</CardTitle></CardHeader>
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
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Trend</CardTitle></CardHeader>
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
                  <Line type="monotone" dataKey="conversions" stroke="hsl(45 93% 47%)" strokeWidth={2} name="Conversions" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Disposition */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Disposition Breakdown</CardTitle></CardHeader>
          <CardContent>
            {dispositionData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={dispositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {dispositionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {dispositionData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1">{d.name}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Talk time per caller */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Talk Time by Caller</CardTitle></CardHeader>
          <CardContent>
            {agents.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={agents.slice(0, 10).map((a: any) => ({ name: a.agent_name?.split(" ")[0], time: Math.round((a.talk_time || 0) / 60) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: number) => `${v} min`} />
                  <Bar dataKey="time" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
