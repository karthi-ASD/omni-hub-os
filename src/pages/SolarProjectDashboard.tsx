import { useSolarProjects, PIPELINE_STAGES } from "@/hooks/useSolarProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Sun, Zap, CheckCircle, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--neon-blue))", "hsl(var(--neon-green))", "hsl(var(--neon-orange))"];

const SolarProjectDashboard = () => {
  const { projects, projectsByStage, loading } = useSolarProjects();

  const activeProjects = projects.filter(p => !["handover_completed"].includes(p.pipeline_stage || ""));
  const completedProjects = projects.filter(p => p.pipeline_stage === "handover_completed");
  const totalRevenue = completedProjects.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const totalKw = projects.reduce((s, p) => s + (p.system_size_kw || 0), 0);
  const completedKw = completedProjects.reduce((s, p) => s + (p.system_size_kw || 0), 0);
  const highPriority = projects.filter(p => p.priority === "high" || p.priority === "urgent").length;

  const stageChart = PIPELINE_STAGES.map(s => ({
    name: s.label.replace(/ /g, "\n"),
    short: s.label.split(" ").slice(0, 2).join(" "),
    count: projectsByStage[s.key]?.length || 0,
  }));

  const priorityChart = [
    { name: "Urgent", value: projects.filter(p => p.priority === "urgent").length },
    { name: "High", value: projects.filter(p => p.priority === "high").length },
    { name: "Medium", value: projects.filter(p => p.priority === "medium").length },
    { name: "Low", value: projects.filter(p => p.priority === "low").length },
  ].filter(p => p.value > 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Project Dashboard" subtitle="Solar operations overview" icon={BarChart3} />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Project Dashboard" subtitle="Solar operations overview" icon={BarChart3} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Projects" value={projects.length} icon={Sun} gradient="from-primary to-accent" />
        <StatCard label="Active" value={activeProjects.length} icon={Clock} gradient="from-neon-blue to-info" />
        <StatCard label="Completed" value={completedProjects.length} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="High Priority" value={highPriority} icon={AlertTriangle} gradient="from-warning to-neon-orange" />
        <StatCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} icon={DollarSign} gradient="from-success to-neon-green" />
      </div>

      {/* Capacity stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Stage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageChart}>
                <XAxis dataKey="short" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Priority Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {priorityChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={priorityChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {priorityChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No projects yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Capacity summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <Zap className="h-8 w-8 mx-auto text-warning mb-2" />
            <p className="text-3xl font-bold">{totalKw.toFixed(1)} kW</p>
            <p className="text-xs text-muted-foreground">Total System Capacity</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-3xl font-bold">{completedKw.toFixed(1)} kW</p>
            <p className="text-xs text-muted-foreground">Installed Capacity</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-neon-green mb-2" />
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue from Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent projects */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader><CardTitle className="text-sm">Recent Projects</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {projects.slice(0, 10).map(p => {
              const stageInfo = PIPELINE_STAGES.find(s => s.key === (p.pipeline_stage || "new_project"));
              return (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.project_name}</p>
                    <p className="text-xs text-muted-foreground">{p.contact_name || "—"} · {p.system_size_kw ? `${p.system_size_kw} kW` : "—"}</p>
                  </div>
                  <Badge className={`text-[10px] ${stageInfo?.color || ""}`}>{stageInfo?.label || "—"}</Badge>
                  {p.estimated_value && <span className="text-xs font-medium">${p.estimated_value.toLocaleString()}</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolarProjectDashboard;
