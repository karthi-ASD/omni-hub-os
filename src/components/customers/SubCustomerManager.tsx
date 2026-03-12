import React, { useState } from "react";
import { useSubCustomers } from "@/hooks/useSubCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Trash2, Loader2 } from "lucide-react";

interface SubCustomerManagerProps {
  customerId: string;
  customerName: string;
}

const SubCustomerManager: React.FC<SubCustomerManagerProps> = ({ customerId, customerName }) => {
  const { subCustomers, loading, create, remove } = useSubCustomers(customerId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "staff" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.name) { return; }
    setCreating(true);
    await create(form);
    setForm({ name: "", email: "", phone: "", role: "staff" });
    setOpen(false);
    setCreating(false);
  };

  return (
    <Card className="rounded-2xl border-border shadow-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Sub-Customers of {customerName}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sub-Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Name *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sub-customer name" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Phone</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Role</Label>
                  <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Manager, Staff" className="h-10 rounded-lg" />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={creating || !form.name}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Sub-Customer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : subCustomers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No sub-customers yet</p>
        ) : (
          <div className="space-y-2">
            {subCustomers.map(sc => (
              <div key={sc.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium">{sc.name}</p>
                  <p className="text-xs text-muted-foreground">{sc.email || "No email"} · {sc.phone || "No phone"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{sc.role}</Badge>
                  <Badge className={sc.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                    {sc.status}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(sc.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubCustomerManager;
