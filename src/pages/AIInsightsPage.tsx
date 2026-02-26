import { useState } from "react";
import { useAIEngine } from "@/hooks/useAIEngine";
import { useLeads } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

const priorityColor = (p: string | null) => {
  if (p === "HIGH") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  if (p === "MEDIUM") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
};

const AIInsightsPage = () => {
  const { scoreLead, forecastSales, loading: aiLoading } = useAIEngine();
  const { leads, loading: leadsLoading } = useLeads();
  const { deals } = useDeals();
  const [forecast, setForecast] = useState<any>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);

  const handleScoreLead = async (lead: any) => {
    setScoringId(lead.id);
    const result = await scoreLead({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      source: lead.source,
      stage: lead.stage,
      estimated_budget: lead.estimated_budget,
      services_needed: lead.services_needed,
      suburb: lead.suburb,
    });
    if (result) toast.success(`Lead scored: ${result.score}/100 (${result.priority})`);
    setScoringId(null);
  };

  const handleForecast = async () => {
    const pipelineData = deals.map(d => ({
      stage: d.stage,
      estimated_value: d.estimated_value,
      expected_close_date: d.expected_close_date,
    }));
    const result = await forecastSales({ deals: pipelineData, period: new Date().toISOString().slice(0, 7) });
    if (result) setForecast(result);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6" /> AI Insights</h1>
          <p className="text-muted-foreground">Predictive scoring, forecasting & recommendations</p>
        </div>
        <Button onClick={handleForecast} disabled={aiLoading}>
          <TrendingUp className="mr-2 h-4 w-4" /> Generate Forecast
        </Button>
      </div>

      {forecast && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Revenue Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">${Number(forecast.projected_revenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Projected Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{forecast.confidence}%</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>
            {forecast.summary && <p className="mt-3 text-sm text-muted-foreground">{forecast.summary}</p>}
            {forecast.factors?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {forecast.factors.map((f: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Lead Scoring</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          {leadsLoading ? <Skeleton className="h-24 w-full" /> : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>AI Score</TableHead>
              <TableHead>Priority</TableHead><TableHead>Recommendation</TableHead><TableHead>Action</TableHead>
            </TableRow></TableHeader><TableBody>
              {leads.slice(0, 20).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="capitalize">{l.source}</TableCell>
                  <TableCell>{(l as any).ai_score ?? "—"}</TableCell>
                  <TableCell>
                    {(l as any).ai_priority ? (
                      <Badge variant="secondary" className={priorityColor((l as any).ai_priority)}>{(l as any).ai_priority}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{(l as any).ai_recommended_action || "—"}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleScoreLead(l)} disabled={scoringId === l.id || aiLoading}>
                      <Target className="h-3 w-3 mr-1" /> {scoringId === l.id ? "Scoring..." : "Score"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsightsPage;
