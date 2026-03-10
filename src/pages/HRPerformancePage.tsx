import { useHRPerformance } from "@/hooks/useHRPerformance";
import { useHREmployees } from "@/hooks/useHREmployees";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const HRPerformancePage = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { reviews, loading, create } = useHRPerformance();
  const { employees } = useHREmployees();
  const canManage = isSuperAdmin || isBusinessAdmin;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", review_period: "", work_quality: "7", productivity: "7",
    communication: "7", team_collaboration: "7", leadership: "7",
    manager_feedback: "", hr_feedback: "",
  });

  const handleAdd = async () => {
    if (!form.employee_id || !form.review_period) { toast.error("Employee and period required"); return; }
    await create({ ...form, work_quality: Number(form.work_quality), productivity: Number(form.productivity), communication: Number(form.communication), team_collaboration: Number(form.team_collaboration), leadership: Number(form.leadership) });
    toast.success("Review submitted");
    setAddOpen(false);
  };

  const resultColor = (r: string) => r === "excellent" ? "default" : r === "good" ? "secondary" : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Reviews</h1>
          <p className="text-muted-foreground">Schedule and manage employee performance reviews</p>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Review</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div><Label>Employee *</Label>
                  <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.employment_status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Review Period *</Label><Input value={form.review_period} onChange={e => setForm({ ...form, review_period: e.target.value })} placeholder="e.g. Q1 2026" /></div>
                <p className="text-xs font-medium text-muted-foreground pt-2">Scores (1-10)</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["work_quality", "productivity", "communication", "team_collaboration", "leadership"] as const).map(key => (
                    <div key={key}><Label className="capitalize">{key.replace("_", " ")}</Label><Input type="number" min={1} max={10} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>
                  ))}
                </div>
                <div><Label>Manager Feedback</Label><Textarea value={form.manager_feedback} onChange={e => setForm({ ...form, manager_feedback: e.target.value })} /></div>
                <div><Label>HR Feedback</Label><Textarea value={form.hr_feedback} onChange={e => setForm({ ...form, hr_feedback: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full">Submit Review</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Reviews</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{reviews.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Excellent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{reviews.filter(r => r.result === "excellent").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Needs Improvement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{reviews.filter(r => r.result === "needs_improvement").length}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Period</TableHead><TableHead>Rating</TableHead><TableHead>Result</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : reviews.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No reviews yet</TableCell></TableRow>
            ) : reviews.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                <TableCell>{r.hr_employees?.departments?.name || "—"}</TableCell>
                <TableCell>{r.review_period}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> {r.overall_rating}/10</div></TableCell>
                <TableCell><Badge variant={resultColor(r.result)}>{r.result?.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default HRPerformancePage;
