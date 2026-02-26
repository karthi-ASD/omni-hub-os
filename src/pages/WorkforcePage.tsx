import { useEmployeeProfiles, useAttendance, useCheckins, useEmployeeSessions } from "@/hooks/useWorkforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";

const WorkforcePage = () => {
  const { employees, loading: empLoading } = useEmployeeProfiles();
  const { records: attendance, loading: attLoading } = useAttendance();
  const { sessions, loading: sessLoading } = useEmployeeSessions();
  const { checkin } = useCheckins();

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "onboarding": return "secondary";
      case "terminated": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workforce Management</h1>
          <p className="text-muted-foreground">Employee profiles, attendance & session tracking</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => checkin("in")}>
            <LogIn className="h-4 w-4 mr-1" /> Check In
          </Button>
          <Button size="sm" variant="outline" onClick={() => checkin("out")}>
            <LogOut className="h-4 w-4 mr-1" /> Check Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{employees.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{attendance.filter(a => a.date === format(new Date(), "yyyy-MM-dd") && a.status === "present").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sessions Today</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{sessions.filter(s => s.login_at?.startsWith(format(new Date(), "yyyy-MM-dd"))).length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees"><Users className="h-4 w-4 mr-1" /> Employees</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="h-4 w-4 mr-1" /> Attendance</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
                  ) : employees.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.employee_code || "—"}</TableCell>
                      <TableCell className="capitalize">{e.employment_type?.replace("_", " ")}</TableCell>
                      <TableCell className="capitalize">{e.work_location_type}</TableCell>
                      <TableCell><Badge variant={statusColor(e.status)}>{e.status}</Badge></TableCell>
                      <TableCell>{e.date_of_joining ? format(new Date(e.date_of_joining), "dd MMM yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>First Login</TableHead>
                    <TableHead>Last Logout</TableHead>
                    <TableHead>Work Minutes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : attendance.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance records</TableCell></TableRow>
                  ) : attendance.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.date}</TableCell>
                      <TableCell><Badge variant={a.status === "present" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                      <TableCell>{a.first_login_at ? format(new Date(a.first_login_at), "HH:mm") : "—"}</TableCell>
                      <TableCell>{a.last_logout_at ? format(new Date(a.last_logout_at), "HH:mm") : "—"}</TableCell>
                      <TableCell>{a.total_work_minutes ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Login At</TableHead>
                    <TableHead>Logout At</TableHead>
                    <TableHead>Duration (min)</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : sessions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sessions recorded</TableCell></TableRow>
                  ) : sessions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{format(new Date(s.login_at), "dd MMM HH:mm")}</TableCell>
                      <TableCell>{s.logout_at ? format(new Date(s.logout_at), "dd MMM HH:mm") : "Active"}</TableCell>
                      <TableCell>{s.session_duration_minutes ?? "—"}</TableCell>
                      <TableCell className="capitalize">{s.login_method}</TableCell>
                      <TableCell>{s.ip_address ?? "—"}</TableCell>
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

export default WorkforcePage;
