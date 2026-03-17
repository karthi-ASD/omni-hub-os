import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ClientBillingPortalPage() {
  const { clientId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) {
        setInvoices([]);
        setPayments([]);
        setSchedules([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [invR, payR, schedR] = await Promise.all([
        supabase.from("xero_invoices").select("*").eq("client_id", clientId).order("invoice_date", { ascending: false }),
        supabase.from("xero_payments").select("*").eq("client_id", clientId).order("payment_date", { ascending: false }),
        supabase.from("client_billing_schedules").select("*").eq("client_id", clientId).order("next_billing_date", { ascending: true }),
      ]);

      setInvoices(invR.data || []);
      setPayments(payR.data || []);
      setSchedules(schedR.data || []);
      setLoading(false);
    };

    void fetchData();
  }, [clientId]);

  const summary = useMemo(() => {
    const outstanding = invoices
      .filter((i) => ["AUTHORISED", "SUBMITTED", "OVERDUE"].includes(i.status))
      .reduce((sum, i) => sum + Number(i.amount_due || i.total_amount || 0), 0);
    const totalPaid = invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
    const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

    return {
      totalInvoices: invoices.length,
      totalPaid,
      outstanding,
      overdue,
    };
  }, [invoices]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground">Your full billing summary, invoice history, and payment visibility.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Invoices", value: summary.totalInvoices, icon: Receipt },
          { label: "Paid Amount", value: fmt(summary.totalPaid), icon: DollarSign },
          { label: "Outstanding", value: fmt(summary.outstanding), icon: Clock },
          { label: "Overdue", value: summary.overdue, icon: AlertTriangle },
        ].map((item) => (
          <Card key={item.label} className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="text-xl font-extrabold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 ? (
        <ClientPortalEmptyState icon={Receipt} />
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="text-base">Invoice List</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number || "—"}</TableCell>
                    <TableCell>{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell>{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(Number(inv.total_amount || 0))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(inv.amount_due || 0))}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <ClientPortalEmptyState className="border-0 shadow-none" icon={DollarSign} />
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 8).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{fmt(Number(payment.payment_amount || 0))}</p>
                      <p className="text-xs text-muted-foreground">{payment.payment_method || "Payment"}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{payment.payment_date ? format(new Date(payment.payment_date), "dd MMM yyyy") : "—"}</p>
                      <p className="font-mono">{payment.transaction_reference || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Billing</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.filter((s) => s.is_active).length === 0 ? (
              <ClientPortalEmptyState className="border-0 shadow-none" icon={Clock} />
            ) : (
              <div className="space-y-3">
                {schedules.filter((s) => s.is_active).slice(0, 8).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold capitalize">{schedule.service_type}</p>
                      <p className="text-xs text-muted-foreground capitalize">{schedule.billing_cycle}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{fmt(Number(schedule.monthly_fee || 0))}</p>
                      <p>{schedule.next_billing_date ? format(new Date(schedule.next_billing_date), "dd MMM yyyy") : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
