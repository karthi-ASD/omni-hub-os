import { useState } from "react";
import { useAIBrain } from "@/hooks/useAIBrain";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Activity, TrendingUp, Users, AlertTriangle, MessageSquare, RefreshCw, Send, X } from "lucide-react";

const AIBrainPage = () => {
  usePageTitle("AI Brain");
  const {
    latestHealth, forecasts, teamMetrics, activeAlerts, advisorLogs,
    loading, runHealthAnalysis, runTeamAnalysis, askAdvisor, dismissAlert,
  } = useAIBrain();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const resp = await askAdvisor(question);
    setAnswer(resp || "No response.");
    setAsking(false);
  };

  const healthScore = latestHealth?.health_score ?? 0;
  const growthScore = latestHealth?.growth_score ?? 0;
  const riskScore = latestHealth?.risk_score ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Brain"
        subtitle="Central intelligence layer — CEO-level insights"
        icon={Brain}
        actions={[
          { label: "Health Check", icon: RefreshCw, onClick: runHealthAnalysis, variant: "outline" },
          { label: "Team Analysis", icon: Users, onClick: runTeamAnalysis, variant: "outline" },
        ]}
      />

      {/* Health Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Business Health" value={healthScore} icon={Activity}
          gradient={healthScore >= 70 ? "from-success to-emerald-500" : healthScore >= 40 ? "from-warning to-orange-500" : "from-destructive to-red-500"}
          subtitle={healthScore >= 70 ? "Strong" : healthScore >= 40 ? "Moderate" : "At Risk"} />
        <StatCard label="Growth Score" value={growthScore} icon={TrendingUp} gradient="from-primary to-accent" />
        <StatCard label="Risk Score" value={riskScore} icon={AlertTriangle}
          gradient={riskScore <= 30 ? "from-success to-emerald-500" : riskScore <= 60 ? "from-warning to-orange-500" : "from-destructive to-red-500"}
          alert={riskScore > 60} />
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3 mt-4">
          {activeAlerts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No active alerts</p>}
          {activeAlerts.map((a) => (
            <Card key={a.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <Badge variant={a.priority === "CRITICAL" ? "destructive" : a.priority === "HIGH" ? "destructive" : "secondary"}>{a.priority}</Badge>
                  <span className="text-sm">{a.message}</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => dismissAlert(a.id)}><X className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-3 mt-4">
          {forecasts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No forecasts yet. Run a health check to generate.</p>}
          {forecasts.map((f) => (
            <Card key={f.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium capitalize">{f.forecast_type}</p>
                    <p className="text-xs text-muted-foreground">{f.forecast_date || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${Number(f.predicted_value).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{f.confidence_score ?? 0}% confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="team" className="space-y-3 mt-4">
          {teamMetrics.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No team metrics yet. Run team analysis.</p>}
          {teamMetrics.map((m) => (
            <Card key={m.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{m.employee_name || "Team Member"}</p>
                    <p className="text-xs text-muted-foreground">
                      Conv: {m.conversion_rate ?? 0}% · Tasks: {m.task_completion_rate ?? 0}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{m.performance_score}</p>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="advisor" className="space-y-4 mt-4">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" />Ask AI Advisor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="e.g. How can I increase sales this month?" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
              <Button onClick={handleAsk} disabled={asking || !question.trim()} className="w-full">
                <Send className="h-4 w-4 mr-2" />{asking ? "Thinking…" : "Ask Advisor"}
              </Button>
              {answer && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {advisorLogs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Previous Questions</p>
              {advisorLogs.slice(0, 10).map((log) => (
                <Card key={log.id} className="rounded-2xl border-0 shadow-elevated">
                  <CardContent className="py-3 px-4">
                    <p className="text-sm font-medium">{log.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{log.ai_response}</p>
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

export default AIBrainPage;
