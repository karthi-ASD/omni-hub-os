import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboardStats } from "@/hooks/useClientDashboardStats";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Target, FolderKanban, Users, Phone, Ticket, Receipt,
  DollarSign, Search, Calendar, ArrowRight, BarChart3,
  Globe, Briefcase, TrendingUp, ArrowUpRight,
} from "lucide-react";

const EmptyHint = ({ text }: { text: string }) => (
  <p className="text-xs text-muted-foreground mt-1">{text}</p>
);

const ClientDashboardPage = () => {
  usePageTitle("Dashboard", "Your business overview");
  const { profile } = useAuth();
  const { stats, loading } = useClientDashboardStats();
  const navigate = useNavigate();

  const statCards = [
    { label: "Leads", value: stats.totalLeads, icon: Target, gradient: "from-primary to-accent", to: "/leads" },
    { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-neon-green to-success", to: "/deals" },
    { label: "Customers", value: stats.totalCustomers, icon: Users, gradient: "from-neon-blue to-info", to: "/clients" },
    { label: "Today's Calls", value: stats.todayCalls, icon: Phone, gradient: "from-accent to-neon-blue", to: "/calendar" },
    { label: "Open Tickets", value: stats.openTickets, icon: Ticket, gradient: "from-neon-orange to-warning", to: "/unified-tickets" },
    { label: "Invoices Due", value: stats.openInvoices, icon: Receipt, gradient: "from-neon-pink to-destructive", to: "/invoices" },
    { label: "SEO Keywords", value: stats.seoKeywords, icon: Search, gradient: "from-neon-purple to-primary", to: "/seo" },
    { label: "Upcoming Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success", to: "/calendar" },
  ];

  const quickActions = [
    { label: "My Leads", icon: Target, to: "/leads" },
    { label: "My Deals", icon: FolderKanban, to: "/deals" },
    { label: "Customers", icon: Users, to: "/clients" },
    { label: "SEO", icon: Globe, to: "/seo" },
    { label: "Reports", icon: BarChart3, to: "/client-reports" },
    { label: "Invoices", icon: Receipt, to: "/invoices" },
    { label: "Support", icon: Ticket, to: "/unified-tickets" },
    { label: "My Package", icon: Briefcase, to: "/my-billing" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "User"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's your business overview.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <Card
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border-0 shadow-elevated hover-lift transition-all duration-300 cursor-pointer"
            onClick={() => navigate(s.to)}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <CardContent className="p-4 relative z-10">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </span>
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-glow-sm group-hover:scale-110 transition-transform`}>
                      <s.icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                  {s.value === 0 && <EmptyHint text="No data available yet" />}
                </>
              )}
            </CardContent>
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-200 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all group-hover:scale-110">
                <action.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outstanding balance card */}
      {!loading && stats.outstandingAmount > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated bg-gradient-to-r from-warning/5 to-destructive/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold">Outstanding Balance</p>
                <p className="text-2xl font-bold">${stats.outstandingAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/invoices")}
              className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              View Invoices <ArrowRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Empty state when everything is zero */}
      {!loading && stats.totalLeads === 0 && stats.openDeals === 0 && stats.totalCustomers === 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ArrowUpRight className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your CRM is ready</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Start adding leads, customers, and deals to see your business data here. Your data is completely isolated and private.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientDashboardPage;
