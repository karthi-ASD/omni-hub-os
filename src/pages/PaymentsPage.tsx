import { usePayments } from "@/hooks/usePayments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { CreditCard } from "lucide-react";

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
};

const PaymentsPage = () => {
  const { payments, loading } = usePayments();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Payments" subtitle="Payment transaction history" icon={CreditCard} />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-16 text-center text-muted-foreground">No payments recorded yet</CardContent></Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{p.gateway_provider}</TableCell>
                  <TableCell className="font-mono text-xs">{p.eway_transaction_id || "—"}</TableCell>
                  <TableCell className="font-semibold">${Number(p.amount).toFixed(2)} {p.currency}</TableCell>
                  <TableCell>
                    <Badge className={`border-0 ${statusColors[p.status] || ""}`}>{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default PaymentsPage;
