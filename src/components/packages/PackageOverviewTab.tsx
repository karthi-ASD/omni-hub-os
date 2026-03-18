import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, AlertTriangle, SkipForward, DollarSign, Calendar, CreditCard, TrendingUp } from "lucide-react";
import type { ClientPackage, PackageInstallment } from "@/hooks/useClientPackage";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  pkg: ClientPackage;
  installments: PackageInstallment[];
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  nextDueDate: string | null;
  onMarkPaid: (id: string) => void;
  onMarkSkipped: (id: string) => void;
  isReadOnly?: boolean;
}

export default function PackageOverviewTab({
  pkg, installments, totalPaid, totalOutstanding, overdueAmount, nextDueDate,
  onMarkPaid, onMarkSkipped, isReadOnly,
}: Props) {
  const statusColor = (s: string) => {
    if (s === "paid") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (s === "overdue") return "bg-red-500/10 text-red-600 border-red-200";
    if (s === "skipped") return "bg-amber-500/10 text-amber-600 border-amber-200";
    return "bg-sky-500/10 text-sky-600 border-sky-200";
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (s === "overdue") return <AlertTriangle className="h-3.5 w-3.5" />;
    if (s === "skipped") return <SkipForward className="h-3.5 w-3.5" />;
    return <Clock className="h-3.5 w-3.5" />;
  };

  // Auto-detect overdue on client side as well (server already synced)
  const enriched = installments.map(i => ({
    ...i,
    status: i.status === "pending" && new Date(i.due_date) < new Date() ? "overdue" : i.status,
  }));

  return (
    <div className="space-y-6">
      {/* Package Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Package</p>
            <p className="text-lg font-bold text-foreground">{pkg.package_name}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{pkg.contract_type.replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="text-xs">{pkg.payment_type}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Start Date</p>
            <p className="text-lg font-bold text-foreground">{new Date(pkg.start_date).toLocaleDateString("en-AU")}</p>
          </CardContent>
        </Card>
        {pkg.end_date && (
          <Card className="border border-border/50">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">End Date</p>
              <p className="text-lg font-bold text-foreground">{new Date(pkg.end_date).toLocaleDateString("en-AU")}</p>
            </CardContent>
          </Card>
        )}
        <Card className="border border-border/50">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-lg font-bold text-foreground">{fmt(Number(pkg.total_value))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Value", value: fmt(Number(pkg.total_value)), icon: DollarSign, color: "text-primary" },
              { label: "Total Paid", value: fmt(totalPaid), icon: CheckCircle2, color: "text-emerald-600" },
              { label: "Outstanding", value: fmt(totalOutstanding), icon: TrendingUp, color: "text-sky-600" },
              { label: "Overdue", value: fmt(overdueAmount), icon: AlertTriangle, color: "text-red-600" },
              { label: "Next Due", value: nextDueDate ? new Date(nextDueDate).toLocaleDateString("en-AU") : "—", icon: Calendar, color: "text-amber-600" },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-muted/30">
                <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {enriched.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {enriched.map(inst => (
                <div
                  key={inst.id}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    inst.status === "paid" ? "bg-emerald-500 text-white border-emerald-600" :
                    inst.status === "overdue" ? "bg-red-500 text-white border-red-600" :
                    inst.status === "skipped" ? "bg-amber-400 text-white border-amber-500" :
                    "bg-sky-100 text-sky-700 border-sky-300"
                  }`}
                  title={`#${inst.installment_number} - ${inst.status}${inst.is_missed ? " (missed)" : ""}`}
                >
                  {inst.installment_number}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installment Table */}
      {enriched.length > 0 && (
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Installments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {!isReadOnly && <TableHead className="w-40">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(inst => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.installment_number}</TableCell>
                    <TableCell>{new Date(inst.due_date).toLocaleDateString("en-AU")}</TableCell>
                    <TableCell className="font-semibold">{fmt(Number(inst.amount))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${statusColor(inst.status)}`}>
                        {statusIcon(inst.status)} {inst.status}
                      </Badge>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        {inst.status !== "paid" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onMarkPaid(inst.id)}>
                              Mark Paid
                            </Button>
                            {inst.status !== "skipped" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => onMarkSkipped(inst.id)}>
                                Skip
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
