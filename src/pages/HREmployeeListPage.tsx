import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Eye, Pencil, Trash2, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HREmployeeListPage = () => {
  const { employees, loading, create, update, deactivate, refresh } = useHREmployees();
  const { departments } = useHRDepartments();
  const { isSuperAdmin, isBusinessAdmin, isHRManager, profile } = useAuth();
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    full_name: "", email: "", mobile_number: "", department_id: "",
    designation: "", employment_type: "full_time", work_location: "",
    joining_date: format(new Date(), "yyyy-MM-dd"), employee_code: "",
  });

  const [editForm, setEditForm] = useState({
    full_name: "", email: "", mobile_number: "", department_id: "",
    designation: "", employment_type: "full_time", work_location: "",
    joining_date: "", employee_code: "", employment_status: "active",
    reporting_manager_id: "",
  });

  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;
  const canDelete = isSuperAdmin;

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
    const code = form.employee_code.trim() || `NW-EMP-${String(employees.length + 1).padStart(3, "0")}`;
    await create({ ...form, employee_code: code });
    toast.success("Employee added");
    setAddOpen(false);
    setForm({ full_name: "", email: "", mobile_number: "", department_id: "", designation: "", employment_type: "full_time", work_location: "", joining_date: format(new Date(), "yyyy-MM-dd"), employee_code: "" });
  };

  const openEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEditForm({
      full_name: emp.full_name || "",
      email: emp.email || "",
      mobile_number: emp.mobile_number || "",
      department_id: emp.department_id || "",
      designation: emp.designation || "",
      employment_type: emp.employment_type || "full_time",
      work_location: emp.work_location || "",
      joining_date: emp.joining_date || "",
      employee_code: emp.employee_code || "",
      employment_status: emp.employment_status || "active",
      reporting_manager_id: emp.reporting_manager_id || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingEmployee || !editForm.full_name.trim()) {
      toast.error("Name is required");
      return;
    }

    const changes: Record<string, any> = {};
    const oldValues: Record<string, any> = {};

    // Track what changed for audit
    for (const key of Object.keys(editForm) as (keyof typeof editForm)[]) {
      if (editForm[key] !== (editingEmployee[key] || "")) {
        changes[key] = editForm[key];
        oldValues[key] = editingEmployee[key] || "";
      }
    }

    if (Object.keys(changes).length === 0) {
      toast.info("No changes made");
      setEditOpen(false);
      return;
    }

    await update(editingEmployee.id, changes);

    // Audit log
    if (profile?.business_id) {
      await supabase.from("audit_logs").insert({
        business_id: editingEmployee.business_id || profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "UPDATE_EMPLOYEE",
        entity_type: "hr_employee",
        entity_id: editingEmployee.id,
        old_value_json: oldValues,
        new_value_json: changes,
      });
    }

    toast.success("Employee updated");
    setEditOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = async (emp: any) => {
    if (!confirm(`Permanently deactivate ${emp.full_name}? This will remove their login access but retain historical records.`)) return;
    await deactivate(emp.id, "terminated");

    if (profile?.business_id) {
      await supabase.from("audit_logs").insert({
        business_id: emp.business_id || profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "DELETE_EMPLOYEE",
        entity_type: "hr_employee",
        entity_id: emp.id,
        new_value_json: { full_name: emp.full_name, reason: "terminated" },
      });
    }

    toast.success("Employee deactivated");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "default";
      case "on_leave": return "secondary";
      case "inactive": return "outline";
      case "terminated": case "suspended": case "resigned": return "destructive";
      default: return "outline";
    }
  };

  // Get manager names for the reporting dropdown
  const managerOptions = employees.filter(e => e.employment_status === "active");

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
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow>
              ) : filtered.map(e => {
                const manager = e.reporting_manager_id ? employees.find(m => m.id === e.reporting_manager_id) : null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_code || "—"}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.departments?.name || "—"}</TableCell>
                    <TableCell>{e.designation || "—"}</TableCell>
                    <TableCell>{manager?.full_name || "—"}</TableCell>
                    <TableCell>{e.joining_date ? format(new Date(e.joining_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(e.employment_status)}>{e.employment_status?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="View" onClick={() => navigate(`/hr/employee/${e.id}`)}><Eye className="h-4 w-4" /></Button>
                        {canManage && (
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" className="text-destructive" title="Delete" onClick={() => handleDelete(e)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input placeholder="e.g. NW-EMP-001 (auto-generated if empty)" value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} />
            </div>
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

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={editForm.employee_code} onChange={e => setEditForm({ ...editForm, employee_code: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mobile</Label><Input value={editForm.mobile_number} onChange={e => setEditForm({ ...editForm, mobile_number: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={editForm.department_id} onValueChange={v => setEditForm({ ...editForm, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.filter(d => d.status === "active").map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Designation</Label><Input value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Reporting Manager</Label>
                <Select value={editForm.reporting_manager_id} onValueChange={v => setEditForm({ ...editForm, reporting_manager_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {managerOptions.filter(m => m.id !== editingEmployee?.id).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={editForm.employment_type} onValueChange={v => setEditForm({ ...editForm, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.employment_status} onValueChange={v => setEditForm({ ...editForm, employment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Work Location</Label><Input value={editForm.work_location} onChange={e => setEditForm({ ...editForm, work_location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={editForm.joining_date} onChange={e => setEditForm({ ...editForm, joining_date: e.target.value })} /></div>
            </div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HREmployeeListPage;
