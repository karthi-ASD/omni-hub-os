import { useSalesCommandCenter } from "@/hooks/useSalesCommandCenter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Target, TrendingUp, DollarSign, Users, BarChart3, Trophy,
  Clock, Zap, Phone, CalendarCheck, FileText, Briefcase,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fmt = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const STAGE_COLORS: Record<string, string> = {
  new: "hsl(var(--info))",
  contacted: "hsl(var(--neon-blue))",
  meeting_booked: "hsl(var(--warning))",
  needs_analysis: "hsl(var(--neon-orange))",
  proposal_requested: "hsl(var(--neon-purple))",
  negotiation: "hsl(var(--accent))",
  won: "hsl(var(--success))",
  lost: "hsl(var(--destructive))",
};

const SOURCE_LABELS: Record<string, string> = {
  inquiry: "Website Inquiry",
  cold_call: "Cold Calling",
  referral: "Referral",
  manual: "Manual Entry",
  other: "Other",
  website_form: "Website Form",
};

const SalesCommandCenterPage = () => {
  usePageTitle("Sales Command Center");
  const {
    loading, isAdmin,
    leadsThisMonth, leadsConvertedThisMonth, conversionRate, revenueClosed, pipelineRevenue,
    pipelineByStage, forecast, agentPerformance,
    leadSourceBreakdown, serviceSalesBreakdown, topDeals, avgResponseTime,
  } = useSalesCommandCenter();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader icon={Zap} title="Sales Command Center" subtitle="Real-time pipeline, performance & forecasting intelligence" />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Leads This Month" value={leadsThisMonth} subtitle="New leads added" icon={Target} gradient="from-[hsl(var(--neon-blue))] to-[hsl(var(--info))]" loading={loading} />
        <StatCard title="Leads Converted" value={leadsConvertedThisMonth} subtitle="Won this month" icon={Users} gradient="from-[hsl(var(--success))] to-[hsl(var(--neon-green))]" loading={loading} />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} subtitle="This month" icon={TrendingUp} gradient="from-[hsl(var(--neon-purple))] to-primary" loading={loading} />
        <StatCard title="Revenue Closed" value={fmt(revenueClosed)} subtitle="Deals won this month" icon={DollarSign} gradient="from-primary to-accent" loading={loading} />
        <StatCard title="Pipeline Revenue" value={fmt(pipelineRevenue)} subtitle="Active deals total" icon={Briefcase} gradient="from-[hsl(var(--warning))] to-[hsl(var(--neon-orange))]" loading={loading} />
      </div>

      {/* Pipeline Chart + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Sales Pipeline</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineByStage.filter((s) => s.stage !== "lost")}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {pipelineByStage.filter((s) => s.stage !== "lost").map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {pipelineByStage.filter((s) => !["won", "lost"].includes(s.stage)).map((s) => (
                <div key={s.stage} className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{s.deals}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xs font-medium">{fmt(s.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Revenue Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Next 30 Days", value: forecast.next30, color: "text-[hsl(var(--success))]" },
              { label: "Next 60 Days", value: forecast.next60, color: "text-[hsl(var(--warning))]" },
              { label: "Next 90 Days", value: forecast.next90, color: "text-[hsl(var(--info))]" },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <p className="text-sm text-muted-foreground">{f.label}</p>
                <p className={`text-2xl font-bold ${f.color}`}>{fmt(f.value)}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Based on deal stage probability × estimated value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="flex-wrap">
          {isAdmin && <TabsTrigger value="agents">Agent Performance</TabsTrigger>}
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="services">Service Breakdown</TabsTrigger>
          <TabsTrigger value="topdeals">Top Deals</TabsTrigger>
          {isAdmin && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
          {isAdmin && <TabsTrigger value="response">Response Time</TabsTrigger>}
        </TabsList>

        {/* Agent Performance */}
        {isAdmin && (
          <TabsContent value="agents">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Agent Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Calls</TableHead>
                      <TableHead className="text-center">Meetings</TableHead>
                      <TableHead className="text-center">Proposals</TableHead>
                      <TableHead className="text-center">Deals Won</TableHead>
                      <TableHead className="text-center">Conv. %</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No agent data</TableCell></TableRow>
                    ) : (
                      agentPerformance.map((a) => (
                        <TableRow key={a.agentId}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-center">{a.leads}</TableCell>
                          <TableCell className="text-center">{a.calls}</TableCell>
                          <TableCell className="text-center">{a.meetings}</TableCell>
                          <TableCell className="text-center">{a.proposals}</TableCell>
                          <TableCell className="text-center">{a.dealsWon}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={Number(a.conversionRate) >= 20 ? "default" : "secondary"}>{a.conversionRate}%</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{fmt(a.revenueClosed)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Lead Sources */}
        <TabsContent value="sources">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Lead Source Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadSourceBreakdown.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No lead data</TableCell></TableRow>
                  ) : (
                    leadSourceBreakdown.map((s) => (
                      <TableRow key={s.source}>
                        <TableCell className="font-medium">{SOURCE_LABELS[s.source] || s.source}</TableCell>
                        <TableCell className="text-center">{s.leads}</TableCell>
                        <TableCell className="text-center">{s.conversions}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(s.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Sales Breakdown */}
        <TabsContent value="services">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Service Sales Breakdown</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-right">Revenue Won</TableHead>
                    <TableHead className="text-right">Pipeline (Expected)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceSalesBreakdown.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No service data</TableCell></TableRow>
                  ) : (
                    serviceSalesBreakdown.map((s) => (
                      <TableRow key={s.service}>
                        <TableCell className="font-medium">{s.service}</TableCell>
                        <TableCell className="text-center">{s.deals}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(s.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(s.pipeline)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Deals */}
        <TabsContent value="topdeals">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Top Pipeline Deals</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Expected Close</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDeals.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No active deals</TableCell></TableRow>
                  ) : (
                    topDeals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.client}</TableCell>
                        <TableCell>{d.business || "—"}</TableCell>
                        <TableCell>{d.service}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(d.value)}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{d.stage.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell>{d.expectedClose || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        {isAdmin && (
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Sales Leaderboard</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-center">Deals Closed</TableHead>
                      <TableHead className="text-center">Conversion %</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.map((a, i) => (
                      <TableRow key={a.agentId} className={i < 3 ? "bg-primary/5" : ""}>
                        <TableCell>
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            i === 0 ? "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground,var(--foreground)))]" :
                            i === 1 ? "bg-muted text-muted-foreground" :
                            i === 2 ? "bg-[hsl(var(--neon-orange))] text-foreground" : "text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-center">{a.dealsWon}</TableCell>
                        <TableCell className="text-center">{a.conversionRate}%</TableCell>
                        <TableCell className="text-right font-bold">{fmt(a.revenueClosed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Response Time */}
        {isAdmin && (
          <TabsContent value="response">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Lead Response Time</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Avg Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avgResponseTime.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No response data available</TableCell></TableRow>
                    ) : (
                      avgResponseTime.map((a) => (
                        <TableRow key={a.agentId}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={a.avgMinutes <= 15 ? "default" : a.avgMinutes <= 30 ? "secondary" : "destructive"}>
                              {a.avgMinutes < 60 ? `${a.avgMinutes} min` : `${(a.avgMinutes / 60).toFixed(1)} hrs`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SalesCommandCenterPage;
