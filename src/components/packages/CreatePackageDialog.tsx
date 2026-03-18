import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Props {
  onCreate: (data: any) => Promise<any>;
}

export default function CreatePackageDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    package_name: "Standard Package",
    start_date: new Date().toISOString().split("T")[0],
    contract_type: "month_on_month",
    payment_type: "monthly",
    total_value: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onCreate(form);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Create Package</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Client Package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Package Name</Label>
            <Input value={form.package_name} onChange={e => setForm(p => ({ ...p, package_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contract Type</Label>
              <Select value={form.contract_type} onValueChange={v => setForm(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month_on_month">Month on Month</SelectItem>
                  <SelectItem value="fixed_term">Fixed Term</SelectItem>
                  <SelectItem value="project_based">Project Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={form.payment_type} onValueChange={v => setForm(p => ({ ...p, payment_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                  <SelectItem value="event_based">Event Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Total Value ($)</Label>
            <Input type="number" value={form.total_value} onChange={e => setForm(p => ({ ...p, total_value: parseFloat(e.target.value) || 0 }))} />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Creating…" : "Create Package"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
