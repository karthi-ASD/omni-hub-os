import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ClientBillingPortalPage = () => {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const clientId = profile?.user_id;

  const fetchData = useCallback(async () => {
    if (!clientId || !profile?.business_id) return;
    setLoading(true);

    // Find client record for this user
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", profile.business_id)
      .eq("user_id", clientId)
      .single();

    if (!clientRecord) {
      setLoading(false);
      return;
    }

    const cid = clientRecord.id;

    const [invR, payR, schedR] = await Promise.all([
      supabase.from("xero_invoices").select("*").eq("client_id", cid).order("invoice_date", { ascending: false }),
      supabase.from("xero_payments").select("*").eq("client_id", cid).order("payment_date", { ascending: false }),
      supabase.from("client_billing_schedules").select("*").eq("client_id", cid).order("next_billing_date", { ascending: true }),
    ]);

    setInvoices(invR.data || []);
    setPayments(payR.data || []);
    setSchedules(schedR.data || []);
    setLoading(false);
  }, [clientId, profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOutstanding = invoices.filter(i => ["AUTHORISED", "SUBMITTED", "OVERDUE"].includes(i.status)).reduce((s, i) => s + Number(i.amount_due), 0);
  const totalPaid = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.total_amount), 0);
  const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Billing</h1>
        <p className="text-muted-foreground">View your invoices, payments, and upcoming billing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-[hsl(var(--destructive))]" : ""}`}>{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-1" /> My Invoices</TabsTrigger>
          <TabsTrigger value="payments"><DollarSign className="h-4 w-4 mr-1" /> Payment History</TabsTrigger>
          <TabsTrigger value="upcoming"><Calendar className="h-4 w-4 mr-1" /> Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoice_number || "—"}</TableCell>
                        <TableCell className="text-sm">{inv.invoice_date ? format(new Date(inv.invoice_date), "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell className="text-sm">{inv.due_date ? format(new Date(inv.due_date), "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(inv.total_amount))}</TableCell>
                        <TableCell className="text-right">{fmt(Number(inv.amount_due))}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No invoices found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{p.payment_date ? format(new Date(p.payment_date), "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(p.payment_amount))}</TableCell>
                        <TableCell className="text-sm">{p.payment_method || "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{p.transaction_reference || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No payment history.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming Payments</CardTitle></CardHeader>
            <CardContent>
              {schedules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead>Next Billing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.filter(s => s.is_active).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.service_type}</TableCell>
                        <TableCell className="capitalize">{s.billing_cycle}</TableCell>
                        <TableCell className="text-right">{fmt(Number(s.monthly_fee))}</TableCell>
                        <TableCell className="text-sm">{s.next_billing_date ? format(new Date(s.next_billing_date), "dd MMM yyyy") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No upcoming billing schedules.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientBillingPortalPage;
