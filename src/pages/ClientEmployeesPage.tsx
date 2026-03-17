import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useClientWorkforce, ClientEmployee } from "@/hooks/useClientWorkforce";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Pencil, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const emptyForm = {
  employee_name: "", phone: "", email: "", department_id: "",
  designation: "", joining_date: "", status: "active", app_access: false,
};

const ClientEmployeesPage = () => {
  usePageTitle("Employees");
  const { isClientUser, clientId } = useAuth();
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const effectiveClientId = isClientUser ? (clientId || "") : selectedClientId;

  const { departments, employees, loading, createEmployee, updateEmployee, deleteEmployee } =
    useClientWorkforce(effectiveClientId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientEmployee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: ClientEmployee) => {
    setEditing(e);
    setForm({
      employee_name: e.employee_name, phone: e.phone || "", email: e.email || "",
      department_id: e.department_id || "", designation: e.designation || "",
      joining_date: e.joining_date || "", status: e.status, app_access: e.app_access,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_name.trim()) { toast.error("Employee name is required"); return; }
    const payload = { ...form, department_id: form.department_id || null, joining_date: form.joining_date || null };
    if (editing) { await updateEmployee(editing.id, payload); toast.success("Employee updated"); }
    else { await createEmployee(payload); toast.success("Employee added"); }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => { await deleteEmployee(id); toast.success("Employee removed"); };
  const deptName = (deptId: string | null) => departments.find((d) => d.id === deptId)?.department_name || "—";
  const filtered = employees.filter(e =>
    e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || "").toLowerCase().includes(search.toLowerCase())
  );

  const showClientSelector = !isClientUser;
  const hasClient = !!effectiveClientId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isClientUser ? "My Team" : "Client Employees"}</h1>
          <p className="text-muted-foreground text-sm">{isClientUser ? "Manage your team members" : "Manage staff members for your clients"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {showClientSelector && (
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
        )}
        {hasClient && (
          <>
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}><UserPlus className="h-4 w-4 mr-1" /> Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Employee</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Label>Employee Name *</Label><Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Department</Label>
                    <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                  <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-5"><Switch checked={form.app_access} onCheckedChange={(v) => setForm({ ...form, app_access: v })} /><Label>App Access</Label></div>
                  <div className="col-span-2"><Button className="w-full" onClick={handleSave}>Save</Button></div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {!hasClient ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {isClientUser ? "Loading your team..." : "Select a client to manage employees"}
        </CardContent></Card>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          {employees.length === 0 ? 'No team members yet. Click "Add Employee" to get started.' : "No employees match your search."}
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Team Members ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                <TableHead>Department</TableHead><TableHead>Designation</TableHead><TableHead>Joined</TableHead>
                <TableHead>Status</TableHead><TableHead>App</TableHead><TableHead className="w-24">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.employee_name}</TableCell>
                    <TableCell className="text-sm">{e.email || "—"}</TableCell>
                    <TableCell className="text-sm">{e.phone || "—"}</TableCell>
                    <TableCell>{deptName(e.department_id)}</TableCell>
                    <TableCell>{e.designation || "—"}</TableCell>
                    <TableCell className="text-sm">{e.joining_date ? format(new Date(e.joining_date), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={e.status === "active" ? "default" : e.status === "terminated" ? "destructive" : "secondary"}>{e.status}</Badge></TableCell>
                    <TableCell><Badge variant={e.app_access ? "default" : "outline"}>{e.app_access ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default ClientEmployeesPage;
