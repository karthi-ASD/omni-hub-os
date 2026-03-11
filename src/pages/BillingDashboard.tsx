import { useBillingStats } from "@/hooks/useBillingStats";
import { usePlatformBilling } from "@/hooks/usePlatformBilling";
import { useTenantBilling } from "@/hooks/useTenantBilling";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ShieldOff, CreditCard, Users } from "lucide-react";

const BillingDashboard = () => {
  const { stats, loading } = useBillingStats();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { invoices: platformInvoices } = usePlatformBilling();
  const { invoices: tenantInvoices } = useTenantBilling();

  const platformRevenue = platformInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const tenantRevenue = tenantInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={DollarSign} title="Billing Overview" subtitle="Dual billing — Platform & Tenant revenue"
        actions={
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => navigate("/platform-billing")}><CreditCard className="mr-2 h-4 w-4" /> Platform Billing</Button>
            )}
            <Button variant="outline" onClick={() => navigate("/tenant-billing")}><Users className="mr-2 h-4 w-4" /> Customer Billing</Button>
            <Button variant="outline" onClick={() => navigate("/gateways")}>Gateways</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Platform Revenue" value={`$${platformRevenue.toFixed(2)}`} subtitle="NextWeb collections" icon={DollarSign} gradient="from-primary to-accent" loading={loading} />
        <StatCard title="Tenant Revenue" value={`$${tenantRevenue.toFixed(2)}`} subtitle="Your customer collections" icon={Users} gradient="from-[hsl(var(--neon-green))] to-[hsl(var(--success))]" loading={loading} />
        <StatCard title="Revenue This Month" value={`$${stats.revenueThisMonth.toFixed(2)}`} subtitle="Internal invoices" icon={TrendingUp} gradient="from-[hsl(var(--neon-blue))] to-[hsl(var(--info))]" loading={loading} />
        <StatCard title="MRR" value={`$${stats.mrr.toFixed(2)}`} subtitle="Monthly recurring" icon={TrendingUp} gradient="from-[hsl(var(--neon-purple))] to-primary" loading={loading} />
        <StatCard title="Overdue Invoices" value={stats.overdueInvoices} subtitle="Need attention" icon={AlertTriangle} gradient="from-destructive to-destructive/70" loading={loading} />
        <StatCard title="Paid Invoices" value={stats.totalPaid} subtitle="All time" icon={CheckCircle} gradient="from-[hsl(var(--success))] to-[hsl(var(--neon-green))]" loading={loading} />
        <StatCard title="Open Invoices" value={stats.totalOpen} subtitle="Awaiting payment" icon={Clock} gradient="from-[hsl(var(--warning))] to-[hsl(var(--neon-orange))]" loading={loading} />
        <StatCard title="Suspended Accounts" value={stats.suspendedAccounts} subtitle="Active suspensions" icon={ShieldOff} gradient="from-muted-foreground to-muted-foreground/70" loading={loading} />
      </div>
    </div>
  );
};

export default BillingDashboard;
