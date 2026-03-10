import { useAdminOperations } from "@/hooks/useAdminOperations";
import { useEmployeeSessions } from "@/hooks/useWorkforce";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Users, Activity, Clock } from "lucide-react";
import { format } from "date-fns";

const EmployeeActivityMonitorPage = () => {
  const { employeeActivities, loading } = useAdminOperations();
  const { sessions, loading: sessLoading } = useEmployeeSessions();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Activity Monitor</h1>
        <p className="text-muted-foreground">Track what each employee is working on and login activity</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Total Employees</p><p className="text-xl font-bold">{employeeActivities.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-green-600" /><div><p className="text-xs text-muted-foreground">Active Sessions Today</p><p className="text-xl font-bold">{sessions.filter(s => s.login_at?.startsWith(format(new Date(), "yyyy-MM-dd"))).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-600" /><div><p className="text-xs text-muted-foreground">Tasks Pending (All)</p><p className="text-xl font-bold">{employeeActivities.reduce((s, e) => s + e.tasks_pending, 0)}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Task Activity</TabsTrigger>
          <TabsTrigger value="logins">Login Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employee</TableHead><TableHead>Department</TableHead>
                <TableHead className="text-center">Assigned</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead>Productivity</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {employeeActivities.map(e => {
                  const pct = e.tasks_assigned > 0 ? Math.round((e.tasks_completed / e.tasks_assigned) * 100) : 0;
                  return (
                    <TableRow key={e.employee_id}>
                      <TableCell className="font-medium">{e.full_name}<div className="text-xs text-muted-foreground">{e.employee_code}</div></TableCell>
                      <TableCell>{e.department_name || "—"}</TableCell>
                      <TableCell className="text-center">{e.tasks_assigned}</TableCell>
                      <TableCell className="text-center text-green-600">{e.tasks_completed}</TableCell>
                      <TableCell className="text-center text-yellow-600">{e.tasks_pending}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Progress value={pct} className="h-2 w-16" /><span className="text-xs">{pct}%</span></div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Login At</TableHead><TableHead>Logout At</TableHead>
                <TableHead>Duration (min)</TableHead><TableHead>Method</TableHead><TableHead>IP</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {sessLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sessions recorded</TableCell></TableRow>
                ) : sessions.slice(0, 50).map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.login_at), "dd MMM HH:mm")}</TableCell>
                    <TableCell>{s.logout_at ? format(new Date(s.logout_at), "dd MMM HH:mm") : <Badge variant="default">Active</Badge>}</TableCell>
                    <TableCell>{s.session_duration_minutes ?? "—"}</TableCell>
                    <TableCell className="capitalize">{s.login_method}</TableCell>
                    <TableCell className="font-mono text-xs">{s.ip_address ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeActivityMonitorPage;
