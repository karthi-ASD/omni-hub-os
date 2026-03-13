import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useHRLeaveRequests } from "@/hooks/useHRLeave";
import { useHRPayroll } from "@/hooks/useHRPayroll";
import { useHRPerformance } from "@/hooks/useHRPerformance";
import { useHRTasks } from "@/hooks/useHRTasks";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, CalendarDays, DollarSign, Star, ListChecks, Building2,
  TrendingUp, AlertTriangle, UserPlus, UserCheck, UserMinus,
  Clock, Briefcase, Activity, ArrowRight,
} from "lucide-react";
import { format, subMonths, isAfter, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const DEPT_COLORS = [
  "hsl(var(--primary))",
  "hsl(220, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(350, 65%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(45, 85%, 50%)",
  "hsl(120, 50%, 45%)",
];

const HRAnalyticsDashboardPage = () => {
  const { employees } = useHREmployees();
  const { departments } = useHRDepartments();
  const { requests: leaveRequests } = useHRLeaveRequests();
  const { records: payroll } = useHRPayroll();
  const { reviews } = useHRPerformance();
  const { tasks } = useHRTasks();
  const { isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const navigate = useNavigate();

  const activeEmps = employees.filter(e => e.employment_status === "active");
  const inactiveEmps = employees.filter(e => ["inactive", "terminated", "suspended", "resigned"].includes(e.employment_status));
  const onLeaveToday = leaveRequests.filter(r => {
    if (r.status !== "approved") return false;
    const today = format(new Date(), "yyyy-MM-dd");
    return r.start_date <= today && r.end_date >= today;
  });
  const newJoiners = employees.filter(e => {
    if (!e.joining_date) return false;
    return isAfter(parseISO(e.joining_date), subMonths(new Date(), 1));
  });
  const pendingLeaves = leaveRequests.filter(r => r.status === "pending").length;
  const totalPayroll = payroll.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const missingJobRoles = activeEmps.filter(e => !(e as any).job_role_description).length;

  // Department breakdown for chart
  const deptData = departments
    .map((d, i) => ({
      name: d.name,
      count: employees.filter(e => e.department_id === d.id && e.employment_status === "active").length,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  // Status breakdown for pie chart
  const statusData = [
    { name: "Active", value: activeEmps.length, fill: "hsl(160, 60%, 45%)" },
    { name: "On Leave", value: onLeaveToday.length, fill: "hsl(45, 85%, 50%)" },
    { name: "Inactive", value: inactiveEmps.length, fill: "hsl(350, 65%, 55%)" },
  ].filter(d => d.value > 0);

  // Recent activity (simulated from employees)
  const recentEmployees = employees
    .filter(e => e.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Workforce analytics & management overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/hr/employees")}>
            <Users className="h-4 w-4 mr-2" /> Employee Directory
          </Button>
          {(isSuperAdmin || isBusinessAdmin || isHRManager) && (
            <Button onClick={() => navigate("/hr/employees")}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold mt-1">{employees.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{activeEmps.length} active across {departments.filter(d => d.status === "active").length} departments</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{activeEmps.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={employees.length ? (activeEmps.length / employees.length) * 100 : 0} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Leave Today</p>
                <p className="text-3xl font-bold mt-1 text-amber-600">{onLeaveToday.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{pendingLeaves} leave requests pending</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-elevated">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Joiners</p>
                <p className="text-3xl font-bold mt-1 text-blue-600">{newJoiners.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-xl font-bold">{departments.filter(d => d.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <UserMinus className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-xl font-bold">{inactiveEmps.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-xl font-bold">₹{totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-xl font-bold">{pendingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown Bar Chart */}
        <Card className="lg:col-span-2 border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Employees by Department</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/hr/departments")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {deptData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No department data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {deptData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="border-0 shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Workforce Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Summary */}
        <Card className="border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Leave Overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/hr/leave")}>
              Manage <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold">{leaveRequests.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xl font-bold text-amber-600">{pendingLeaves}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xl font-bold text-green-600">{leaveRequests.filter(r => r.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-xl font-bold text-red-600">{leaveRequests.filter(r => r.status === "rejected").length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Employee Activity */}
        <Card className="border-0 shadow-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Employees</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/hr/employees")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmployees.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No employees yet</p>
              ) : recentEmployees.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => navigate(`/hr/employee/${e.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{e.full_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.full_name}</p>
                      <p className="text-xs text-muted-foreground">{e.designation || "—"} · {e.departments?.name || "Unassigned"}</p>
                    </div>
                  </div>
                  <Badge variant={e.employment_status === "active" ? "default" : "secondary"} className="text-xs">
                    {e.employment_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Employees", icon: Users, to: "/hr/employees", color: "bg-primary/10 text-primary" },
              { label: "Departments", icon: Building2, to: "/hr/departments", color: "bg-purple-500/10 text-purple-600" },
              { label: "Leave Mgmt", icon: CalendarDays, to: "/hr/leave", color: "bg-amber-500/10 text-amber-600" },
              { label: "Org Chart", icon: Briefcase, to: "/hr/org-chart", color: "bg-blue-500/10 text-blue-600" },
              { label: "Payroll", icon: DollarSign, to: "/hr/payroll", color: "bg-emerald-500/10 text-emerald-600" },
            ].map(item => (
              <Button
                key={item.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-0 shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(item.to)}
              >
                <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAnalyticsDashboardPage;
