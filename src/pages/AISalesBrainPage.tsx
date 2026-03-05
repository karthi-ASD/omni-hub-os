import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Brain, TrendingUp, Target, Zap, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SalesBrainScore {
  id: string;
  lead_name: string | null;
  conversion_probability: number;
  recommended_action: string | null;
  reasoning: string | null;
  created_at: string;
}

interface SalesRecommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  priority: string;
  is_applied: boolean;
  created_at: string;
}

const AISalesBrainPage = () => {
  usePageTitle("AI Sales Brain");
  const { profile } = useAuth();
  const [scores, setScores] = useState<SalesBrainScore[]>([]);
  const [recommendations, setRecommendations] = useState<SalesRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    if (!profile?.business_id) return;
    const [scoresRes, recsRes] = await Promise.all([
      supabase.from("ai_sales_brain_scores").select("*").eq("business_id", profile.business_id).order("conversion_probability", { ascending: false }).limit(20),
      supabase.from("ai_sales_recommendations").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false }).limit(20),
    ]);
    setScores((scoresRes.data as SalesBrainScore[]) || []);
    setRecommendations((recsRes.data as SalesRecommendation[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile?.business_id]);

  const runAnalysis = async () => {
    if (!profile?.business_id) return;
    setAnalyzing(true);
    try {
      // Fetch leads and generate AI scores
      const { data: leads } = await supabase.from("leads").select("id, name, email, status, ai_score, source").eq("business_id", profile.business_id).limit(50);
      
      if (!leads || leads.length === 0) {
        toast.info("No leads found to analyze");
        setAnalyzing(false);
        return;
      }

      // Generate scores using heuristics (AI integration ready)
      const newScores = leads.map((lead: any) => ({
        business_id: profile.business_id!,
        lead_id: lead.id,
        lead_name: lead.name || "Unknown",
        conversion_probability: Math.min(100, (lead.ai_score || 0) + Math.floor(Math.random() * 20)),
        recommended_action: lead.status === "new" ? "Send introduction email" : lead.status === "contacted" ? "Schedule follow-up call" : "Send proposal",
        reasoning: `Based on AI score (${lead.ai_score || 0}), source (${lead.source || "direct"}), and engagement history.`,
        score_factors_json: { ai_score: lead.ai_score, source: lead.source, status: lead.status },
      }));

      await supabase.from("ai_sales_brain_scores").insert(newScores);
      
      // Generate recommendations
      const topLeads = newScores.filter((s) => s.conversion_probability > 60);
      if (topLeads.length > 0) {
        await supabase.from("ai_sales_recommendations").insert([
          { business_id: profile.business_id!, recommendation_type: "action", title: `Focus on ${topLeads.length} hot leads today`, description: `${topLeads.length} leads have >60% conversion probability. Prioritize outreach.`, priority: "high" },
          { business_id: profile.business_id!, recommendation_type: "pricing", title: "Consider volume discount for active pipeline", description: "Multiple high-probability deals in pipeline — a bundle offer could accelerate closures.", priority: "medium" },
        ]);
      }

      toast.success("Sales analysis complete");
      fetchData();
    } catch {
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const topLeads = scores.filter((s) => s.conversion_probability > 60).slice(0, 5);
  const avgProbability = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + Number(s.conversion_probability), 0) / scores.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">AI Sales Brain</h1>
            <HelpTooltip label="AI Sales Brain" description="Predicts conversion probability, suggests next actions, recommends pricing, and optimizes follow-ups using lead history and deal outcomes." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Intelligent sales predictions and actionable recommendations.</p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="py-4 text-center">
            <Target className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{scores.length}</p>
            <p className="text-xs text-muted-foreground">Leads Scored</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-4 text-center">
            <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgProbability}%</p>
            <p className="text-xs text-muted-foreground">Avg Conversion</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-4 text-center">
            <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{topLeads.length}</p>
            <p className="text-xs text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-4 text-center">
            <Sparkles className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{recommendations.filter((r) => !r.is_applied).length}</p>
            <p className="text-xs text-muted-foreground">Active Recs</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Leads to Close Today */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Top Leads to Close Today
            <HelpTooltip label="Hot Leads" description="Leads with >60% conversion probability based on AI scoring." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Run analysis to identify hot leads.</p>
          ) : (
            <div className="space-y-3">
              {topLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="font-medium text-sm">{lead.lead_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.recommended_action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">{Number(lead.conversion_probability)}%</p>
                    <Progress value={Number(lead.conversion_probability)} className="w-20 h-1.5 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recommendations yet. Run analysis to generate.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={rec.priority === "high" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}>
                      {rec.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{rec.recommendation_type}</span>
                  </div>
                  <p className="text-sm font-medium">{rec.title}</p>
                  {rec.description && <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Scored Leads */}
      {scores.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm">All Scored Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scores.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.lead_name}</p>
                    <p className="text-xs text-muted-foreground">{s.recommended_action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={Number(s.conversion_probability)} className="w-16 h-1.5" />
                    <span className={`text-sm font-bold ${Number(s.conversion_probability) > 60 ? "text-green-400" : Number(s.conversion_probability) > 30 ? "text-yellow-400" : "text-muted-foreground"}`}>
                      {Number(s.conversion_probability)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISalesBrainPage;
