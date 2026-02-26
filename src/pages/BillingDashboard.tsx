import { useBillingStats } from "@/hooks/useBillingStats";
import { usePlatformBilling } from "@/hooks/usePlatformBilling";
import { useTenantBilling } from "@/hooks/useTenantBilling";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ShieldOff, CreditCard, Users } from "lucide-react";

const BillingDashboard = () => {
  const { stats, loading } = useBillingStats();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { invoices: platformInvoices } = usePlatformBilling();
  const { invoices: tenantInvoices } = useTenantBilling();

  const platformRevenue = platformInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const tenantRevenue = tenantInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);

  const cards = [
    { title: "Platform Revenue", value: `$${platformRevenue.toFixed(2)}`, icon: DollarSign, subtitle: "NextWeb collections" },
    { title: "Tenant Revenue", value: `$${tenantRevenue.toFixed(2)}`, icon: Users, subtitle: "Your customer collections" },
    { title: "Revenue This Month", value: `$${stats.revenueThisMonth.toFixed(2)}`, icon: TrendingUp, subtitle: "Internal invoices" },
    { title: "MRR", value: `$${stats.mrr.toFixed(2)}`, icon: TrendingUp, subtitle: "Monthly recurring" },
    { title: "Overdue Invoices", value: stats.overdueInvoices, icon: AlertTriangle, subtitle: "Need attention" },
    { title: "Paid Invoices", value: stats.totalPaid, icon: CheckCircle, subtitle: "All time" },
    { title: "Open Invoices", value: stats.totalOpen, icon: Clock, subtitle: "Awaiting payment" },
    { title: "Suspended Accounts", value: stats.suspendedAccounts, icon: ShieldOff, subtitle: "Active suspensions" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing Overview</h1>
          <p className="text-muted-foreground">Dual billing — Platform & Tenant revenue</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button variant="outline" onClick={() => navigate("/platform-billing")}>
              <CreditCard className="mr-2 h-4 w-4" /> Platform Billing
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/tenant-billing")}>
            <Users className="mr-2 h-4 w-4" /> Customer Billing
          </Button>
          <Button variant="outline" onClick={() => navigate("/gateways")}>
            Gateways
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
