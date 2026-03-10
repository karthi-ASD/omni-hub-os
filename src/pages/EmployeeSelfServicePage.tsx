import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CalendarDays, FileText, ListChecks, Clock } from "lucide-react";

const EmployeeSelfServicePage = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    // Find employee record by user_id
    const { data: emp } = await supabase
      .from("hr_employees")
      .select("*, departments(name)")
      .eq("user_id", user.id)
      .maybeSingle();
    setEmployee(emp);

    if (emp) {
      const [lRes, pRes, tRes, aRes] = await Promise.all([
        supabase.from("hr_leave_requests").select("*, hr_leave_types(name)").eq("employee_id", emp.id).order("created_at", { ascending: false }),
        supabase.from("hr_payroll_records").select("*").eq("employee_id", emp.id).order("month", { ascending: false }),
        supabase.from("hr_employee_tasks").select("*").eq("employee_id", emp.id).order("created_at", { ascending: false }),
        supabase.from("hr_employee_attendance").select("*").eq("employee_id", emp.id).order("date", { ascending: false }).limit(30),
      ]);
      setLeaves(lRes.data ?? []);
      setPayslips(pRes.data ?? []);
      setTasks(tRes.data ?? []);
      setAttendance(aRes.data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (!employee) return (
    <div className="text-center py-12">
      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold">No Employee Profile Found</h2>
      <p className="text-muted-foreground mt-2">Your account is not linked to an employee profile. Contact HR for assistance.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{employee.full_name}</h1>
            <p className="text-muted-foreground">{employee.designation || "—"} · {employee.departments?.name || "—"}</p>
            <div className="flex gap-2 mt-1">
              <Badge>{employee.employee_code}</Badge>
              <Badge variant="secondary">{employee.employment_type?.replace("_", " ")}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📧 {employee.email}</p>
            <p>📱 {employee.mobile_number || "—"}</p>
            <p>📍 {employee.work_location || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves"><CalendarDays className="h-4 w-4 mr-1" /> My Leaves</TabsTrigger>
          <TabsTrigger value="payslips"><FileText className="h-4 w-4 mr-1" /> Payslips</TabsTrigger>
          <TabsTrigger value="tasks"><ListChecks className="h-4 w-4 mr-1" /> My Tasks</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="h-4 w-4 mr-1" /> Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="leaves">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No leave records</TableCell></TableRow>
                ) : leaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.hr_leave_types?.name}</TableCell>
                    <TableCell>{l.start_date}</TableCell><TableCell>{l.end_date}</TableCell>
                    <TableCell>{l.num_days}</TableCell>
                    <TableCell><Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Basic</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions</TableHead><TableHead>Net Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payslips</TableCell></TableRow>
                ) : payslips.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.month}</TableCell>
                    <TableCell>₹{Number(p.basic_salary).toLocaleString()}</TableCell>
                    <TableCell>₹{(Number(p.hra) + Number(p.allowances)).toLocaleString()}</TableCell>
                    <TableCell>₹{(Number(p.deductions) + Number(p.pf_tax)).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">₹{Number(p.net_salary).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={p.status === "locked" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tasks assigned</TableCell></TableRow>
                ) : tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell><Badge variant={t.priority === "urgent" ? "destructive" : "outline"}>{t.priority}</Badge></TableCell>
                    <TableCell>{t.deadline || "—"}</TableCell>
                    <TableCell><Badge variant={t.status === "completed" ? "default" : "secondary"}>{t.status?.replace("_", " ")}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance records</TableCell></TableRow>
                ) : attendance.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{a.date}</TableCell>
                    <TableCell>{a.check_in_time || "—"}</TableCell>
                    <TableCell>{a.check_out_time || "—"}</TableCell>
                    <TableCell>{a.total_hours ?? "—"}</TableCell>
                    <TableCell><Badge variant={a.status === "present" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
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

export default EmployeeSelfServicePage;
