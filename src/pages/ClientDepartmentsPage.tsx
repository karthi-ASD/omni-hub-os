import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useClientWorkforce, ClientDepartment } from "@/hooks/useClientWorkforce";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const ClientDepartmentsPage = () => {
  usePageTitle("Client Departments");
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { departments, employees, loading, createDepartment, updateDepartment, deleteDepartment } =
    useClientWorkforce(selectedClientId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDepartment | null>(null);
  const [form, setForm] = useState({ department_name: "", manager_name: "", status: "active" });

  const openCreate = () => {
    setEditing(null);
    setForm({ department_name: "", manager_name: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (d: ClientDepartment) => {
    setEditing(d);
    setForm({ department_name: d.department_name, manager_name: d.manager_name || "", status: d.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.department_name.trim()) { toast.error("Department name is required"); return; }
    if (editing) {
      await updateDepartment(editing.id, form);
      toast.success("Department updated");
    } else {
      await createDepartment(form);
      toast.success("Department created");
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDepartment(id);
    toast.success("Department deleted");
  };

  const empCount = (deptId: string) => employees.filter((e) => e.department_id === deptId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Departments</h1>
          <p className="text-muted-foreground text-sm">Manage departments for your clients</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-72">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
            <SelectContent>
              {(clients || []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedClientId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Add"} Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Department Name</Label>
                  <Input value={form.department_name} onChange={(e) => setForm({ ...form, department_name: e.target.value })} />
                </div>
                <div>
                  <Label>Manager Name</Label>
                  <Input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSave}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedClientId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Select a client to manage departments
        </CardContent></Card>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : departments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No departments yet. Click "Add Department" to create one.
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Departments ({departments.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.department_name}</TableCell>
                    <TableCell>{d.manager_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {empCount(d.id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === "active" ? "default" : "secondary"}>{d.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientDepartmentsPage;
