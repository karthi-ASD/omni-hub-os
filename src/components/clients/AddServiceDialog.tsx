import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
}

export interface ServiceFormData {
  service_type: string;
  service_name: string;
  price_amount: number;
  billing_cycle: string;
  payment_method: string;
  billing_date: number;
  next_billing_date: string;
  payment_status: string;
}

const SERVICE_TYPES = ["SEO", "Website Maintenance", "Hosting", "Domain", "Google Ads", "Social Media", "Other"];
const BILLING_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "yearly", label: "Yearly" },
];
const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "eft", label: "EFT" },
];
const PAYMENT_STATUSES = ["pending", "paid", "overdue"];

export function AddServiceDialog({ open, onOpenChange, onSubmit }: AddServiceDialogProps) {
  const [form, setForm] = useState<ServiceFormData>({
    service_type: "",
    service_name: "",
    price_amount: 0,
    billing_cycle: "monthly",
    payment_method: "eft",
    billing_date: 1,
    next_billing_date: "",
    payment_status: "pending",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.service_type || !form.price_amount) return;
    setSubmitting(true);
    await onSubmit(form);
    setForm({
      service_type: "",
      service_name: "",
      price_amount: 0,
      billing_cycle: "monthly",
      payment_method: "eft",
      billing_date: 1,
      next_billing_date: "",
      payment_status: "pending",
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Recurring Service</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Service Type *</Label>
            <Select value={form.service_type} onValueChange={v => setForm(p => ({ ...p, service_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service Name</Label>
            <Input value={form.service_name} onChange={e => setForm(p => ({ ...p, service_name: e.target.value }))} placeholder="e.g. SEO Retainer" />
          </div>
          <div>
            <Label>Amount *</Label>
            <Input type="number" min={0} step={0.01} value={form.price_amount || ""} onChange={e => setForm(p => ({ ...p, price_amount: parseFloat(e.target.value) || 0 }))} placeholder="800" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Billing Frequency</Label>
              <Select value={form.billing_cycle} onValueChange={v => setForm(p => ({ ...p, billing_cycle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Billing Date (Day of Month)</Label>
              <Input type="number" min={1} max={31} value={form.billing_date} onChange={e => setForm(p => ({ ...p, billing_date: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <Label>Next Billing Date *</Label>
              <Input type="date" value={form.next_billing_date} onChange={e => setForm(p => ({ ...p, next_billing_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={form.payment_status} onValueChange={v => setForm(p => ({ ...p, payment_status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.service_type || !form.price_amount || submitting}>
            {submitting ? "Adding..." : "Add Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
