import { useAILearning } from "@/hooks/useAILearning";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BarChart3, Workflow, Cpu, RefreshCw, CheckCircle, Lightbulb } from "lucide-react";

const modelTypes = ["lead_scoring", "churn_prediction", "conversion_prediction", "campaign_optimization"];

const AILearningPage = () => {
  usePageTitle("AI Learning");
  const {
    modelTraining, behaviorPatterns, workflowAdaptations,
    loading, runBehaviorAnalysis, runWorkflowOptimization,
    triggerModelTraining, applyAdaptation,
  } = useAILearning();

  const completedModels = modelTraining.filter((m) => m.status === "completed");
  const suggestedAdaptations = workflowAdaptations.filter((a) => a.status === "suggested");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">AI Learning</h1>
            <p className="text-sm text-muted-foreground">Self-evolving intelligence — learns from your data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runBehaviorAnalysis}>
            <BarChart3 className="h-4 w-4 mr-1" />Analyze Behavior
          </Button>
          <Button size="sm" variant="outline" onClick={runWorkflowOptimization}>
            <Workflow className="h-4 w-4 mr-1" />Optimize Workflows
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 text-center">
            <Cpu className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{completedModels.length}</p>
            <p className="text-xs text-muted-foreground">Models Trained</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 text-center">
            <Lightbulb className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{behaviorPatterns.length}</p>
            <p className="text-xs text-muted-foreground">Patterns Found</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 text-center">
            <Workflow className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{suggestedAdaptations.length}</p>
            <p className="text-xs text-muted-foreground">Pending Adaptations</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-400 mb-1" />
            <p className="text-2xl font-bold">{workflowAdaptations.filter((a) => a.status === "applied").length}</p>
            <p className="text-xs text-muted-foreground">Applied Changes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="adaptations">Workflow Adaptations</TabsTrigger>
          <TabsTrigger value="training">Model Training</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-3 mt-4">
          {behaviorPatterns.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No patterns yet. Run behavior analysis.</p>}
          {behaviorPatterns.map((p) => (
            <Card key={p.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{p.pattern_type}</Badge>
                      <span className="text-xs text-muted-foreground">{p.confidence_score}% confidence</span>
                    </div>
                    <p className="text-sm">{p.description}</p>
                    {p.recommendation && <p className="text-xs text-primary mt-1">→ {p.recommendation}</p>}
                  </div>
                  <Progress value={p.confidence_score} className="w-16 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-3 mt-4">
          {workflowAdaptations.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No adaptations yet. Run workflow optimization.</p>}
          {workflowAdaptations.map((a) => (
            <Card key={a.id} className="border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.status === "applied" ? "default" : "secondary"} className="text-xs capitalize">{a.status}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{a.workflow_type}</span>
                  </div>
                  <p className="text-sm">{a.adaptation_reason}</p>
                </div>
                {a.status === "suggested" && (
                  <Button size="sm" onClick={() => applyAdaptation(a.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />Apply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="training" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modelTypes.map((mt) => (
              <Button key={mt} variant="outline" size="sm" className="capitalize" onClick={() => triggerModelTraining(mt)}>
                <RefreshCw className="h-3 w-3 mr-1" />{mt.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
          {modelTraining.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No models trained yet.</p>}
          {modelTraining.map((m) => (
            <Card key={m.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium capitalize">{m.model_type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{m.training_data_size} samples · {m.trained_at ? new Date(m.trained_at).toLocaleDateString() : "N/A"}</p>
                    {m.summary && <p className="text-xs text-muted-foreground mt-1">{m.summary}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{m.accuracy_score ?? 0}%</p>
                    <Badge variant={m.status === "completed" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AILearningPage;
