import { useBillingStats } from "@/hooks/useBillingStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ShieldOff } from "lucide-react";

const BillingDashboard = () => {
  const { stats, loading } = useBillingStats();

  const cards = [
    { title: "Revenue This Month", value: `$${stats.revenueThisMonth.toFixed(2)}`, icon: DollarSign, subtitle: "Total received" },
    { title: "MRR", value: `$${stats.mrr.toFixed(2)}`, icon: TrendingUp, subtitle: "Monthly recurring" },
    { title: "Overdue Invoices", value: stats.overdueInvoices, icon: AlertTriangle, subtitle: "Need attention" },
    { title: "Paid Invoices", value: stats.totalPaid, icon: CheckCircle, subtitle: "All time" },
    { title: "Open Invoices", value: stats.totalOpen, icon: Clock, subtitle: "Awaiting payment" },
    { title: "Suspended Accounts", value: stats.suspendedAccounts, icon: ShieldOff, subtitle: "Active suspensions" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Billing Overview</h1>
        <p className="text-muted-foreground">Revenue and billing metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{card.value}</p>}
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BillingDashboard;
