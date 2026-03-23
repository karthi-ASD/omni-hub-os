import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboardData } from "@/hooks/useClientDashboardData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { CustomerCommunicationSummary } from "@/components/crm/CustomerCommunicationSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Target, FolderKanban, Users, Phone, Ticket, Receipt,
  DollarSign, Search, Globe, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, ArrowRight, Minus,
  CheckCircle, Plus, BarChart3, Headphones, Shield,
  Zap, ExternalLink, Rocket, Eye, Clock, Wifi,
} from "lucide-react";

/* ─── helpers ─── */
const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const RankBadge = ({ current, previous }: { current: number | null; previous: number | null }) => {
  if (!current) return <span className="text-muted-foreground text-xs">—</span>;
  const diff = previous ? previous - current : 0;
  if (diff > 0) return <span className="text-success font-semibold text-xs flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />+{diff}</span>;
  if (diff < 0) return <span className="text-destructive font-semibold text-xs flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" />{diff}</span>;
  return <span className="text-muted-foreground text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" />0</span>;
};

/* ─── main ─── */
const ClientDashboardPage = () => {
  usePageTitle("Dashboard", "Your business growth dashboard");
  const { profile } = useAuth();
  const { data, loading } = useClientDashboardData();
  const navigate = useNavigate();

  const kwTop3 = data.seoKeywords.filter(k => k.current_ranking && k.current_ranking <= 3).length;
  const kwTop10 = data.seoKeywords.filter(k => k.current_ranking && k.current_ranking <= 10).length;
  const kwTop20 = data.seoKeywords.filter(k => k.current_ranking && k.current_ranking <= 20).length;
  const totalKwGrowth = data.seoKeywords.reduce((sum, k) => {
    if (k.current_ranking && k.previous_ranking) return sum + (k.previous_ranking - k.current_ranking);
    return sum;
  }, 0);

  const monthlyFee = data.services.reduce((s, svc) => s + (svc.price_amount ?? 0), 0);
  const completedWork = data.workLog.filter(t => t.status === "completed").length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in">

        {/* ══════════════════ 1. HERO SECTION ══════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-6 md:p-8 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--neon-blue)/0.2),_transparent_60%)]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6" />
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Your Business is Growing
                </h1>
              </div>
              <p className="text-primary-foreground/80 text-sm md:text-base max-w-md">
                Here's what NextWeb is doing for you this month
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Leads This Month", value: data.leadsThisMonth, icon: Target, prefix: "" },
                { label: "Calls Generated", value: data.callsThisMonth, icon: Phone, prefix: "" },
                { label: "Active Deals", value: data.openDeals, icon: FolderKanban, prefix: "" },
                { label: "Keyword Growth", value: totalKwGrowth, icon: TrendingUp, prefix: totalKwGrowth > 0 ? "+" : "", suffix: " pos" },
              ].map(m => (
                <div key={m.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-primary-foreground/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <m.icon className="h-3.5 w-3.5 text-primary-foreground/70" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">{m.label}</span>
                  </div>
                  <AnimatedCounter
                    end={m.value}
                    prefix={m.prefix}
                    suffix={m.suffix || ""}
                    className="text-2xl md:text-3xl font-black"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════ 2. PERFORMANCE STRIP ══════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: data.totalLeads, icon: Target, color: "text-success" },
            { label: "Calls Total", value: data.totalCalls, icon: Phone, color: "text-info" },
            { label: "Customers", value: data.totalCustomers, icon: Users, color: "text-primary" },
            { label: "Open Tickets", value: data.openTickets, icon: Ticket, color: "text-warning" },
          ].map(s => (
            <Card key={s.label} className="rounded-2xl border-0 shadow-elevated group hover-lift transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-card flex items-center justify-center border border-border/50 ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <AnimatedCounter end={s.value} className="text-xl font-extrabold" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ══════════════════ 3. SEO PERFORMANCE ══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keyword Distribution */}
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Keyword Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.seoKeywords.length > 0 ? (
                <>
                  {[
                    { label: "Top 3", count: kwTop3, color: "bg-success", width: `${Math.min((kwTop3 / Math.max(data.seoKeywords.length, 1)) * 100, 100)}%` },
                    { label: "Top 10", count: kwTop10, color: "bg-info", width: `${Math.min((kwTop10 / Math.max(data.seoKeywords.length, 1)) * 100, 100)}%` },
                    { label: "Top 20", count: kwTop20, color: "bg-primary", width: `${Math.min((kwTop20 / Math.max(data.seoKeywords.length, 1)) * 100, 100)}%` },
                  ].map(tier => (
                    <div key={tier.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-muted-foreground">{tier.label}</span>
                        <span className="font-bold">{tier.count} keywords</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${tier.color} rounded-full transition-all duration-1000`} style={{ width: tier.width }} />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Your SEO campaign is getting started. Data will appear soon.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Keywords Table */}
          <Card className="rounded-2xl border-0 shadow-elevated lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> Top Performing Keywords
              </CardTitle>
              {data.seoKeywords.length > 0 && (
                <button onClick={() => navigate("/client-seo-projects")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </CardHeader>
            <CardContent>
              {data.seoKeywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-xs text-center">Rank</TableHead>
                      <TableHead className="text-xs text-center">Change</TableHead>
                      <TableHead className="text-xs text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.seoKeywords.slice(0, 8).map(kw => (
                      <TableRow key={kw.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{kw.keyword}</TableCell>
                        <TableCell className="text-center">
                          {kw.current_ranking ? (
                            <Badge variant={kw.current_ranking <= 3 ? "default" : kw.current_ranking <= 10 ? "secondary" : "outline"} className="font-mono text-xs">
                              #{kw.current_ranking}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center"><RankBadge current={kw.current_ranking} previous={kw.previous_ranking} /></TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{kw.search_volume?.toLocaleString() ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Your SEO campaign is getting started. Keywords will appear here soon.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ══════════════════ 4. LEAD INTELLIGENCE + 5. COMPETITORS ══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Latest Leads
              </CardTitle>
              <button onClick={() => navigate("/leads")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </CardHeader>
            <CardContent>
              {data.recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {data.recentLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{lead.name?.[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{lead.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {lead.source || "Direct"} • {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{lead.stage}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No leads captured yet. They'll appear here automatically.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor Insights */}
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-info" /> Competitor Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.seoCompetitors.length > 0 ? (
                <div className="space-y-3">
                  {data.seoCompetitors.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-semibold">{comp.competitor_name || comp.competitor_domain}</p>
                        <p className="text-[10px] text-muted-foreground">{comp.competitor_domain}</p>
                      </div>
                      {comp.ranking_position && (
                        <Badge variant="outline" className="font-mono text-xs">Rank #{comp.ranking_position}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Your campaign is getting started. Competitor analysis will appear soon.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ══════════════════ 6. WORK LOG ══════════════════ */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" /> Work Done This Month
            </CardTitle>
            <button onClick={() => navigate("/client-seo-projects")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              View Full Report <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {data.workLog.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.workLog.map(task => (
                  <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <CheckCircle className={`h-4 w-4 shrink-0 ${task.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.task_title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{task.task_category}</p>
                    </div>
                    <Badge variant={task.status === "completed" ? "default" : "secondary"} className="ml-auto text-[10px] shrink-0">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Work log will appear here as tasks are completed
              </div>
            )}
            {completedWork > 0 && (
              <div className="mt-4 text-center text-xs text-muted-foreground">
                ✅ {completedWork} tasks completed this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════ 7. BILLING + ROI ══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Plan */}
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.services.length > 0 ? (
                <>
                  {data.services.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-semibold capitalize">{svc.service_name || svc.service_type}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{svc.billing_cycle || "monthly"} billing</p>
                      </div>
                      <p className="text-sm font-bold">{fmt(svc.price_amount ?? 0)}<span className="text-[10px] text-muted-foreground">/{(svc.billing_cycle || "month").slice(0, 2)}</span></p>
                    </div>
                  ))}
                  {data.services[0]?.next_billing_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" />
                      Next billing: {new Date(data.services[0].next_billing_date).toLocaleDateString("en-AU")}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No active services
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROI Box */}
          <Card className="rounded-2xl border-0 shadow-elevated bg-gradient-to-br from-success/5 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" /> Your ROI & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-card/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
                  <AnimatedCounter end={data.totalPaid} prefix="$" className="text-xl font-extrabold" />
                </div>
                <div className="text-center p-3 rounded-xl bg-card/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Invoices</p>
                  <AnimatedCounter end={data.totalInvoices} className="text-xl font-extrabold text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-card/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Leads Generated</p>
                  <AnimatedCounter end={data.totalLeads} className="text-xl font-extrabold text-success" />
                </div>
                <div className="text-center p-3 rounded-xl bg-card/50">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Open Invoices</p>
                  <AnimatedCounter end={data.openInvoices} className="text-xl font-extrabold text-warning" />
                </div>
              </div>
              {data.outstandingAmount > 0 ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-warning" />
                    <span className="text-sm font-semibold">Outstanding Balance</span>
                  </div>
                  <span className="text-sm font-bold text-warning">{fmt(data.outstandingAmount)}</span>
                </div>
              ) : data.totalInvoices > 0 ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold text-success">All invoices paid</span>
                  </div>
                  <span className="text-sm font-bold text-success">No outstanding balance</span>
                </div>
              ) : null}
              <button
                onClick={() => navigate("/my-billing")}
                className="w-full text-center text-sm text-primary font-semibold py-2 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
              >
                View Billing Details <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* ══════════════════ 8. WEBSITE STATUS ══════════════════ */}
        {data.websites.length > 0 && (
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-info" /> Website & Hosting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.websites.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${w.website_status === "active" || w.website_status === "live" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-semibold">{w.website_url}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{w.website_status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Shield className="h-4 w-4 text-success" />
                        </TooltipTrigger>
                        <TooltipContent>SSL Active</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Wifi className="h-4 w-4 text-success" />
                        </TooltipTrigger>
                        <TooltipContent>Online</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══════════════════ 9. ACTION CENTER ══════════════════ */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {[
              { label: "Add Customer", icon: Plus, to: "/clients" },
              { label: "View Leads", icon: Target, to: "/leads" },
              { label: "My Deals", icon: FolderKanban, to: "/deals" },
              { label: "SEO Projects", icon: Globe, to: "/client-seo-projects" },
              { label: "View Reports", icon: BarChart3, to: "/client-reports" },
              { label: "Invoices", icon: Receipt, to: "/my-billing" },
              { label: "Raise Ticket", icon: Ticket, to: "/unified-tickets" },
              { label: "My Package", icon: Briefcase, to: "/my-package" },
            ].map(action => (
              <button
                key={action.to + action.label}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-200 group"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all group-hover:scale-110">
                  <action.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════ 10. SUPPORT BLOCK ══════════════════ */}
        <Card className="rounded-2xl border-0 shadow-elevated bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Need Help?</p>
                <p className="text-xs text-muted-foreground">Our support team is here for you • Avg response: &lt; 2 hrs</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/unified-tickets")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-glow-sm"
            >
              <Ticket className="h-4 w-4" /> Raise a Ticket
            </button>
          </CardContent>
        </Card>

        {/* ══════════════════ EMPTY STATE (if truly no data) ══════════════════ */}
        {data.totalLeads === 0 && data.openDeals === 0 && data.seoKeywords.length === 0 && data.services.length === 0 && (
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ArrowUpRight className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome to your dashboard!</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your services are being set up. As leads come in, SEO rankings improve, and tasks are completed — you'll see everything here in real time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ClientDashboardPage;
