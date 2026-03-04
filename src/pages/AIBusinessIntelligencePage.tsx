import { useEffect, useState } from "react";
import { useAIBusinessIntelligence } from "@/hooks/useAIBusinessIntelligence";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, Target, Sparkles, Users, BarChart3, Shield,
  AlertTriangle, CheckCircle, XCircle, ArrowRight, Lightbulb, DollarSign,
  Activity, Megaphone, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const priorityIcon = (p: string) => {
  if (p === "CRITICAL" || p === "HIGH") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (p === "MEDIUM") return <Activity className="h-4 w-4 text-accent-foreground" />;
  return <CheckCircle className="h-4 w-4 text-primary" />;
};

const riskColor = (level: string) => {
  if (level === "CRITICAL") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "HIGH") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (level === "MEDIUM") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
};

const AIBusinessIntelligencePage = () => {
  const {
    loading, leadScores, marketingInsights, recommendations, customerHealth, forecasts,
    fetchAll, runLeadScoring, runChurnDetection, runMarketingAnalysis, runRecommendations,
    dismissRecommendation, completeRecommendation,
  } = useAIBusinessIntelligence();
  const { leads } = useLeads();
  const { clients } = useClients();
  const { deals } = useDeals();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pendingRecs = recommendations.filter((r) => r.status === "pending");
  const highRiskClients = customerHealth.filter((c) => c.risk_level === "HIGH" || c.risk_level === "CRITICAL");
  const latestForecast = forecasts[0];

  const handleRunAll = async () => {
    const summaryPayload = {
      total_leads: leads.length,
      total_deals: deals.length,
      total_clients: clients.length,
      recent_leads: leads.slice(0, 5).map((l) => ({ name: l.name, source: l.source, stage: l.stage })),
      deal_stages: deals.reduce((acc: any, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {}),
    };
    await runRecommendations(summaryPayload);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> AI Intelligence
          </h1>
          <p className="text-muted-foreground">Predictive analytics, scoring & recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={handleRunAll} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" /> Generate Insights
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3.5 w-3.5" /> Lead Scores
            </div>
            <p className="text-2xl font-bold">{leadScores.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5" /> At-Risk Clients
            </div>
            <p className="text-2xl font-bold text-destructive">{highRiskClients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Revenue Forecast
            </div>
            <p className="text-2xl font-bold">
              ${latestForecast ? Number(latestForecast.projected_revenue).toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Lightbulb className="h-3.5 w-3.5" /> Pending Actions
            </div>
            <p className="text-2xl font-bold">{pendingRecs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Lead Intelligence</TabsTrigger>
          <TabsTrigger value="customers">Customer Health</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {/* Top recommendations */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Top Recommendations</CardTitle></CardHeader>
            <CardContent>
              {pendingRecs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending recommendations. Click "Generate Insights" to create some.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRecs.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      {priorityIcon(rec.priority)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{rec.impact_score}</Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => completeRecommendation(rec.id)}>
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => dismissRecommendation(rec.id)}>
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> At-Risk Clients</CardTitle></CardHeader>
              <CardContent>
                {highRiskClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No high-risk clients detected.</p>
                ) : (
                  <div className="space-y-2">
                    {highRiskClients.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm font-medium">{c.client_id?.slice(0, 8)}...</span>
                        <div className="flex items-center gap-2">
                          <Progress value={c.health_score} className="w-16 h-2" />
                          <Badge variant="outline" className={riskColor(c.risk_level)}>{c.risk_level}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Latest Forecast</CardTitle></CardHeader>
              <CardContent>
                {latestForecast ? (
                  <div>
                    <p className="text-3xl font-bold">${Number(latestForecast.projected_revenue).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {latestForecast.period} • {latestForecast.confidence}% confidence
                    </p>
                    {latestForecast.factors_json?.factors && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(latestForecast.factors_json.factors as string[]).slice(0, 4).map((f: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No forecast yet. Generate one from the Forecasts tab.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LEAD INTELLIGENCE */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">AI-scored leads with conversion probability</p>
            <Button size="sm" onClick={() => runLeadScoring(leads)} disabled={loading || leads.length === 0}>
              <Target className="mr-2 h-3.5 w-3.5" /> Score Leads
            </Button>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Conversion %</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadScores.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No lead scores yet. Click "Score Leads" to start.</TableCell></TableRow>
                  ) : leadScores.map((ls) => (
                    <TableRow key={ls.id}>
                      <TableCell className="font-medium">{ls.lead_id?.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={ls.lead_score} className="w-16 h-2" />
                          <span className="text-sm font-bold">{ls.lead_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>{ls.conversion_probability}%</TableCell>
                      <TableCell>{ls.confidence_score}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(ls.last_updated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* CUSTOMER HEALTH */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Customer health scores & churn risk</p>
            <Button size="sm" onClick={() => runChurnDetection(clients)} disabled={loading || clients.length === 0}>
              <Shield className="mr-2 h-3.5 w-3.5" /> Detect Churn
            </Button>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerHealth.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No health data yet. Click "Detect Churn" to analyze.</TableCell></TableRow>
                  ) : customerHealth.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell className="font-medium">{ch.client_id?.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={ch.health_score} className="w-16 h-2" />
                          <span className="font-bold text-sm">{ch.health_score}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={riskColor(ch.risk_level)}>{ch.risk_level}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {ch.reasons_json?.factors?.join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* MARKETING */}
        <TabsContent value="marketing" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Channel performance & budget recommendations</p>
            <Button size="sm" onClick={() => runMarketingAnalysis({
              channels: [
                { name: "SEO", leads: 120, spend: 2000 },
                { name: "Google Ads", leads: 65, spend: 3500 },
                { name: "Facebook", leads: 90, spend: 2800 },
                { name: "Referral", leads: 30, spend: 0 },
              ]
            })} disabled={loading}>
              <Megaphone className="mr-2 h-3.5 w-3.5" /> Analyze Channels
            </Button>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Conv. Rate</TableHead>
                    <TableHead>ROI Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingInsights.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No insights yet. Click "Analyze Channels" to generate.</TableCell></TableRow>
                  ) : marketingInsights.map((mi) => (
                    <TableRow key={mi.id}>
                      <TableCell className="font-medium capitalize">{mi.channel}</TableCell>
                      <TableCell>{mi.leads_generated}</TableCell>
                      <TableCell>{mi.conversion_rate}%</TableCell>
                      <TableCell>{mi.roi_score}</TableCell>
                      <TableCell className="text-xs">
                        {mi.recommendations_json?.budget || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* FORECASTS */}
        <TabsContent value="forecasts" className="space-y-4">
          <p className="text-sm text-muted-foreground">Revenue forecasts generated by AI analysis of your pipeline</p>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {forecasts.length === 0 ? (
                <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">
                  No forecasts yet. Use "Generate Forecast" from the AI Insights page.
                </CardContent></Card>
              ) : forecasts.map((f) => (
                <Card key={f.id}>
                  <CardHeader><CardTitle className="text-base">{f.period}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${Number(f.projected_revenue).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">{f.confidence}% confidence</p>
                    {f.factors_json?.summary && (
                      <p className="text-xs text-muted-foreground mt-2">{f.factors_json.summary}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">AI-generated actionable recommendations</p>
            <Button size="sm" onClick={handleRunAll} disabled={loading}>
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Generate
            </Button>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">
                  No recommendations yet. Click "Generate" to create AI-powered insights.
                </CardContent></Card>
              ) : recommendations.map((rec) => (
                <Card key={rec.id} className={rec.status === "dismissed" ? "opacity-50" : ""}>
                  <CardContent className="py-3 flex items-start gap-3">
                    {priorityIcon(rec.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{rec.recommendation_type.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">Impact: {rec.impact_score}</Badge>
                      {rec.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => completeRecommendation(rec.id)}>
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => dismissRecommendation(rec.id)}>
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      {rec.status !== "pending" && (
                        <Badge variant="outline" className="text-[10px] capitalize">{rec.status}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIBusinessIntelligencePage;
