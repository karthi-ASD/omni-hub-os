import { useLeaveRequests, useLeaveTypes } from "@/hooks/useLeaveManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Settings, Plus, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const LeaveManagementPage = () => {
  const { types, loading: typesLoading, create: createType } = useLeaveTypes();
  const { requests, loading: reqLoading, create: createRequest, approve, reject } = useLeaveRequests();
  const { isBusinessAdmin, isSuperAdmin } = useAuth();
  const isAdmin = isBusinessAdmin || isSuperAdmin;

  const [typeOpen, setTypeOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeQuota, setTypeQuota] = useState(20);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const handleCreateType = async () => {
    await createType(typeName, typeQuota);
    setTypeName("");
    setTypeQuota(20);
    setTypeOpen(false);
  };

  const handleCreateRequest = async () => {
    await createRequest({ leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason });
    setLeaveTypeId("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setReqOpen(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Leave types, requests & approvals</p>
        </div>
        <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Request Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              </div>
              <div><Label>Reason</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} /></div>
              <Button onClick={handleCreateRequest} className="w-full" disabled={!leaveTypeId || !startDate || !endDate}>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><CalendarDays className="h-4 w-4 mr-1" /> Requests</TabsTrigger>
          <TabsTrigger value="types"><Settings className="h-4 w-4 mr-1" /> Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reqLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : requests.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
                  ) : requests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{(r as any).leave_types?.name ?? "—"}</TableCell>
                      <TableCell>{r.start_date}</TableCell>
                      <TableCell>{r.end_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.reason ?? "—"}</TableCell>
                      <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                      {isAdmin && (
                        <TableCell>
                          {r.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => approve(r.id)}><Check className="h-4 w-4 text-primary" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => reject(r.id)}><X className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Types</CardTitle>
              {isAdmin && (
                <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Type</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Leave Type</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="e.g. Annual Leave" /></div>
                      <div><Label>Annual Quota (days)</Label><Input type="number" value={typeQuota} onChange={e => setTypeQuota(Number(e.target.value))} /></div>
                      <Button onClick={handleCreateType} className="w-full" disabled={!typeName}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Annual Quota</TableHead>
                    <TableHead>Requires Docs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : types.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No leave types configured</TableCell></TableRow>
                  ) : types.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.annual_quota_days} days</TableCell>
                      <TableCell>{t.requires_documents ? "Yes" : "No"}</TableCell>
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

export default LeaveManagementPage;
