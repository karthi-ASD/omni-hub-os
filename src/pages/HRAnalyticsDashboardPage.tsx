import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useHRLeaveRequests } from "@/hooks/useHRLeave";
import { useHRPayroll } from "@/hooks/useHRPayroll";
import { useHRPerformance } from "@/hooks/useHRPerformance";
import { useHRTasks } from "@/hooks/useHRTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, DollarSign, Star, ListChecks, Building2, TrendingUp, AlertTriangle } from "lucide-react";

const HRAnalyticsDashboardPage = () => {
  const { employees } = useHREmployees();
  const { departments } = useHRDepartments();
  const { requests: leaveRequests } = useHRLeaveRequests();
  const { records: payroll } = useHRPayroll();
  const { reviews } = useHRPerformance();
  const { tasks } = useHRTasks();

  const activeEmps = employees.filter(e => e.employment_status === "active");
  const totalPayroll = payroll.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (Number(r.overall_rating) || 0), 0) / reviews.length).toFixed(1) : "—";
  const pendingLeaves = leaveRequests.filter(r => r.status === "pending").length;
  const overdueTasks = tasks.filter(t => t.status === "overdue").length;

  // Dept breakdown
  const deptCounts = departments.map(d => ({
    name: d.name,
    count: employees.filter(e => e.department_id === d.id && e.employment_status === "active").length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HR Analytics</h1>
        <p className="text-muted-foreground">Workforce insights and key HR metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Total Employees</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{employees.length}</div><p className="text-xs text-muted-foreground">{activeEmps.length} active</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-4 w-4" /> Departments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{departments.filter(d => d.status === "active").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Pending Leaves</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{pendingLeaves}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Total Payroll</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totalPayroll.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Star className="h-4 w-4" /> Avg Rating</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgRating}/10</div><p className="text-xs text-muted-foreground">{reviews.length} reviews</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><ListChecks className="h-4 w-4" /> Total Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{tasks.length}</div><p className="text-xs text-muted-foreground">{tasks.filter(t => t.status === "completed").length} completed</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Overdue Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{overdueTasks}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Excellent Reviews</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{reviews.filter(r => r.result === "excellent").length}</div></CardContent>
        </Card>
      </div>

      {/* Department breakdown */}
      <Card>
        <CardHeader><CardTitle>Employees by Department</CardTitle></CardHeader>
        <CardContent>
          {deptCounts.length === 0 ? <p className="text-muted-foreground text-sm">No department data</p> : (
            <div className="space-y-3">
              {deptCounts.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-40 truncate">{d.name}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (d.count / Math.max(...deptCounts.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave & Payroll summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Leave Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold">{leaveRequests.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
              <div><p className="text-2xl font-bold text-green-600">{leaveRequests.filter(r => r.status === "approved").length}</p><p className="text-xs text-muted-foreground">Approved</p></div>
              <div><p className="text-2xl font-bold text-red-600">{leaveRequests.filter(r => r.status === "rejected").length}</p><p className="text-xs text-muted-foreground">Rejected</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Task Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold">{tasks.filter(t => t.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending</p></div>
              <div><p className="text-2xl font-bold">{tasks.filter(t => t.status === "in_progress").length}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
              <div><p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === "completed").length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRAnalyticsDashboardPage;
