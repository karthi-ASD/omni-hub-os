import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Eye, UserX, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const HREmployeeListPage = () => {
  const { employees, loading, create, deactivate } = useHREmployees();
  const { departments } = useHRDepartments();
  const { isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    full_name: "", email: "", mobile_number: "", department_id: "",
    designation: "", employment_type: "full_time", work_location: "",
    joining_date: format(new Date(), "yyyy-MM-dd"),
  });

  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) || e.employee_code?.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept === "all" || e.department_id === filterDept;
      const matchStatus = filterStatus === "all" || e.employment_status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, filterDept, filterStatus]);

  const handleAdd = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const code = `EMP-${String(employees.length + 1).padStart(4, "0")}`;
    await create({ ...form, employee_code: code });
    toast.success("Employee added");
    setAddOpen(false);
    setForm({ full_name: "", email: "", mobile_number: "", department_id: "", designation: "", employment_type: "full_time", work_location: "", joining_date: format(new Date(), "yyyy-MM-dd") });
  };

  const handleDeactivate = async (id: string, reason: string) => {
    if (!confirm(`Deactivate employee? Reason: ${reason}`)) return;
    await deactivate(id, reason);
    toast.success("Employee deactivated");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "on_leave": return "secondary";
      case "terminated": case "suspended": case "resigned": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employee Directory"
        subtitle="Manage all employees across departments"
        icon={Users}
        badge={`${employees.length}`}
        actions={canManage ? [{ label: "Add Employee", icon: UserPlus, onClick: () => setAddOpen(true) }] : []}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or ID…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.employee_code || "—"}</TableCell>
                  <TableCell className="font-medium">{e.full_name}</TableCell>
                  <TableCell>{e.departments?.name || "—"}</TableCell>
                  <TableCell>{e.designation || "—"}</TableCell>
                  <TableCell>{e.joining_date ? format(new Date(e.joining_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{e.work_location || "—"}</TableCell>
                  <TableCell><Badge variant={statusColor(e.employment_status)}>{e.employment_status?.replace("_", " ")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/hr/employee/${e.id}`)}><Eye className="h-4 w-4" /></Button>
                      {canManage && e.employment_status === "active" && (
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeactivate(e.id, "suspended")}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mobile</Label><Input value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.filter(d => d.status === "active").map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={v => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Work Location</Label><Input value={form.work_location} onChange={e => setForm({ ...form, work_location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} /></div>
            </div>
            <Button onClick={handleAdd} className="w-full">Add Employee</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HREmployeeListPage;
