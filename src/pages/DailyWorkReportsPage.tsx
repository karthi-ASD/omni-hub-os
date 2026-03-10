import { useDailyWorkReports } from "@/hooks/useDailyWorkReports";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

const DailyWorkReportsPage = () => {
  const { user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { reports, loading, upsertReport } = useDailyWorkReports();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    report_date: format(new Date(), "yyyy-MM-dd"),
    tasks_assigned: 0, tasks_completed: 0, tasks_pending: 0,
    calls_made: 0, meetings_conducted: 0, demos_done: 0,
    tickets_handled: 0, tickets_created: 0,
    proposals_sent: 0, leads_handled: 0, deals_closed: 0,
    notes: "",
  });

  const handleSubmit = async () => {
    if (!user) return;
    await upsertReport({
      employee_id: user.id,
      report_date: form.report_date,
      ...form,
    });
    toast.success("Daily work report submitted");
    setOpen(false);
  };

  const canViewAll = isSuperAdmin || isBusinessAdmin;
  const myReports = canViewAll ? reports : reports.filter(r => r.user_id === user?.id);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const numField = (label: string, key: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} value={(form as any)[key]}
        onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Work Reports</h1>
          <p className="text-muted-foreground">
            {canViewAll ? "All employee daily activity reports" : "Your daily activity reports"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Submit Report</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Submit Daily Work Report</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Date</Label><Input type="date" value={form.report_date}
                onChange={e => setForm({ ...form, report_date: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                {numField("Tasks Assigned", "tasks_assigned")}
                {numField("Tasks Completed", "tasks_completed")}
                {numField("Tasks Pending", "tasks_pending")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {numField("Calls Made", "calls_made")}
                {numField("Meetings", "meetings_conducted")}
                {numField("Demos Done", "demos_done")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {numField("Tickets Handled", "tickets_handled")}
                {numField("Proposals Sent", "proposals_sent")}
                {numField("Deals Closed", "deals_closed")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {numField("Leads Handled", "leads_handled")}
                {numField("Tickets Created", "tickets_created")}
              </div>
              <div>
                <Label>Notes / Remarks</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional remarks..." />
              </div>
              <Button onClick={handleSubmit} className="w-full"><Send className="h-4 w-4 mr-1" /> Submit Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tasks Done</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Demos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myReports.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No reports found</TableCell></TableRow>
              ) : myReports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.report_date}</TableCell>
                  <TableCell>{r.tasks_completed}/{r.tasks_assigned}</TableCell>
                  <TableCell>{r.calls_made}</TableCell>
                  <TableCell>{r.meetings_conducted}</TableCell>
                  <TableCell>{r.tickets_handled}</TableCell>
                  <TableCell>{r.demos_done}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "submitted" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{r.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyWorkReportsPage;
