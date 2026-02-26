import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, DollarSign, Target, FileText, Globe } from "lucide-react";

const AnalyticsDashboardPage = () => {
  const { summary, loading } = useAnalytics();

  const cards = [
    { label: "Total Leads", value: summary.totalLeads, icon: Users, color: "text-blue-500" },
    { label: "Total Deals", value: summary.totalDeals, icon: Target, color: "text-purple-500" },
    { label: "Won Deals", value: summary.wonDeals, icon: TrendingUp, color: "text-green-500" },
    { label: "Conversion Rate", value: `${summary.conversionRate}%`, icon: BarChart3, color: "text-orange-500" },
    { label: "Total Invoices", value: summary.totalInvoices, icon: FileText, color: "text-indigo-500" },
    { label: "Paid Invoices", value: summary.paidInvoices, icon: DollarSign, color: "text-emerald-500" },
    { label: "Total Revenue", value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { label: "Active SEO Campaigns", value: summary.activeCampaigns, icon: Globe, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Business performance overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Lead → Deal Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FunnelBar label="Leads" value={summary.totalLeads} max={Math.max(summary.totalLeads, 1)} />
              <FunnelBar label="Deals" value={summary.totalDeals} max={Math.max(summary.totalLeads, 1)} />
              <FunnelBar label="Won" value={summary.wonDeals} max={Math.max(summary.totalLeads, 1)} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FunnelBar label="Total" value={summary.totalInvoices} max={Math.max(summary.totalInvoices, 1)} />
              <FunnelBar label="Paid" value={summary.paidInvoices} max={Math.max(summary.totalInvoices, 1)} />
              <div className="pt-2 text-sm text-muted-foreground">
                Collection rate: {summary.totalInvoices > 0 ? Math.round((summary.paidInvoices / summary.totalInvoices) * 100) : 0}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const FunnelBar = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span>{label}</span><span className="font-medium">{value}</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

export default AnalyticsDashboardPage;
