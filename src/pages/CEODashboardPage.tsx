import { useCEODashboard } from "@/hooks/useCEODashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Building2, Briefcase, Target, FolderKanban, Ticket, ListChecks,
  DollarSign, TrendingUp, Clock, AlertTriangle, Brain, Sparkles, Activity,
  RefreshCw, Shield, Heart, BarChart2, CalendarDays, CheckCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#6366f1", "#f59e0b", "#10b981"];

const CEODashboardPage = () => {
  const {
    metrics: m, deptProductivity, topEmployees, recentEvents,
    loading, aiInsights, aiLoading, fetchAIInsights,
  } = useCEODashboard();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const severityColor = (s: string) => s === "critical" ? "destructive" : s === "warning" ? "secondary" : "outline";
  const categoryIcon = (c: string) => {
    switch (c) {
      case "risk": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "growth": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "revenue": return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case "client_health": return <Heart className="h-4 w-4 text-pink-600" />;
      case "operations": return <Building2 className="h-4 w-4 text-blue-600" />;
      default: return <BarChart2 className="h-4 w-4 text-primary" />;
    }
  };

  const deptChartData = deptProductivity.map(d => ({ name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name, completed: d.completed, pending: d.pending }));
  const deptPieData = deptProductivity.map(d => ({ name: d.name, value: d.employees }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> AI CEO Dashboard
          </h1>
          <p className="text-muted-foreground">Executive command center — company-wide intelligence</p>
        </div>
        <Button onClick={fetchAIInsights} disabled={aiLoading} size="sm" variant="outline">
          <Sparkles className="h-4 w-4 mr-1" />
          {aiLoading ? "Analyzing…" : "Generate AI Insights"}
        </Button>
      </div>

      {/* AI Health Score Banner */}
      {aiInsights && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{aiInsights.health_score}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">Business Health Score</p>
                <p className="text-sm text-muted-foreground mt-1">{aiInsights.executive_summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Employees", value: m.totalEmployees, icon: Users, color: "text-blue-600" },
          { label: "Departments", value: m.totalDepartments, icon: Building2, color: "text-indigo-600" },
          { label: "Active Clients", value: m.activeClients, icon: Briefcase, color: "text-purple-600" },
          { label: "Total Leads", value: m.totalLeads, icon: Target, color: "text-orange-600" },
          { label: "Open Deals", value: m.openDeals, icon: FolderKanban, color: "text-cyan-600" },
          { label: "Deals Won (Month)", value: m.dealsClosedMonth, icon: CheckCircle, color: "text-green-600" },
          { label: "Revenue (Month)", value: `$${(m.revenueMonth / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-emerald-600" },
          { label: "Open Tickets", value: m.openTickets, icon: Ticket, color: "text-red-600" },
          { label: "Tasks Done Today", value: m.tasksCompletedToday, icon: ListChecks, color: "text-green-600" },
          { label: "Tasks Pending", value: m.tasksPending, icon: Clock, color: "text-yellow-600" },
          { label: "Renewals Due", value: m.renewalsDue, icon: CalendarDays, color: "text-pink-600" },
          { label: "Leave Pending", value: m.leavePending, icon: Shield, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Productivity Chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Department Productivity</CardTitle></CardHeader>
              <CardContent>
                {deptChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={deptChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill="hsl(var(--muted-foreground))" name="Pending" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">No department data</p>}
              </CardContent>
            </Card>

            {/* Team Distribution Pie */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Team Distribution</CardTitle></CardHeader>
              <CardContent>
                {deptPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={deptPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {deptPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">No data</p>}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Quick View */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top Performers</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {topEmployees.slice(0, 5).map((e, i) => (
                  <div key={e.code} className="text-center p-3 rounded-lg bg-secondary/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1 font-bold text-primary text-sm">#{i + 1}</div>
                    <p className="text-xs font-medium truncate">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground">{e.department}</p>
                    <p className="text-sm font-bold text-primary mt-1">{e.completed} tasks</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <div className="space-y-3">
            {deptProductivity.map((d, i) => {
              const total = d.completed + d.pending;
              const rate = total > 0 ? Math.round((d.completed / total) * 100) : 0;
              return (
                <Card key={d.name}>
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{d.name}</span>
                        <Badge variant="outline">{d.employees} staff</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={rate} className="h-2 flex-1 max-w-[200px]" />
                        <span className="text-sm font-medium">{rate}%</span>
                        <span className="text-xs text-muted-foreground">{d.completed} done · {d.pending} pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {deptProductivity.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No departments</CardContent></Card>}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>#</TableHead><TableHead>Employee</TableHead><TableHead>Department</TableHead>
                  <TableHead className="text-center">Completed</TableHead><TableHead className="text-center">Pending</TableHead>
                  <TableHead>Productivity</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {topEmployees.map((e, i) => {
                    const total = e.completed + e.pending;
                    const pct = total > 0 ? Math.round((e.completed / total) * 100) : 0;
                    return (
                      <TableRow key={e.code}>
                        <TableCell className="font-bold text-primary">{i + 1}</TableCell>
                        <TableCell><span className="font-medium">{e.name}</span><div className="text-xs text-muted-foreground">{e.code}</div></TableCell>
                        <TableCell>{e.department}</TableCell>
                        <TableCell className="text-center font-medium text-green-600">{e.completed}</TableCell>
                        <TableCell className="text-center text-yellow-600">{e.pending}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><Progress value={pct} className="h-2 w-16" /><span className="text-xs">{pct}%</span></div></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          {!aiInsights ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">AI Business Insights</h3>
                <p className="text-sm text-muted-foreground mb-4">Click "Generate AI Insights" to analyze your business data with AI</p>
                <Button onClick={fetchAIInsights} disabled={aiLoading}>
                  <Sparkles className="h-4 w-4 mr-1" /> {aiLoading ? "Analyzing…" : "Generate Insights"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {aiInsights.insights.map((insight, i) => (
                <Card key={i} className={insight.severity === "critical" ? "border-destructive/40" : insight.severity === "warning" ? "border-yellow-500/40" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {categoryIcon(insight.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{insight.title}</span>
                          <Badge variant={severityColor(insight.severity) as any} className="text-[10px]">{insight.severity}</Badge>
                          <Badge variant="outline" className="text-[10px]">{insight.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        <p className="text-xs text-primary mt-1 font-medium">→ {insight.recommended_action}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Event</TableHead><TableHead>Details</TableHead><TableHead>Time</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentEvents.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No recent events</TableCell></TableRow>
                  ) : recentEvents.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{e.event_type?.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {typeof e.payload_json === "object" ? JSON.stringify(e.payload_json).slice(0, 80) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.created_at ? format(new Date(e.created_at), "dd MMM HH:mm") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CEODashboardPage;
