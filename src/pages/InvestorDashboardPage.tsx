import { useInvestorMetrics } from "@/hooks/useInvestorMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, BarChart3, Brain, Globe, FileText, AlertTriangle } from "lucide-react";

const InvestorDashboardPage = () => {
  const { metrics, loading } = useInvestorMetrics();

  const cards = [
    { label: "MRR", value: `$${metrics.mrr.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
    { label: "ARR", value: `$${metrics.arr.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Active Tenants", value: metrics.activeTenants, icon: Users, color: "text-blue-500" },
    { label: "Avg Revenue/Tenant", value: `$${metrics.avgRevenuePerTenant.toLocaleString()}`, icon: BarChart3, color: "text-purple-500" },
    { label: "Lead→Deal Conversion", value: `${metrics.conversionRate}%`, icon: TrendingUp, color: "text-orange-500" },
    { label: "Paid Invoices", value: metrics.paidInvoices, icon: FileText, color: "text-indigo-500" },
    { label: "Overdue Invoices", value: metrics.overdueInvoices, icon: AlertTriangle, color: "text-red-500" },
    { label: "AI Tasks Run", value: metrics.aiTasksRun, icon: Brain, color: "text-violet-500" },
    { label: "Active SEO Campaigns", value: metrics.activeCampaigns, icon: Globe, color: "text-cyan-500" },
    { label: "Total Leads", value: metrics.totalLeads, icon: Users, color: "text-sky-500" },
    { label: "Total Deals", value: metrics.totalDeals, icon: BarChart3, color: "text-amber-500" },
    { label: "Total Invoices", value: metrics.totalInvoices, icon: FileText, color: "text-teal-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Investor Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide SaaS metrics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestorDashboardPage;
