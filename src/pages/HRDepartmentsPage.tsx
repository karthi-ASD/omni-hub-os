import { useHREmployees } from "@/hooks/useHREmployees";
import { useHRDepartments } from "@/hooks/useHRDepartments";
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
import { Building2, Plus, Pencil, Trash2, Users, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const HRDepartmentsPage = () => {
  const { departments, loading, create, update, remove } = useHRDepartments();
  const { employees } = useHREmployees();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "active" });

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    await create(form);
    toast.success("Department created");
    setAddOpen(false);
    setForm({ name: "", description: "", status: "active" });
  };

  const handleEdit = async () => {
    if (!editId || !form.name.trim()) return;
    await update(editId, form);
    toast.success("Department updated");
    setEditId(null);
    setForm({ name: "", description: "", status: "active" });
  };

  const openEdit = (d: any) => {
    setForm({ name: d.name, description: d.description || "", status: d.status });
    setEditId(d.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    await remove(id);
    toast.success("Department deleted");
  };

  const getEmployeeCount = (deptId: string) =>
    employees.filter(e => e.department_id === deptId && e.employment_status === "active").length;

  const formDialog = (isEdit: boolean) => (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Department Name *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. HR" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={isEdit ? handleEdit : handleAdd} className="w-full">
        {isEdit ? "Update Department" : "Add Department"}
      </Button>
    </div>
  );

  const DEPT_COLORS = [
    "bg-primary/10 text-primary",
    "bg-blue-500/10 text-blue-600",
    "bg-green-500/10 text-green-600",
    "bg-purple-500/10 text-purple-600",
    "bg-amber-500/10 text-amber-600",
    "bg-red-500/10 text-red-600",
    "bg-teal-500/10 text-teal-600",
    "bg-pink-500/10 text-pink-600",
    "bg-indigo-500/10 text-indigo-600",
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational departments & teams</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Department</DialogTitle></DialogHeader>
            {formDialog(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{departments.filter(d => d.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Team Members</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.employment_status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading…</div>
        ) : departments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No departments created yet</div>
        ) : departments.map((d, idx) => {
          const count = getEmployeeCount(d.id);
          const colorClass = DEPT_COLORS[idx % DEPT_COLORS.length];
          return (
            <Card key={d.id} className="border-0 shadow-elevated hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{d.name}</h3>
                      {d.description && <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>}
                    </div>
                  </div>
                  <Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{count} member{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editId} onOpenChange={o => { if (!o) setEditId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle></DialogHeader>
          {formDialog(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDepartmentsPage;
