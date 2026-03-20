import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  departments: any[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
}

export function AddEmployeeDialog({ departments, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", mobile_number: "", designation: "",
    department_id: "", employment_type: "full_time", gender: "",
    joining_date: new Date().toISOString().split("T")[0],
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        department_id: form.department_id || null,
      });
      toast.success("Employee added successfully");
      setForm({ full_name: "", email: "", mobile_number: "", designation: "", department_id: "", employment_type: "full_time", gender: "", joining_date: new Date().toISOString().split("T")[0] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to add employee");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <UserPlus className="h-3.5 w-3.5" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Add New Employee</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="John Smith" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="john@company.com" />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={form.mobile_number} onChange={e => set("mobile_number", e.target.value)} placeholder="+61 400 000 000" />
          </div>
          <div>
            <Label className="text-xs">Designation / Role</Label>
            <Input value={form.designation} onChange={e => set("designation", e.target.value)} placeholder="Sales Manager" />
          </div>
          <div>
            <Label className="text-xs">Department</Label>
            <Select value={form.department_id} onValueChange={v => set("department_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Employment Type</Label>
            <Select value={form.employment_type} onValueChange={v => set("employment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Gender</Label>
            <Select value={form.gender} onValueChange={v => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Joining Date</Label>
            <Input type="date" value={form.joining_date} onChange={e => set("joining_date", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Adding..." : "Add Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
