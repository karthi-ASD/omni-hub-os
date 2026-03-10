import { useHRLeaveTypes, useHRLeaveRequests } from "@/hooks/useHRLeave";
import { useHREmployees } from "@/hooks/useHREmployees";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Check, X, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const HRLeaveManagementPage = () => {
  const { user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { leaveTypes, loading: ltLoading, create: createLT, update: updateLT } = useHRLeaveTypes();
  const { requests, loading: reqLoading, create: createReq, approve, reject } = useHRLeaveRequests();
  const { employees } = useHREmployees();
  const canManage = isSuperAdmin || isBusinessAdmin;

  const [ltOpen, setLtOpen] = useState(false);
  const [ltForm, setLtForm] = useState({ name: "", max_days_per_year: 12, carry_forward: false, approval_required: true });
  const [reqOpen, setReqOpen] = useState(false);
  const [reqForm, setReqForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", num_days: 1, reason: "" });

  const handleAddLT = async () => {
    if (!ltForm.name) { toast.error("Name required"); return; }
    await createLT(ltForm);
    toast.success("Leave type created");
    setLtOpen(false);
    setLtForm({ name: "", max_days_per_year: 12, carry_forward: false, approval_required: true });
  };

  const handleAddReq = async () => {
    if (!reqForm.employee_id || !reqForm.leave_type_id || !reqForm.start_date || !reqForm.end_date) {
      toast.error("Fill all required fields"); return;
    }
    await createReq(reqForm);
    toast.success("Leave request submitted");
    setReqOpen(false);
  };

  const statusColor = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Configure leave types, track requests & approvals</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={reqOpen} onOpenChange={setReqOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Request</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Employee *</Label>
                  <Select value={reqForm.employee_id} onValueChange={v => setReqForm({ ...reqForm, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.employment_status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Leave Type *</Label>
                  <Select value={reqForm.leave_type_id} onValueChange={v => setReqForm({ ...reqForm, leave_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{leaveTypes.filter(lt => lt.status === "active").map(lt => (
                      <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date *</Label><Input type="date" value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} /></div>
                  <div><Label>End Date *</Label><Input type="date" value={reqForm.end_date} onChange={e => setReqForm({ ...reqForm, end_date: e.target.value })} /></div>
                </div>
                <div><Label>Days</Label><Input type="number" value={reqForm.num_days} onChange={e => setReqForm({ ...reqForm, num_days: Number(e.target.value) })} /></div>
                <div><Label>Reason</Label><Textarea value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} /></div>
                <Button onClick={handleAddReq} className="w-full">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{requests.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === "pending").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === "approved").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === "rejected").length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><CalendarDays className="h-4 w-4 mr-1" /> Leave Requests</TabsTrigger>
          <TabsTrigger value="types"><Settings className="h-4 w-4 mr-1" /> Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Actions</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {reqLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                ) : requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                    <TableCell>{r.hr_leave_types?.name}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.num_days}</TableCell>
                    <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                    {canManage && (
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="text-green-600" onClick={() => { approve(r.id, user!.id); toast.success("Approved"); }}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { reject(r.id); toast.success("Rejected"); }}><X className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Types</CardTitle>
              {canManage && (
                <Dialog open={ltOpen} onOpenChange={setLtOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Type</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name *</Label><Input value={ltForm.name} onChange={e => setLtForm({ ...ltForm, name: e.target.value })} /></div>
                      <div><Label>Max Days/Year</Label><Input type="number" value={ltForm.max_days_per_year} onChange={e => setLtForm({ ...ltForm, max_days_per_year: Number(e.target.value) })} /></div>
                      <Button onClick={handleAddLT} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Max Days</TableHead><TableHead>Carry Forward</TableHead><TableHead>Approval</TableHead></TableRow></TableHeader>
                <TableBody>{leaveTypes.map(lt => (
                  <TableRow key={lt.id}>
                    <TableCell className="font-medium">{lt.name}</TableCell>
                    <TableCell>{lt.max_days_per_year}</TableCell>
                    <TableCell>{lt.carry_forward ? "Yes" : "No"}</TableCell>
                    <TableCell>{lt.approval_required ? "Required" : "Auto"}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRLeaveManagementPage;
