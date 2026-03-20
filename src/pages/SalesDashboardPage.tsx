import { useNavigate } from "react-router-dom";
import { useSalesPerformanceDashboard } from "@/hooks/useSalesPerformanceDashboard";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, Users, Target, Flame, Snowflake, ThermometerSun,
  Phone, Mail, MessageCircle, CalendarCheck, AlertTriangle, Clock,
  DollarSign, TrendingUp, Trophy, FileText, Eye, CheckCircle,
  XCircle, Timer, Zap, UserCheck, Send,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { format, parseISO } from "date-fns";

const tempIcon = (t: string) => t === "hot" ? "🔥" : t === "warm" ? "⚠️" : "❄️";
const tempColor = (t: string) => t === "hot" ? "destructive" : t === "warm" ? "secondary" : "outline";

const SalesDashboardPage = () => {
  usePageTitle("Sales Dashboard");
  const navigate = useNavigate();
  const {
    loading, isAdmin, clientMetrics, leadMetrics, pipelineStages,
    followUpMetrics, proposalMetrics, revenueMetrics, conversionRate,
    hotLeadsPriority, dailyActivity, leaderboard, myAccountsTable, agingLeads,
  } = useSalesPerformanceDashboard();

  if (loading) return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  );

  const monthTarget = 50000;
  const monthProgress = Math.min((revenueMetrics.monthRevenue / monthTarget) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Dashboard"
        subtitle={isAdmin ? "Company-wide sales performance" : "Your personal performance overview"}
        icon={BarChart3}
      />

      {/* Dialer Shortcut */}
      <Card className="rounded-2xl border-0 shadow-elevated cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]" onClick={() => navigate("/sales/dialer")}>
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sales Dialer</p>
              <p className="text-xs text-muted-foreground">Call leads directly from CRM</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0">Open Dialer</Button>
        </CardContent>
      </Card>

      {/* Section 1: Daily Activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Calls Today" value={dailyActivity.calls} icon={Phone} gradient="from-primary to-accent" />
        <StatCard label="Emails Today" value={dailyActivity.emails} icon={Mail} gradient="from-info to-primary" />
        <StatCard label="WhatsApp Today" value={dailyActivity.whatsapp} icon={MessageCircle} gradient="from-success to-accent" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} gradient="from-warning to-primary" />
      </div>

      {/* Section 2: Client Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={clientMetrics.active} icon={UserCheck} gradient="from-success to-accent" />
        <StatCard label="Pending Clients" value={clientMetrics.pending} icon={Clock} gradient="from-warning to-primary" />
        <StatCard label="Cancelled Clients" value={clientMetrics.cancelled} icon={XCircle} gradient="from-destructive to-warning" />
        <StatCard label="Total Clients" value={clientMetrics.total} icon={Users} gradient="from-primary to-info" />
      </div>

      {/* Section 3: Leads & Prospects */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Leads" value={leadMetrics.total} icon={Target} gradient="from-primary to-accent" />
        <StatCard label="New This Month" value={leadMetrics.newThisMonth} icon={Zap} gradient="from-info to-primary" />
        <StatCard label="🔥 Hot Leads" value={leadMetrics.hot} icon={Flame} gradient="from-destructive to-warning" />
        <StatCard label="⚠️ Warm Leads" value={leadMetrics.warm} icon={ThermometerSun} gradient="from-warning to-accent" />
        <StatCard label="❄️ Cold Leads" value={leadMetrics.cold} icon={Snowflake} gradient="from-info to-primary" />
      </div>

      {/* Section 4: Follow-ups & Proposals */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Follow Ups Today" value={followUpMetrics.today} icon={CalendarCheck} gradient="from-primary to-accent" />
        <StatCard label="Overdue Follow Ups" value={followUpMetrics.overdue} icon={AlertTriangle} gradient="from-destructive to-warning" alert={followUpMetrics.overdue > 0} />
        <StatCard label="Upcoming Follow Ups" value={followUpMetrics.upcoming} icon={Timer} gradient="from-info to-primary" />
      </div>

      {/* Section 5: Proposal Tracking */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Proposals Sent" value={proposalMetrics.sent} icon={Send} gradient="from-primary to-accent" />
        <StatCard label="Proposals Viewed" value={proposalMetrics.viewed} icon={Eye} gradient="from-info to-primary" />
        <StatCard label="Accepted" value={proposalMetrics.accepted} icon={CheckCircle} gradient="from-success to-accent" />
        <StatCard label="Pending" value={proposalMetrics.pending} icon={FileText} gradient="from-warning to-primary" />
        <StatCard label="Expired" value={proposalMetrics.expired} icon={XCircle} gradient="from-destructive to-warning" />
      </div>

      {/* Section 6: Revenue + Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Revenue This Month" value={`$${(revenueMetrics.monthRevenue / 1000).toFixed(1)}k`} icon={DollarSign} gradient="from-success to-accent" />
          <StatCard label="Total Revenue" value={`$${(revenueMetrics.totalRevenue / 1000).toFixed(1)}k`} icon={DollarSign} gradient="from-primary to-info" />
          <StatCard label="Avg Deal Size" value={`$${(revenueMetrics.avgDeal / 1000).toFixed(1)}k`} icon={TrendingUp} gradient="from-warning to-primary" />
        </div>

        {/* Sales Target Progress */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Monthly Sales Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target: <span className="font-semibold text-foreground">${monthTarget.toLocaleString()}</span></span>
              <span className="text-muted-foreground">Closed: <span className="font-semibold text-success">${revenueMetrics.monthRevenue.toLocaleString()}</span></span>
            </div>
            <Progress value={monthProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Remaining: ${(monthTarget - revenueMetrics.monthRevenue).toLocaleString()}</span>
              <span className="font-bold text-foreground">{monthProgress.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 7: Pipeline Funnel */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader><CardTitle className="text-sm">Sales Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {pipelineStages.map((s, i) => {
              const maxCount = Math.max(...pipelineStages.map(x => x.count), 1);
              const height = Math.max(20, (s.count / maxCount) * 100);
              return (
                <div key={s.stage} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-primary/20 to-primary/5 relative flex items-end justify-center"
                    style={{ height: 120 }}
                  >
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-primary to-accent/80 flex items-center justify-center transition-all duration-500"
                      style={{ height: `${height}%` }}
                    >
                      <span className="text-xs font-bold text-primary-foreground">{s.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center font-medium leading-tight">{s.label}</span>
                  <span className="text-[10px] font-semibold text-foreground">${(s.value / 1000).toFixed(0)}k</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Hot Leads Priority + Cold Leads Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-elevated lg:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-destructive" /> Hot Leads Priority</CardTitle></CardHeader>
          <CardContent>
            {hotLeadsPriority.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads to display</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Next Follow Up</TableHead>
                    <TableHead>AI Prediction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotLeadsPriority.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell>
                        <Badge variant={l.score > 70 ? "destructive" : l.score > 30 ? "secondary" : "outline"}>
                          {l.score}
                        </Badge>
                      </TableCell>
                      <TableCell>{tempIcon(l.temperature)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.lastContact ? format(parseISO(l.lastContact), "dd MMM") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {l.nextFollowUp ? format(parseISO(l.nextFollowUp), "dd MMM") : "—"}
                      </TableCell>
                      <TableCell>
                        {l.prediction && (
                          <Badge variant={l.prediction === "likely_to_convert" ? "default" : "secondary"} className="text-[10px]">
                            {l.prediction.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <StatCard label="Cold Leads (14+ days)" value={agingLeads} icon={Snowflake} gradient="from-info to-primary" alert={agingLeads > 5} />
          <StatCard label="Deals Won" value={revenueMetrics.dealsWon} icon={Trophy} gradient="from-success to-accent" />
        </div>
      </div>

      {/* Section 9: Leaderboard (Admin only) */}
      {isAdmin && leaderboard.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Sales Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Deals Won</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((sp, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </TableCell>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell className="text-right">{sp.leads}</TableCell>
                    <TableCell className="text-right">{sp.dealsWon}</TableCell>
                    <TableCell className="text-right font-semibold">${sp.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Section 10: My Accounts */}
      {myAccountsTable.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> My Accounts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Monthly Value</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAccountsTable.slice(0, 15).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs">{c.service}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : c.status === "cancelled" ? "destructive" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${c.monthlyValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">${c.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesDashboardPage;
