import { useHRPayroll } from "@/hooks/useHRPayroll";
import { useHREmployees } from "@/hooks/useHREmployees";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Lock, Check } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const HRPayrollPage = () => {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { records, loading, create, approve, lock } = useHRPayroll();
  const { employees } = useHREmployees();
  const canManage = isSuperAdmin || isBusinessAdmin;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", month: format(new Date(), "yyyy-MM"),
    basic_salary: "", hra: "", allowances: "", overtime: "", bonus: "", deductions: "", pf_tax: "",
  });

  const netCalc = useMemo(() => {
    const vals = [form.basic_salary, form.hra, form.allowances, form.overtime, form.bonus].map(Number);
    const deducts = [form.deductions, form.pf_tax].map(Number);
    return vals.reduce((a, b) => a + (b || 0), 0) - deducts.reduce((a, b) => a + (b || 0), 0);
  }, [form]);

  const handleAdd = async () => {
    if (!form.employee_id || !form.month) { toast.error("Employee and month required"); return; }
    await create({ ...form, basic_salary: Number(form.basic_salary) || 0, hra: Number(form.hra) || 0, allowances: Number(form.allowances) || 0, overtime: Number(form.overtime) || 0, bonus: Number(form.bonus) || 0, deductions: Number(form.deductions) || 0, pf_tax: Number(form.pf_tax) || 0 });
    toast.success("Payroll record created");
    setAddOpen(false);
  };

  const totalPayroll = records.reduce((sum, r) => sum + (Number(r.net_salary) || 0), 0);
  const statusColor = (s: string) => s === "locked" ? "default" : s === "approved" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Generate, approve, and lock monthly payroll</p>
        </div>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generate Payroll</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Generate Payroll</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div><Label>Employee *</Label>
                  <Select value={form.employee_id} onValueChange={v => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{employees.filter(e => e.employment_status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Month *</Label><Input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Basic Salary</Label><Input type="number" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} /></div>
                  <div><Label>HRA</Label><Input type="number" value={form.hra} onChange={e => setForm({ ...form, hra: e.target.value })} /></div>
                  <div><Label>Allowances</Label><Input type="number" value={form.allowances} onChange={e => setForm({ ...form, allowances: e.target.value })} /></div>
                  <div><Label>Overtime</Label><Input type="number" value={form.overtime} onChange={e => setForm({ ...form, overtime: e.target.value })} /></div>
                  <div><Label>Bonus</Label><Input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} /></div>
                  <div><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} /></div>
                  <div><Label>PF / Tax</Label><Input type="number" value={form.pf_tax} onChange={e => setForm({ ...form, pf_tax: e.target.value })} /></div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Net Salary</p>
                  <p className="text-xl font-bold">₹{netCalc.toLocaleString()}</p>
                </div>
                <Button onClick={handleAdd} className="w-full">Generate</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{records.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Payroll</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">₹{totalPayroll.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Approval</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{records.filter(r => r.status === "draft").length}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Employee</TableHead><TableHead>Month</TableHead><TableHead>Basic</TableHead><TableHead>Net Salary</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Actions</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow>
            ) : records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                <TableCell>{r.month}</TableCell>
                <TableCell>₹{Number(r.basic_salary).toLocaleString()}</TableCell>
                <TableCell className="font-bold">₹{Number(r.net_salary).toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => { approve(r.id); toast.success("Approved"); }}><Check className="h-3 w-3 mr-1" /> Approve</Button>}
                      {r.status === "approved" && <Button size="sm" variant="outline" onClick={() => { lock(r.id); toast.success("Locked"); }}><Lock className="h-3 w-3 mr-1" /> Lock</Button>}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default HRPayrollPage;
