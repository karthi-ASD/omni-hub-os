import React, { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAIAgencyBrain } from "@/hooks/useAIAgencyBrain";
import { useAIBrain } from "@/hooks/useAIBrain";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain, Activity, AlertTriangle, TrendingUp, Users, FileText,
  Search, Shield, Zap, CheckCircle, XCircle, Clock, Target,
  BarChart3, Sparkles, RefreshCw, ArrowRight, Eye, ThumbsUp,
} from "lucide-react";

const severityColor = (s: string) => {
  const lc = s?.toLowerCase();
  if (lc === "critical") return "destructive";
  if (lc === "high") return "destructive";
  if (lc === "medium") return "default";
  return "secondary";
};

const riskStatusIcon = (s: string) => {
  if (s === "on_track") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (s === "at_risk") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  if (s === "delayed") return <Clock className="h-4 w-4 text-orange-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
};

const AIAgencyBrainPage = () => {
  usePageTitle("AI Agency Brain", "Intelligent decision-making and automation engine");
  const { profile } = useAuth();
  const {
    loading, projectRisks, taskSuggestions, workloadResult, clientReport,
    seoIssues, churnRisks,
    analyzeProjectRisk, suggestTasks, optimizeWorkload,
    generateClientReport, detectSeoIssues, assessChurnRisk,
  } = useAIAgencyBrain();
  const { latestHealth, activeAlerts, runHealthAnalysis } = useAIBrain();

  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [seoProjects, setSeoProjects] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSeoProject, setSelectedSeoProject] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.business_id) return;
    Promise.all([
      supabase.from("clients").select("id, contact_name, company_name").limit(100),
      (supabase.from("client_projects" as any) as any).select("id, client_name, service_type, status").eq("business_id", profile.business_id).limit(100),
      (supabase.from("seo_projects" as any) as any).select("id, project_name, client_id, website_domain, project_status").eq("business_id", profile.business_id).limit(100),
      supabase.from("ai_recommendations").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false }).limit(50),
    ]).then(([c, p, s, r]) => {
      setClients(c.data ?? []);
      setProjects(p.data ?? []);
      setSeoProjects(s.data ?? []);
      setRecommendations(r.data ?? []);
    });
  }, [profile?.business_id]);

  const healthScore = latestHealth?.health_score ?? 0;
  const healthColor = healthScore >= 70 ? "text-green-500" : healthScore >= 40 ? "text-yellow-500" : "text-red-500";
  const seoHealthScore = seoIssues?.seo_health_score ?? null;

  const handleDismissRec = async (id: string) => {
    await supabase.from("ai_recommendations").update({ status: "dismissed" } as any).eq("id", id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAcceptRec = async (id: string) => {
    await supabase.from("ai_recommendations").update({ status: "accepted" } as any).eq("id", id);
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status: "accepted" } : r));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg gradient-primary p-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary-foreground/80" />
            <span className="text-xs text-primary-foreground/80 font-medium uppercase tracking-wide">Intelligence Engine</span>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">AI Agency Brain</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Automated decision-making across SEO, projects, workloads, and client management
          </p>
        </div>
      </div>

      {/* Quick Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <Activity className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className={`text-2xl font-bold ${healthColor}`}>{healthScore}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Business Health</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Active Alerts</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <Search className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{seoIssues?.issues?.length ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground uppercase">SEO Issues</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <Target className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{projectRisks.filter(r => r.risk_status !== "on_track").length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">At-Risk Projects</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <Sparkles className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{taskSuggestions.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Task Suggestions</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Feed */}
      {recommendations.filter(r => r.status !== "dismissed").length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Recommendations
              <Badge variant="secondary" className="ml-auto text-[10px]">{recommendations.filter(r => r.status !== "dismissed").length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[200px]">
              {recommendations.filter(r => r.status !== "dismissed").slice(0, 10).map((rec) => (
                <div key={rec.id} className="flex items-start gap-3 p-3 border-b last:border-0 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{rec.description}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant={severityColor(rec.priority)} className="text-[10px]">{rec.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground">{rec.recommendation_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {rec.status !== "accepted" && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => handleAcceptRec(rec.id)}>
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handleDismissRec(rec.id)}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="seo"><Search className="h-3.5 w-3.5 mr-1" /> SEO Intelligence</TabsTrigger>
          <TabsTrigger value="tasks"><Zap className="h-3.5 w-3.5 mr-1" /> Task Suggestions</TabsTrigger>
          <TabsTrigger value="risks"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Project Risks</TabsTrigger>
          <TabsTrigger value="workload"><Users className="h-3.5 w-3.5 mr-1" /> Workload</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="h-3.5 w-3.5 mr-1" /> Reports</TabsTrigger>
          <TabsTrigger value="churn"><Shield className="h-3.5 w-3.5 mr-1" /> Churn Risk</TabsTrigger>
        </TabsList>

        {/* SEO Intelligence Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedSeoProject} onValueChange={setSelectedSeoProject}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select SEO project" /></SelectTrigger>
              <SelectContent>
                {seoProjects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selectedSeoProject || loading} onClick={() => {
              const proj = seoProjects.find((p: any) => p.id === selectedSeoProject);
              detectSeoIssues({ project_id: selectedSeoProject, project_name: proj?.project_name, domain: proj?.website_domain });
            }}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
              Scan Issues
            </Button>
          </div>

          {seoIssues && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">SEO Health:</span>
                  <span className={`text-xl font-bold ${(seoHealthScore ?? 0) >= 70 ? "text-green-500" : (seoHealthScore ?? 0) >= 40 ? "text-yellow-500" : "text-red-500"}`}>
                    {seoHealthScore}/100
                  </span>
                </div>
                <Badge variant="secondary">{seoIssues.issues?.length || 0} issues found</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{seoIssues.summary}</p>
              <div className="space-y-2">
                {seoIssues.issues?.map((issue: any, i: number) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={severityColor(issue.severity)} className="text-[10px]">{issue.severity}</Badge>
                            <span className="text-xs text-muted-foreground uppercase">{issue.issue_type?.replace(/_/g, " ")}</span>
                            {issue.affected_count && <span className="text-xs text-muted-foreground">({issue.affected_count} affected)</span>}
                          </div>
                          <p className="text-sm font-medium">{issue.description}</p>
                          <p className="text-xs text-muted-foreground">Fix: {issue.suggested_fix}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Task Suggestions Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.client_name} — {p.service_type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selectedProject || loading} onClick={() => {
              const proj = projects.find((p: any) => p.id === selectedProject);
              suggestTasks({ project_id: selectedProject, project_name: proj?.client_name, service_type: proj?.service_type });
            }}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Generate Suggestions
            </Button>
          </div>

          {taskSuggestions.length > 0 && (
            <div className="space-y-2">
              {taskSuggestions.map((task: any, i: number) => (
                <Card key={i} className="border-border hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={severityColor(task.priority)} className="text-[10px]">{task.priority}</Badge>
                          <Badge variant="outline" className="text-[10px]">{task.department}</Badge>
                          {task.category && <Badge variant="secondary" className="text-[10px]">{task.category}</Badge>}
                          {task.deadline_days && <span className="text-[10px] text-muted-foreground">Due in {task.deadline_days}d</span>}
                        </div>
                        <p className="text-[10px] text-primary italic">Reason: {task.reason}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                        <CheckCircle className="h-3 w-3 mr-1" /> Create
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Project Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.client_name} — {p.service_type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selectedProject || loading} onClick={() => {
              const proj = projects.find((p: any) => p.id === selectedProject);
              analyzeProjectRisk({ project_id: selectedProject, project_name: proj?.client_name, service_type: proj?.service_type });
            }}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <AlertTriangle className="h-4 w-4 mr-1" />}
              Analyze Risk
            </Button>
          </div>

          {projectRisks.length > 0 && (
            <div className="space-y-3">
              {projectRisks.map((risk: any, i: number) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {riskStatusIcon(risk.risk_status)}
                        <h3 className="font-semibold text-sm">{risk.project}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={risk.risk_status === "on_track" ? "secondary" : severityColor(risk.risk_status === "critical" ? "CRITICAL" : "HIGH")} className="text-[10px] uppercase">
                          {risk.risk_status?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-sm font-bold">{risk.risk_score}/100</span>
                      </div>
                    </div>
                    <Progress value={risk.risk_score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{risk.summary}</p>
                    {risk.risk_factors?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Risk Factors:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {risk.risk_factors.map((f: string, j: number) => <li key={j}>• {f}</li>)}
                        </ul>
                      </div>
                    )}
                    {risk.recommended_actions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">Recommended Actions:</p>
                        {risk.recommended_actions.map((a: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <Badge variant={severityColor(a.priority)} className="text-[9px]">{a.priority}</Badge>
                            <span>{a.action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          <Button size="sm" disabled={loading} onClick={() => optimizeWorkload({ task_title: "General workload analysis", department: "All" })}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
            Analyze Workloads
          </Button>

          {workloadResult && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Workload Analysis Result</h3>
                </div>
                <p className="text-sm text-muted-foreground">{workloadResult.summary}</p>
                {workloadResult.recommended_employee && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Recommended Assignment</p>
                    <p className="text-sm font-semibold">{workloadResult.recommended_employee}</p>
                    <p className="text-xs text-muted-foreground">{workloadResult.reasoning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">Confidence: {workloadResult.confidence}%</Badge>
                      {workloadResult.current_capacity_percent != null && (
                        <Badge variant="outline" className="text-[10px]">Capacity: {workloadResult.current_capacity_percent}%</Badge>
                      )}
                    </div>
                  </div>
                )}
                {workloadResult.overloaded_employees?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">⚠ Overloaded Employees:</p>
                    <div className="flex flex-wrap gap-1">
                      {workloadResult.overloaded_employees.map((e: string, i: number) => (
                        <Badge key={i} variant="destructive" className="text-[10px]">{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.contact_name}{c.company_name ? ` (${c.company_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selectedClient || loading} onClick={() => {
              const cl = clients.find((c: any) => c.id === selectedClient);
              generateClientReport({ client_id: selectedClient, client_name: cl?.contact_name, period: "Last 30 days" });
            }}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
              Generate Report
            </Button>
          </div>

          {clientReport && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{clientReport.report_title}</h3>
                  {clientReport.period && <Badge variant="secondary" className="text-[10px]">{clientReport.period}</Badge>}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Performance Summary</p>
                  <p className="text-sm">{clientReport.performance_summary}</p>
                </div>

                {clientReport.key_metrics?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {clientReport.key_metrics.map((m: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">{m.metric}</p>
                        <p className="text-sm font-bold">{m.value}</p>
                        <span className={`text-[10px] ${m.trend === "up" ? "text-green-500" : m.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                          {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {clientReport.completed_work?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Completed Work</p>
                    <ul className="text-sm space-y-0.5">
                      {clientReport.completed_work.map((w: string, i: number) => <li key={i} className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" />{w}</li>)}
                    </ul>
                  </div>
                )}

                {clientReport.next_month_strategy?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Next Month Strategy</p>
                    {clientReport.next_month_strategy.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                        <span>{s.action}</span>
                        <Badge variant="outline" className="text-[10px]">{s.priority}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {clientReport.client_summary && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1">Client-Facing Summary</p>
                    <p className="text-sm">{clientReport.client_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.contact_name}{c.company_name ? ` (${c.company_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selectedClient || loading} onClick={() => {
              const cl = clients.find((c: any) => c.id === selectedClient);
              assessChurnRisk({ client_id: selectedClient, client_name: cl?.contact_name });
            }}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
              Assess Churn Risk
            </Button>
          </div>

          {churnRisks.length > 0 && (
            <div className="space-y-3">
              {churnRisks.map((risk: any, i: number) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{risk.client_name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={severityColor(risk.risk_level)} className="text-[10px]">{risk.risk_level}</Badge>
                        <span className="text-sm font-bold">{risk.churn_score}/100</span>
                      </div>
                    </div>
                    <Progress value={risk.churn_score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{risk.summary}</p>
                    {risk.risk_factors?.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {risk.risk_factors.map((f: string, j: number) => <li key={j}>• {f}</li>)}
                      </ul>
                    )}
                    {risk.retention_actions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">Retention Actions:</p>
                        {risk.retention_actions.map((a: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <Badge variant={severityColor(a.priority)} className="text-[9px]">{a.priority}</Badge>
                            <span>{a.action}</span>
                          </div>
                        ))}
                      </div>
                    )}
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

export default AIAgencyBrainPage;
