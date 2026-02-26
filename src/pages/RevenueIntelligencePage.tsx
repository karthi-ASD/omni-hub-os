import { useRevenueIntelligence } from "@/hooks/useRevenueIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, FunnelChart, Funnel, LabelList,
} from "recharts";
import { format } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--secondary))",
  "hsl(210 60% 50%)",
  "hsl(150 60% 40%)",
  "hsl(30 80% 55%)",
  "hsl(270 50% 55%)",
];

const RevenueIntelligencePage = () => {
  const {
    ledger, attribution, costs, subscriptionMetrics, forecasts,
    churnSignals, loading,
    excludeDemo, setExcludeDemo,
    totalRevenue, totalCosts, grossProfit, marginPercent, overdueCount,
    latestMrr, latestForecast, atRiskClients, channelBreakdown,
  } = useRevenueIntelligence();

  // Revenue by month chart data
  const revenueByMonth: Record<string, { month: string; revenue: number; costs: number }> = {};
  ledger.filter(e => e.status === "PAID" && e.invoice_date).forEach(e => {
    const m = e.invoice_date.slice(0, 7);
    if (!revenueByMonth[m]) revenueByMonth[m] = { month: m, revenue: 0, costs: 0 };
    revenueByMonth[m].revenue += Number(e.amount_net || 0);
  });
  costs.forEach(c => {
    const m = c.date?.slice(0, 7);
    if (m && revenueByMonth[m]) revenueByMonth[m].costs += Number(c.amount || 0);
  });
  const revenueChartData = Object.values(revenueByMonth).sort((a, b) => a.month.localeCompare(b.month));

  // Channel pie data
  const channelPieData = Object.entries(channelBreakdown).map(([name, value]) => ({ name, value }));

  // MRR chart
  const mrrChartData = subscriptionMetrics.map(s => ({
    date: format(new Date(s.date), "dd MMM"),
    mrr: Number(s.mrr),
    arr: Number(s.arr),
    newMrr: Number(s.new_mrr),
    churned: Number(s.churned_mrr),
  }));

  // Forecast chart
  const forecastChartData = forecasts.slice(0, 12).reverse().map(f => ({
    date: format(new Date(f.snapshot_date), "dd MMM"),
    pipeline: Number(f.weighted_pipeline_value),
    close30: Number(f.expected_close_30d),
    close60: Number(f.expected_close_60d),
    close90: Number(f.expected_close_90d),
  }));

  // Status breakdown for ledger
  const statusCounts = ledger.reduce((acc: Record<string, number>, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revenue Intelligence</h1>
          <p className="text-muted-foreground">Attribution, profitability, forecasting & cohort analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="demo-toggle" className="text-sm">Exclude Demo</Label>
            <Switch id="demo-toggle" checked={excludeDemo} onCheckedChange={setExcludeDemo} />
          </div>
          <Button variant="outline" size="sm" disabled>Export CSV</Button>
          <Button variant="outline" size="sm" disabled>Export PDF</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">${totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${totalCosts.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {grossProfit >= 0 ? <TrendingUp className="h-5 w-5 text-primary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              <span className="text-2xl font-bold">${grossProfit.toLocaleString()}</span>
              <Badge variant="secondary">{marginPercent}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${latestMrr ? Number(latestMrr.mrr).toLocaleString() : "0"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">{overdueCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Revenue vs Costs (Monthly)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                    <Bar dataKey="costs" fill="hsl(var(--destructive))" name="Costs" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Attribution by Channel</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {channelPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>MRR Trend</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mrrChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="mrr" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" name="MRR" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pipeline Forecast</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="close30" stroke="hsl(var(--primary))" name="30-day" />
                    <Line type="monotone" dataKey="close60" stroke="hsl(var(--secondary))" name="60-day" />
                    <Line type="monotone" dataKey="close90" stroke="hsl(var(--muted-foreground))" name="90-day" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attribution */}
        <TabsContent value="attribution">
          <Card>
            <CardHeader><CardTitle>Attribution Events</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attribution.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No attribution data yet</TableCell></TableRow>
                  ) : attribution.slice(0, 50).map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Badge variant="outline">{a.person_type}</Badge></TableCell>
                      <TableCell className="font-medium">{a.channel || "—"}</TableCell>
                      <TableCell>{a.campaign || "—"}</TableCell>
                      <TableCell>{a.keyword || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{a.event_type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability */}
        <TabsContent value="profitability">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenue (Paid)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-primary">${totalRevenue.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Costs</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-destructive">${totalCosts.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margin</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{marginPercent}%</div></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Cost Entries</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Linked To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No cost entries yet</TableCell></TableRow>
                  ) : costs.slice(0, 50).map(c => (
                    <TableRow key={c.id}>
                      <TableCell><Badge variant="outline">{c.cost_type}</Badge></TableCell>
                      <TableCell>{c.linked_entity_type ? `${c.linked_entity_type}` : "—"}</TableCell>
                      <TableCell className="font-medium">${Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{c.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast */}
        <TabsContent value="forecast">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Weighted Pipeline</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${latestForecast ? Number(latestForecast.weighted_pipeline_value).toLocaleString() : "0"}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Close 30d</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${latestForecast ? Number(latestForecast.expected_close_30d).toLocaleString() : "0"}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Close 60d</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${latestForecast ? Number(latestForecast.expected_close_60d).toLocaleString() : "0"}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Close 90d</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${latestForecast ? Number(latestForecast.expected_close_90d).toLocaleString() : "0"}</div></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Forecast History</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="pipeline" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" name="Pipeline" />
                  <Area type="monotone" dataKey="close30" fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" name="30d Close" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk */}
        <TabsContent value="churn">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> At-Risk Clients ({atRiskClients.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Reasons</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churnSignals.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No churn signals detected</TableCell></TableRow>
                  ) : churnSignals.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.client_id}</TableCell>
                      <TableCell>
                        <Badge variant={c.risk_score >= 80 ? "destructive" : c.risk_score >= 60 ? "secondary" : "outline"}>
                          {c.risk_score}/100
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {c.reasons_json ? (Array.isArray(c.reasons_json) ? c.reasons_json.join(", ") : JSON.stringify(c.reasons_json)) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger */}
        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Ledger</CardTitle>
                <div className="flex gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <Badge key={status} variant="outline">{status}: {String(count)}</Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No ledger entries yet</TableCell></TableRow>
                  ) : ledger.slice(0, 100).map(e => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant="outline">{e.entity_type}</Badge></TableCell>
                      <TableCell>{e.ledger_scope === "NEXTWEB_PLATFORM" ? "Platform" : "Tenant"}</TableCell>
                      <TableCell className="font-medium">${Number(e.amount_net).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "PAID" ? "default" : e.status === "PENDING" ? "secondary" : "destructive"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{e.provider || "—"}</TableCell>
                      <TableCell>{e.invoice_date || "—"}</TableCell>
                      <TableCell className={e.due_date && new Date(e.due_date) < new Date() && e.status === "PENDING" ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {e.due_date || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueIntelligencePage;
