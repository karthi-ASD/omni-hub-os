import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTeamMetrics, useHourlyMetrics, useDailyMetrics, useCallerMetrics, formatTalkTime } from "@/hooks/useDialerMetrics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { startOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";

export default function DialerAnalyticsPage() {
  usePageTitle("Call Analytics");
  const { roles } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const [range, setRange] = useState("7days");

  const isManager = roles.some(r => ["super_admin", "business_admin", "admin", "sales_manager"].includes(r));

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "today": return { from: startOfDay(now), to: now };
      case "week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
      case "7days": return { from: subDays(now, 7), to: now };
      case "30days": return { from: subDays(now, 30), to: now };
      case "month": return { from: startOfMonth(now), to: now };
      default: return { from: subDays(now, 7), to: now };
    }
  }, [range]);

  const { data: team } = useTeamMetrics(dateRange.from, dateRange.to);
  const { data: hourly } = useHourlyMetrics(null, dateRange.from, dateRange.to);
  const { data: daily } = useDailyMetrics(null, dateRange.from, dateRange.to);

  if (!canAccessDialer) return <Navigate to="/sales-dashboard" replace />;

  const agents = team?.agents || [];
  const hourlyData = (hourly || []).map((h: any) => ({ hour: `${h.hour}:00`, total: h.total, connected: h.connected, talk: Math.round(h.talk_time / 60) }));
  const dailyData = (daily || []).map((d: any) => ({ date: d.day, total: d.total, connected: d.connected, conversions: d.conversions, aiScore: d.avg_ai_score, recordings: d.recordings }));

  // Top/bottom performers
  const sortedByConv = [...agents].sort((a: any, b: any) => b.converted - a.converted);
  const sortedByConn = [...agents].sort((a: any, b: any) => {
    const rateA = a.total > 0 ? a.connected / a.total : 0;
    const rateB = b.total > 0 ? b.connected / b.total : 0;
    return rateA - rateB;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Call Analytics" subtitle="Deep analytics across all dialer activity" icon={BarChart3} />
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Call Volume Trend */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Call Volume Trend</CardTitle></CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.1)" strokeWidth={2} name="Total Calls" />
                <Area type="monotone" dataKey="connected" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.1)" strokeWidth={2} name="Connected" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No data for this period</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Hour-by-Hour Activity</CardTitle></CardHeader>
          <CardContent>
            {hourlyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Calls" />
                    <Bar dataKey="connected" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Connected" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Hour</TableHead>
                        <TableHead className="text-xs text-center">Calls</TableHead>
                        <TableHead className="text-xs text-center">Connected</TableHead>
                        <TableHead className="text-xs text-center">Talk (min)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourlyData.map((h: any) => (
                        <TableRow key={h.hour}>
                          <TableCell className="text-xs">{h.hour}</TableCell>
                          <TableCell className="text-xs text-center tabular-nums">{h.total}</TableCell>
                          <TableCell className="text-xs text-center tabular-nums">{h.connected}</TableCell>
                          <TableCell className="text-xs text-center tabular-nums">{h.talk}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* AI Score & Conversion Trends */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">AI Score & Conversion Trend</CardTitle></CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="aiScore" stroke="hsl(280 67% 50%)" strokeWidth={2} name="AI Score" dot={false} />
                  <Line type="monotone" dataKey="conversions" stroke="hsl(142 76% 36%)" strokeWidth={2} name="Conversions" dot={false} />
                  <Line type="monotone" dataKey="recordings" stroke="hsl(45 93% 47%)" strokeWidth={2} name="Recordings" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Top Converters */}
        {isManager && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top Converters</CardTitle></CardHeader>
            <CardContent>
              {sortedByConv.length > 0 ? (
                <div className="space-y-2">
                  {sortedByConv.slice(0, 5).map((a: any, i: number) => (
                    <div key={a.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                        <span className="text-sm">{a.agent_name}</span>
                      </div>
                      <Badge variant="outline" className="tabular-nums text-[10px]">{a.converted} converted</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
            </CardContent>
          </Card>
        )}

        {/* Lowest Answer Rate */}
        {isManager && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Lowest Answer Rate (Coaching)</CardTitle></CardHeader>
            <CardContent>
              {sortedByConn.filter((a: any) => a.total >= 3).length > 0 ? (
                <div className="space-y-2">
                  {sortedByConn.filter((a: any) => a.total >= 3).slice(0, 5).map((a: any) => {
                    const rate = a.total > 0 ? Math.round((a.connected / a.total) * 100) : 0;
                    return (
                      <div key={a.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                        <span className="text-sm">{a.agent_name}</span>
                        <Badge variant="outline" className={`tabular-nums text-[10px] ${rate < 30 ? "border-destructive text-destructive" : "border-amber-300 text-amber-700"}`}>{rate}% answer rate</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-4">Not enough data</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
