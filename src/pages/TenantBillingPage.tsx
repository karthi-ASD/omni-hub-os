import { useState } from "react";
import { useTenantBilling } from "@/hooks/useTenantBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-destructive/10 text-destructive",
};

const TenantBillingPage = () => {
  const { invoices, payments, loading, createInvoice, sendInvoice, markPaid } = useTenantBilling();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", amount: 0, tax: 0, description: "", due_date: "" });

  const handleCreate = async () => {
    if (!form.customer_name || !form.amount) return;
    await createInvoice(form);
    setOpen(false);
    setForm({ customer_name: "", customer_email: "", amount: 0, tax: 0, description: "", due_date: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Billing</h1>
          <p className="text-muted-foreground">Invoice your own customers through your gateway</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Customer Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Customer Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Customer Name</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                <div><Label>Tax</Label><Input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="text-right font-bold">Total: ${(form.amount + form.tax).toFixed(2)}</div>
              <Button onClick={handleCreate} className="w-full">Create Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No customer invoices yet</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{inv.description || "—"}</TableCell>
                  <TableCell className="font-medium">${Number(inv.total).toFixed(2)}</TableCell>
                  <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inv.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => sendInvoice(inv.id)}><Send className="h-3 w-3 mr-1" /> Send</Button>
                      )}
                      {(inv.status === "sent" || inv.status === "failed") && (
                        <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)}><CheckCircle className="h-3 w-3 mr-1" /> Paid</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {payments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Customer Payment History</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="capitalize">{p.gateway_type}</TableCell>
                    <TableCell className="font-medium">${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="secondary" className={p.status === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TenantBillingPage;
