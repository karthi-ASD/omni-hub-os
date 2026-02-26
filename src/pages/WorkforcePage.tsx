import { useEmployeeProfiles, useAttendance, useCheckins, useEmployeeSessions } from "@/hooks/useWorkforce";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, LogIn, LogOut, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

const WorkforcePage = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { employees, loading: empLoading, create } = useEmployeeProfiles();
  const { records: attendance, loading: attLoading } = useAttendance();
  const { sessions, loading: sessLoading } = useEmployeeSessions();
  const { checkin } = useCheckins();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    employee_code: "",
    employment_type: "full_time",
    work_location_type: "office",
    status: "onboarding",
    date_of_joining: format(new Date(), "yyyy-MM-dd"),
  });

  const canManage = isSuperAdmin || isBusinessAdmin;

  const handleAdd = async () => {
    if (!form.employee_code) {
      toast.error("Employee code is required");
      return;
    }
    await create(form);
    toast.success("Employee added successfully");
    setAddOpen(false);
    setForm({
      employee_code: "",
      employment_type: "full_time",
      work_location_type: "office",
      status: "onboarding",
      date_of_joining: format(new Date(), "yyyy-MM-dd"),
    });
  };

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
          {canManage && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-1" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Employee Code *</Label>
                    <Input
                      value={form.employee_code}
                      onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                      placeholder="e.g. EMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Work Location</Label>
                    <Select value={form.work_location_type} onValueChange={(v) => setForm({ ...form, work_location_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Joining</Label>
                    <Input
                      type="date"
                      value={form.date_of_joining}
                      onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAdd} className="w-full">Add Employee</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button size="sm" variant="outline" onClick={() => checkin("in")}>
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
