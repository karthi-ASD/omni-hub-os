import { useAdminOperations } from "@/hooks/useAdminOperations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

const DepartmentPerformancePage = () => {
  const { departments, metrics, loading } = useAdminOperations();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const sorted = [...departments].sort((a, b) => {
    const aRate = a.active_tasks + a.completed_tasks > 0 ? a.completed_tasks / (a.active_tasks + a.completed_tasks) : 0;
    const bRate = b.active_tasks + b.completed_tasks > 0 ? b.completed_tasks / (b.active_tasks + b.completed_tasks) : 0;
    return bRate - aRate;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Performance</h1>
        <p className="text-muted-foreground">Cross-department performance comparison and ranking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Departments</p><p className="text-xl font-bold">{metrics.totalDepartments}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-green-600" /><div><p className="text-xs text-muted-foreground">Active Employees</p><p className="text-xl font-bold">{metrics.activeEmployees}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Tasks Completed Today</p><p className="text-xl font-bold">{metrics.tasksCompletedToday}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-600" /><div><p className="text-xs text-muted-foreground">Tasks Pending</p><p className="text-xl font-bold">{metrics.tasksPending}</p></div></div></CardContent></Card>
      </div>

      {/* Performance ranking cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Department Ranking</h2>
        {sorted.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No departments found</CardContent></Card>
        ) : sorted.map((d, i) => {
          const total = d.active_tasks + d.completed_tasks;
          const rate = total > 0 ? Math.round((d.completed_tasks / total) * 100) : 0;
          return (
            <Card key={d.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{d.name}</span>
                    <Badge variant="outline">{d.employee_count} staff</Badge>
                    {d.manager_name && <span className="text-xs text-muted-foreground">· Manager: {d.manager_name}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={rate} className="h-2 flex-1 max-w-[200px]" />
                    <span className="text-sm font-medium">{rate}% completion</span>
                    <span className="text-xs text-muted-foreground">{d.completed_tasks} done / {d.active_tasks} active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detailed Comparison</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Department</TableHead><TableHead>Manager</TableHead><TableHead className="text-center">Staff</TableHead>
              <TableHead className="text-center">Active Tasks</TableHead><TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Completion %</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {sorted.map(d => {
                const total = d.active_tasks + d.completed_tasks;
                const rate = total > 0 ? Math.round((d.completed_tasks / total) * 100) : 0;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.manager_name || "—"}</TableCell>
                    <TableCell className="text-center">{d.employee_count}</TableCell>
                    <TableCell className="text-center">{d.active_tasks}</TableCell>
                    <TableCell className="text-center text-green-600">{d.completed_tasks}</TableCell>
                    <TableCell className="text-center font-medium">{rate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentPerformancePage;
