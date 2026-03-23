import { useAdminOperations } from "@/hooks/useAdminOperations";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { CallbacksPanel } from "@/components/crm/CallbacksPanel";
import {
  Building2, Users, Briefcase, Target, FolderKanban, Ticket,
  ListChecks, CheckCircle, Clock, TrendingUp, BarChart2, Radio, PhoneForwarded,
} from "lucide-react";

const AdminOperationsDashboardPage = () => {
  const { metrics, departments, employeeActivities, loading } = useAdminOperations();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const m = metrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Operations Dashboard</h1>
        <p className="text-muted-foreground">Organization-wide visibility across all departments and employees</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Departments", value: m.totalDepartments, icon: Building2, color: "text-blue-600" },
          { label: "Employees", value: m.activeEmployees, icon: Users, color: "text-green-600" },
          { label: "Clients", value: m.totalClients, icon: Briefcase, color: "text-purple-600" },
          { label: "Leads", value: m.totalLeads, icon: Target, color: "text-orange-600" },
          { label: "Open Deals", value: m.openDeals, icon: FolderKanban, color: "text-cyan-600" },
          { label: "Open Tickets", value: m.openTickets, icon: Ticket, color: "text-red-600" },
          { label: "Pending Tasks", value: m.tasksPending, icon: Clock, color: "text-yellow-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments"><Building2 className="h-4 w-4 mr-1" /> Departments</TabsTrigger>
          <TabsTrigger value="employees"><Users className="h-4 w-4 mr-1" /> Employee Activity</TabsTrigger>
          <TabsTrigger value="workload"><BarChart2 className="h-4 w-4 mr-1" /> Workload Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.length === 0 ? (
              <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No departments found</CardContent></Card>
            ) : departments.map(d => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {d.name}
                    <Badge variant="outline">{d.employee_count} staff</Badge>
                  </CardTitle>
                  {d.manager_name && (
                    <p className="text-xs text-muted-foreground">Manager: {d.manager_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Tasks</span>
                    <span className="font-medium">{d.active_tasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-600">{d.completed_tasks}</span>
                  </div>
                  <Progress
                    value={d.active_tasks + d.completed_tasks > 0
                      ? (d.completed_tasks / (d.active_tasks + d.completed_tasks)) * 100
                      : 0}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {d.active_tasks + d.completed_tasks > 0
                      ? Math.round((d.completed_tasks / (d.active_tasks + d.completed_tasks)) * 100)
                      : 0}% completion
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Productivity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeActivities.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees</TableCell></TableRow>
                  ) : employeeActivities.map(e => {
                    const pct = e.tasks_assigned > 0 ? Math.round((e.tasks_completed / e.tasks_assigned) * 100) : 0;
                    return (
                      <TableRow key={e.employee_id}>
                        <TableCell className="font-medium">{e.full_name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                        <TableCell>{e.department_name || "—"}</TableCell>
                        <TableCell>{e.designation || "—"}</TableCell>
                        <TableCell className="text-center">{e.tasks_assigned}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">{e.tasks_completed}</TableCell>
                        <TableCell className="text-center text-yellow-600 font-medium">{e.tasks_pending}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 w-16" />
                            <span className="text-xs font-medium">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Active Tasks</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead>Workload Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeActivities.map(e => {
                    const level = e.tasks_pending > 10 ? "High" : e.tasks_pending > 5 ? "Medium" : "Low";
                    const levelColor = level === "High" ? "destructive" : level === "Medium" ? "secondary" : "outline";
                    return (
                      <TableRow key={e.employee_id}>
                        <TableCell className="font-medium">{e.full_name}</TableCell>
                        <TableCell>{e.department_name || "—"}</TableCell>
                        <TableCell className="text-center">{e.tasks_pending}</TableCell>
                        <TableCell className="text-center">{e.tasks_completed}</TableCell>
                        <TableCell><Badge variant={levelColor as any}>{level}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOperationsDashboardPage;
