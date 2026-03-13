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
import { CalendarDays, Plus, Check, X, Settings, Clock, UserCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const HRLeaveManagementPage = () => {
  const { user, isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const { leaveTypes, loading: ltLoading, create: createLT } = useHRLeaveTypes();
  const { requests, loading: reqLoading, create: createReq, approve, reject } = useHRLeaveRequests();
  const { employees } = useHREmployees();
  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;

  const [ltOpen, setLtOpen] = useState(false);
  const [ltForm, setLtForm] = useState({ name: "", max_days_per_year: 12, carry_forward: false, approval_required: true });
  const [reqOpen, setReqOpen] = useState(false);
  const [reqForm, setReqForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", num_days: 1, reason: "" });

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  // Employees on leave today
  const today = format(new Date(), "yyyy-MM-dd");
  const onLeaveToday = approvedRequests.filter(r => r.start_date <= today && r.end_date >= today);

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
    setReqForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", num_days: 1, reason: "" });
  };

  const statusColor = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Configure leave types, track requests & approvals</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={reqOpen} onOpenChange={setReqOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Request</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2"><Label>Employee *</Label>
                  <Select value={reqForm.employee_id} onValueChange={v => setReqForm({ ...reqForm, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.employment_status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Leave Type *</Label>
                  <Select value={reqForm.leave_type_id} onValueChange={v => setReqForm({ ...reqForm, leave_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{leaveTypes.filter(lt => lt.status === "active").map(lt => (
                      <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={reqForm.end_date} onChange={e => setReqForm({ ...reqForm, end_date: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Days</Label><Input type="number" value={reqForm.num_days} onChange={e => setReqForm({ ...reqForm, num_days: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Reason</Label><Textarea value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} /></div>
                <Button onClick={handleAddReq} className="w-full">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-600">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold text-red-600">{rejectedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Leave Today</p>
                <p className="text-xl font-bold text-blue-600">{onLeaveToday.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On Leave Today Banner */}
      {onLeaveToday.length > 0 && (
        <Card className="border-0 shadow-elevated bg-blue-500/5 border border-blue-500/10">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-blue-700 mb-2">📋 Employees on Leave Today</p>
            <div className="flex flex-wrap gap-2">
              {onLeaveToday.map(r => (
                <Badge key={r.id} variant="outline" className="text-xs">
                  {r.hr_employees?.full_name} · {r.hr_leave_types?.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><CalendarDays className="h-4 w-4 mr-1" /> Leave Requests</TabsTrigger>
          <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1" /> Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="types"><Settings className="h-4 w-4 mr-1" /> Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="border-0 shadow-elevated"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Actions</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {reqLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : requests.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                ) : requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.hr_employees?.departments?.name || "—"}</TableCell>
                    <TableCell>{r.hr_leave_types?.name}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.num_days}</TableCell>
                    <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                    {canManage && (
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { approve(r.id, user!.id); toast.success("Approved"); }}>
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { reject(r.id); toast.success("Rejected"); }}>
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
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

        <TabsContent value="pending">
          <Card className="border-0 shadow-elevated"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead>{canManage && <TableHead>Actions</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {pendingRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending requests 🎉</TableCell></TableRow>
                ) : pendingRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                    <TableCell>{r.hr_leave_types?.name}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.num_days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.reason || "—"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => { approve(r.id, user!.id); toast.success("Approved"); }}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => { reject(r.id); toast.success("Rejected"); }}>
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="types">
          <Card className="border-0 shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Types</CardTitle>
              {canManage && (
                <Dialog open={ltOpen} onOpenChange={setLtOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Type</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-2"><Label>Name *</Label><Input value={ltForm.name} onChange={e => setLtForm({ ...ltForm, name: e.target.value })} placeholder="e.g. Casual Leave" /></div>
                      <div className="space-y-2"><Label>Max Days/Year</Label><Input type="number" value={ltForm.max_days_per_year} onChange={e => setLtForm({ ...ltForm, max_days_per_year: Number(e.target.value) })} /></div>
                      <Button onClick={handleAddLT} className="w-full">Add Leave Type</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {leaveTypes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No leave types configured. Add types like Casual Leave, Sick Leave, etc.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaveTypes.map(lt => (
                    <Card key={lt.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{lt.name}</h4>
                          <Badge variant={lt.status === "active" ? "default" : "secondary"}>{lt.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Max Days</p>
                            <p className="font-medium">{lt.max_days_per_year}/year</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Approval</p>
                            <p className="font-medium">{lt.approval_required ? "Required" : "Auto"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRLeaveManagementPage;
