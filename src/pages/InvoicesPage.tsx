import { useState } from "react";
import { useInvoices, type Invoice, type InvoiceItem } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, CheckCircle, XCircle, FileText, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  void: "bg-muted text-muted-foreground line-through",
  canceled: "bg-muted text-muted-foreground",
};

const InvoicesPage = () => {
  const {
    invoices, loading, totalCount, hasMore,
    createInvoice, createFromDeal, sendInvoice, markPaid, voidInvoice,
    loadMore, setFilter, statusFilter,
  } = useInvoices();
  const { clients } = useClients();
  const { deals } = useDeals();
  const [open, setOpen] = useState(false);
  const [fromDealOpen, setFromDealOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState("");

  const [form, setForm] = useState({
    client_id: "",
    due_date: "",
    items: [{ description: "", quantity: 1, unit_amount: 0, amount: 0 }] as InvoiceItem[],
    tax: 0,
    discount: 0,
  });

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    (items[idx] as any)[field] = value;
    if (field === "quantity" || field === "unit_amount") {
      items[idx].amount = items[idx].quantity * items[idx].unit_amount;
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unit_amount: 0, amount: 0 }] });

  const handleCreate = async () => {
    if (form.items.some((i) => !i.description)) return;
    await createInvoice({
      client_id: form.client_id || undefined,
      items: form.items,
      tax: form.tax,
      discount: form.discount,
      due_date: form.due_date || undefined,
    });
    setOpen(false);
    setForm({ client_id: "", due_date: "", items: [{ description: "", quantity: 1, unit_amount: 0, amount: 0 }], tax: 0, discount: 0 });
  };

  const handleCreateFromDeal = async () => {
    if (!selectedDealId) return;
    await createFromDeal(selectedDealId);
    setFromDealOpen(false);
    setSelectedDealId("");
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "—";
    const c = clients.find((cl) => cl.id === clientId);
    return c?.contact_name || "Unknown";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">{totalCount} total records</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={fromDealOpen} onOpenChange={setFromDealOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> From Deal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice from Deal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Deal</Label>
                  <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                    <SelectTrigger><SelectValue placeholder="Choose a deal" /></SelectTrigger>
                    <SelectContent>
                      {deals.filter((d) => d.status === "won").map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.deal_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateFromDeal} disabled={!selectedDealId} className="w-full">Generate Invoice</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.contact_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>Line Items</Label>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 mt-2">
                      <Input placeholder="Description" className="col-span-1" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                      <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                      <Input type="number" placeholder="Price" value={item.unit_amount} onChange={(e) => updateItem(idx, "unit_amount", Number(e.target.value))} />
                      <Input type="number" placeholder="Total" value={item.amount} readOnly className="bg-muted" />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addItem} className="mt-2"><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tax</Label>
                    <Input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Discount</Label>
                    <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="text-right text-lg font-bold">
                  Total: ${(form.items.reduce((s, i) => s + i.amount, 0) + form.tax - form.discount).toFixed(2)}
                </div>

                <Button onClick={handleCreate} className="w-full">Create Invoice</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "open", "paid", "overdue", "void"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
      </div>

      {loading && invoices.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No invoices found</CardContent></Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">INV-{inv.invoice_number}</TableCell>
                    <TableCell>{getClientName(inv.client_id)}</TableCell>
                    <TableCell className="capitalize">{inv.invoice_type.replace("_", " ")}</TableCell>
                    <TableCell className="font-medium">${Number(inv.total).toFixed(2)}</TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {inv.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => sendInvoice(inv.id)}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        )}
                        {(inv.status === "open" || inv.status === "overdue") && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                        {inv.status === "draft" && (
                          <Button size="sm" variant="ghost" onClick={() => voidInvoice(inv.id)}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                <ChevronDown className="h-4 w-4 mr-1" />
                {loading ? "Loading..." : `Load more (${invoices.length} of ${totalCount})`}
              </Button>
            </div>
          )}

          {!hasMore && invoices.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing all {invoices.length} of {totalCount} invoices
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default InvoicesPage;
