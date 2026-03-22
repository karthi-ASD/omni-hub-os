import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallerMetrics, useHourlyMetrics, useDailyMetrics, formatTalkTime } from "@/hooks/useDialerMetrics";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CallDetailDrawer } from "@/components/dialer/CallDetailDrawer";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Phone, PhoneForwarded, Clock, Brain, TrendingUp, Headphones, Play, Mic, Target } from "lucide-react";
import { format } from "date-fns";

const DISPOSITION_COLORS = ["hsl(142 76% 36%)", "hsl(0 84% 60%)", "hsl(45 93% 47%)", "hsl(221 83% 53%)", "hsl(280 67% 50%)", "hsl(20 90% 48%)"];

const STATUS_BADGE_COLORS: Record<string, string> = {
  ended: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  connected: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  busy: "bg-amber-500/10 text-amber-700 border-amber-200",
  "no-answer": "bg-muted text-muted-foreground border-border",
};

export default function DialerMyDashboardPage() {
  usePageTitle("My Call Dashboard");
  const { profile } = useAuth();
  const { canAccessDialer } = useDialerAccess();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: metrics } = useCallerMetrics(period);
  const { data: hourly } = useHourlyMetrics(profile?.user_id);
  const { data: daily } = useDailyMetrics(profile?.user_id);

  // Recent calls list
  const { data: recentCalls } = useQuery({
    queryKey: ["my-recent-calls", profile?.business_id, profile?.user_id, period],
    queryFn: async () => {
      const { data } = await supabase
        .from("dialer_sessions")
        .select("id, phone_number, call_status, call_duration, ai_score, ai_summary, created_at, disposition, recording_url, lead_id, notes")
        .eq("business_id", profile!.business_id!)
        .eq("user_id", profile!.user_id!)
        .order("created_at", { ascending: false })
        .limit(25);
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Fetch lead names for recent calls
  const leadIds = [...new Set((recentCalls || []).filter((c: any) => c.lead_id).map((c: any) => c.lead_id))];
  const { data: leads } = useQuery({
    queryKey: ["my-calls-leads", leadIds.join(",")],
    queryFn: async () => {
      if (!leadIds.length) return {};
      const { data } = await supabase.from("leads").select("id, name, company_name").in("id", leadIds);
      const map: Record<string, any> = {};
      (data || []).forEach((l: any) => { map[l.id] = l; });
      return map;
    },
    enabled: leadIds.length > 0,
  });

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
        <StatCard label="Connect Rate" value={`${connectionRate}%`} icon={Target} gradient="from-amber-500 to-yellow-500" />
        <StatCard label="AI Score" value={m.avg_ai_score} icon={Brain} gradient="from-purple-500 to-fuchsia-500" />
        <StatCard label="Conversions" value={m.converted_count} icon={TrendingUp} gradient="from-emerald-600 to-teal-500" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Duration</p>
          <p className="text-2xl font-bold tabular-nums">{formatTalkTime(m.avg_duration)}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Conversion Rate</p>
          <p className="text-2xl font-bold tabular-nums">{conversionRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Recordings</p>
          <p className="text-2xl font-bold tabular-nums">{m.recordings_count}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 text-center">
          <p className="text-xs text-muted-foreground">Interested</p>
          <p className="text-2xl font-bold tabular-nums">{m.interested_count}</p>
        </CardContent></Card>
      </div>

      {/* Recent Calls Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" /> Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!recentCalls?.length ? (
            <div className="py-12 text-center">
              <Phone className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No calls yet. Start dialing!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Disposition</TableHead>
                    <TableHead className="text-xs">AI</TableHead>
                    <TableHead className="text-xs">Rec</TableHead>
                    <TableHead className="text-xs">Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.map((call: any) => {
                    const lead = leads?.[call.lead_id];
                    return (
                      <TableRow
                        key={call.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSession(call.id)}
                      >
                        <TableCell className="text-xs whitespace-nowrap tabular-nums">
                          {format(new Date(call.created_at), "h:mm a")}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {lead ? (
                              <p className="text-xs font-medium">{lead.name}</p>
                            ) : null}
                            <p className="text-[10px] font-mono text-muted-foreground">{call.phone_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${STATUS_BADGE_COLORS[call.call_status] || ""}`}
                          >
                            {call.call_status?.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-xs">
                          {formatTalkTime(call.call_duration || 0)}
                        </TableCell>
                        <TableCell>
                          {call.disposition ? (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {call.disposition.replace("_", " ")}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {call.ai_score != null ? (
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3 text-primary" />
                              <span className="text-xs tabular-nums font-medium">{call.ai_score}</span>
                            </div>
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          {call.recording_url ? (
                            <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                              <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                                <Mic className="h-3 w-3 text-emerald-600" />
                              </a>
                            </Button>
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          {call.ai_summary ? (
                            <p className="text-[10px] text-muted-foreground truncate" title={call.ai_summary}>
                              {call.ai_summary}
                            </p>
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <CallDetailDrawer sessionId={selectedSession} open={!!selectedSession} onOpenChange={o => !o && setSelectedSession(null)} />
    </div>
  );
}
