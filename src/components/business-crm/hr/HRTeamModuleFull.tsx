import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useHREmployees } from "./useHREmployees";
import { EmployeeDirectoryTab } from "./EmployeeDirectoryTab";
import { AttendanceTab } from "./AttendanceTab";
import { LeaveTab } from "./LeaveTab";
import { TasksTab } from "./TasksTab";
import { PerformanceTab } from "./PerformanceTab";
import { ActivityLogsTab } from "./ActivityLogsTab";
import { Users, Clock, CalendarOff, ClipboardList, TrendingUp, Activity } from "lucide-react";

export function HRTeamModuleFull() {
  const { employees, loading, create } = useHREmployees();
  const { departments } = useHRDepartments();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">HR & Employee Management</h2>
        <p className="text-xs text-muted-foreground">Manage your team, attendance, leave, tasks & performance</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="employees" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Employees</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5 text-xs"><CalendarOff className="h-3.5 w-3.5" />Leave</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs"><ClipboardList className="h-3.5 w-3.5" />Tasks</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5" />Performance</TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs"><Activity className="h-3.5 w-3.5" />Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <EmployeeDirectoryTab employees={employees} departments={departments} loading={loading} onCreate={create} />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <LeaveTab />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <TasksTab />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
