import { useEmployeeWorkloads } from "@/hooks/useEmployeeWorkloads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Users, BarChart2, AlertTriangle, TrendingUp } from "lucide-react";

const WorkloadMonitorPage = () => {
  const { workloads, loading } = useEmployeeWorkloads();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const avgProductivity = workloads.length > 0 ? Math.round(workloads.reduce((a, w) => a + w.productivity_score, 0) / workloads.length) : 0;
  const overloaded = workloads.filter(w => w.current_tasks >= w.task_capacity).length;
  const totalOverdue = workloads.reduce((a, w) => a + w.overdue_tasks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Workload Monitor</h1>
        <p className="text-muted-foreground">Track task capacity and productivity across your team</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Total Staff</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{workloads.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Avg Productivity</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgProductivity}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Overloaded</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{overloaded}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><BarChart2 className="h-4 w-4" /> Total Overdue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{totalOverdue}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Capacity</TableHead>
            <TableHead>Active</TableHead><TableHead>Completed</TableHead><TableHead>Overdue</TableHead>
            <TableHead>Available</TableHead><TableHead>Workload</TableHead><TableHead>Productivity</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {workloads.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
            ) : workloads.map(w => {
              const utilization = w.task_capacity > 0 ? Math.round((w.current_tasks / w.task_capacity) * 100) : 0;
              return (
                <TableRow key={w.id}>
                  <TableCell>
                    <div><span className="font-medium">{w.full_name}</span></div>
                    <span className="text-xs text-muted-foreground font-mono">{w.employee_code}</span>
                  </TableCell>
                  <TableCell>{w.departments?.name || "—"}</TableCell>
                  <TableCell>{w.task_capacity}</TableCell>
                  <TableCell><Badge variant="secondary">{w.current_tasks}</Badge></TableCell>
                  <TableCell><Badge variant="default">{w.completed_tasks}</Badge></TableCell>
                  <TableCell>{w.overdue_tasks > 0 ? <Badge variant="destructive">{w.overdue_tasks}</Badge> : "0"}</TableCell>
                  <TableCell><Badge variant={w.available_capacity > 0 ? "outline" : "destructive"}>{w.available_capacity}</Badge></TableCell>
                  <TableCell className="w-[120px]">
                    <div className="space-y-1">
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                      <span className="text-[10px] text-muted-foreground">{utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.productivity_score >= 70 ? "default" : w.productivity_score >= 40 ? "secondary" : "destructive"}>
                      {w.productivity_score}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default WorkloadMonitorPage;
