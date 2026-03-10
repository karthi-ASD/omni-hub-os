import { useAgencyCommandCenter } from "@/hooks/useAgencyCommandCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Briefcase, ListChecks, Users, AlertTriangle, TrendingUp, Clock, Shield, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AgencyCommandCenterPage = () => {
  const { projects, tasks, slaItems, loading, stats } = useAgencyCommandCenter();

  const statusColor = (s: string) => {
    switch (s) { case "completed": return "default"; case "in_progress": return "secondary"; case "breached": case "overdue": return "destructive"; case "at_risk": return "outline"; default: return "outline"; }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const taskStatusData = [
    { name: "New", value: tasks.filter(t => t.status === "new").length },
    { name: "In Progress", value: stats.tasksInProgress },
    { name: "Completed", value: stats.tasksCompleted },
    { name: "Overdue", value: stats.tasksOverdue },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Command Center</h1>
        <p className="text-muted-foreground">Centralized operational overview of all projects, tasks, and SLAs</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-4 w-4" /> Total Projects</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalProjects}</div><p className="text-xs text-muted-foreground">{stats.activeProjects} active</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><ListChecks className="h-4 w-4" /> Total Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalTasks}</div><p className="text-xs text-muted-foreground">{stats.tasksInProgress} in progress</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> SLA Issues</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.slaBreached}</div><p className="text-xs text-muted-foreground">{stats.slaAtRisk} at risk</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Employees</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalEmployees}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Completed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats.tasksCompleted}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{stats.tasksOverdue}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><BarChart2 className="h-4 w-4" /> Completion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Shield className="h-4 w-4" /> SLA Score</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{slaItems.length > 0 ? Math.round(((slaItems.length - stats.slaBreached) / slaItems.length) * 100) : 100}%</div></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Projects by Department</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.projectsByDepartment}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Task Status Distribution</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskStatusData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Recent Projects</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
          <TabsTrigger value="sla">SLA Status</TabsTrigger>
        </TabsList>
        <TabsContent value="projects">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Client</TableHead><TableHead>Service</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Start</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {projects.slice(0, 10).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.client_name}</TableCell>
                    <TableCell>{p.service_type?.replace(/_/g, " ")}</TableCell>
                    <TableCell>{p.departments?.name || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(p.status)}>{p.status?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{p.start_date || "—"}</TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No projects yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="tasks">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Task</TableHead><TableHead>Project</TableHead><TableHead>Assigned</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {tasks.slice(0, 10).map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.title}</TableCell>
                    <TableCell>{t.client_projects?.client_name || "—"}</TableCell>
                    <TableCell>{t.hr_employees?.full_name || "—"}</TableCell>
                    <TableCell><Badge variant={t.priority === "urgent" ? "destructive" : "outline"}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant={statusColor(t.status)}>{t.status?.replace(/_/g, " ")}</Badge></TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tasks yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="sla">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Project</TableHead><TableHead>Task</TableHead><TableHead>Department</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {slaItems.slice(0, 10).map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.client_projects?.client_name || "—"}</TableCell>
                    <TableCell>{s.project_tasks?.title || "—"}</TableCell>
                    <TableCell>{s.departments?.name || "—"}</TableCell>
                    <TableCell>{s.deadline_at ? new Date(s.deadline_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(s.computed_status || s.status)}>{(s.computed_status || s.status)?.replace(/_/g, " ")}</Badge></TableCell>
                  </TableRow>
                ))}
                {slaItems.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No SLA items</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyCommandCenterPage;
