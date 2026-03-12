import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useSeoIntelligenceEngine, SeoModuleStatus } from "@/hooks/useSeoIntelligenceEngine";
import { useSeoRankChecks } from "@/hooks/useSeoRankChecks";
import { useSeoBacklinks } from "@/hooks/useSeoBacklinks";
import { useSeoPageScores } from "@/hooks/useSeoPageScores";
import { useSeoCompetitorGap } from "@/hooks/useSeoCompetitorGap";
import { useSeoCompetitors } from "@/hooks/useSeoCompetitors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, TrendingUp, Search, Loader2, Globe,
  Target, Sparkles, BarChart3, Link2, FileText, Shield, Map,
  Zap, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, FileSearch, Play,
} from "lucide-react";

const scoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
};

const scoreBadge = (score: number) => {
  if (score >= 80) return "default" as const;
  if (score >= 50) return "secondary" as const;
  return "destructive" as const;
};

const priorityColor = (p: string) => {
  if (p === "high") return "destructive" as const;
  if (p === "medium") return "secondary" as const;
  return "outline" as const;
};

const ModuleStatusBadge = ({ status }: { status?: SeoModuleStatus }) => {
  if (!status || status === "not_started") return <Badge variant="outline" className="text-[10px]">Not Started</Badge>;
  if (status === "running") return <Badge variant="secondary" className="text-[10px] animate-pulse">Running...</Badge>;
  if (status === "completed") return <Badge variant="default" className="text-[10px]">Completed</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
};

const RunModuleButton = ({ module, status, onClick, disabled }: { module: string; status?: SeoModuleStatus; onClick: () => void; disabled?: boolean }) => (
  <Button
    size="sm"
    variant={status === "completed" ? "outline" : "default"}
    onClick={onClick}
    disabled={status === "running" || disabled}
  >
    {status === "running" ? (
      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    ) : (
      <Play className="h-3 w-3 mr-1" />
    )}
    {status === "running" ? "Analyzing..." : status === "completed" ? "Re-run" : "Run Analysis"}
  </Button>
);

const EmptyModuleState = ({ label, onRun, status, disabled }: { label: string; onRun: () => void; status?: SeoModuleStatus; disabled?: boolean }) => (
  <Card>
    <CardContent className="py-12 text-center text-muted-foreground">
      <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary opacity-40" />
      <p className="text-sm font-medium mb-1">Analysis not yet run</p>
      <p className="text-xs mb-4">Click below to run {label} analysis independently</p>
      <RunModuleButton module={label} status={status} onClick={onRun} disabled={disabled} />
    </CardContent>
  </Card>
);

const SeoIntelligencePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useSeoProjects();
  const project = projects.find(p => p.id === projectId);

  const {
    analyses, keywords, roadmap, contentWorkflow, trafficEstimate,
    loading: engineLoading, analyzing, analysisProgress, runDomainAnalysis,
    runModuleAnalysis, moduleStatuses, sitemapData,
    updateRoadmapItem, updateContentWorkflow,
  } = useSeoIntelligenceEngine(projectId);

  const { checks, loading: ranksLoading } = useSeoRankChecks(projectId);
  const { backlinks, loading: blLoading } = useSeoBacklinks(projectId);
  const { scores } = useSeoPageScores(projectId);
  const { gaps, analyzing: gapAnalyzing, analyzeGaps } = useSeoCompetitorGap(projectId);
  const { competitors } = useSeoCompetitors(projectId);

  const [domainInput, setDomainInput] = useState(project?.website_domain || "");
  const latestAnalysis = analyses[0];
  const domain = domainInput.trim() || project?.website_domain || "";
  const hasDomain = domain.length > 0;

  const runModule = (mod: string) => {
    if (!domain) return;
    runModuleAnalysis(mod, domain);
  };

  if (!projectId) return <div className="p-6 text-muted-foreground">Select an SEO project first.</div>;

  const loading = engineLoading || ranksLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">SEO Intelligence Engine</h1>
          <p className="text-sm text-muted-foreground">{project?.project_name || "Project"}</p>
        </div>
      </div>

      {/* Domain Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter domain to analyze (e.g. example.com.au)"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && hasDomain && runDomainAnalysis(domain)}
              />
            </div>
            <Button onClick={() => runDomainAnalysis(domain)} disabled={analyzing || !hasDomain} variant="outline">
              {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {analyzing ? "Running..." : "Run All Modules"}
            </Button>
          </div>
          {analyzing && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Running all SEO modules in sequence...</p>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Use individual "Run Analysis" buttons in each tab to run modules independently.
          </p>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {latestAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "SEO Score", value: latestAnalysis.seo_score, color: true },
            { label: "Keywords", value: latestAnalysis.total_keywords },
            { label: "Est. Traffic/mo", value: latestAnalysis.estimated_traffic.toLocaleString() },
            { label: "Competitors", value: competitors.length },
            { label: "Backlinks", value: backlinks.length },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={`text-3xl font-bold ${kpi.color ? scoreColor(Number(kpi.value)) : "text-foreground"}`}>
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><Globe className="h-3 w-3 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="keywords"><Target className="h-3 w-3 mr-1" />Keywords</TabsTrigger>
          <TabsTrigger value="competitors"><BarChart3 className="h-3 w-3 mr-1" />Competitors</TabsTrigger>
          <TabsTrigger value="audit"><Shield className="h-3 w-3 mr-1" />Page Audit</TabsTrigger>
          <TabsTrigger value="backlinks"><Link2 className="h-3 w-3 mr-1" />Backlinks</TabsTrigger>
          <TabsTrigger value="gaps"><Zap className="h-3 w-3 mr-1" />Gap Analysis</TabsTrigger>
          <TabsTrigger value="roadmap"><Map className="h-3 w-3 mr-1" />Roadmap</TabsTrigger>
          <TabsTrigger value="content"><FileText className="h-3 w-3 mr-1" />Content</TabsTrigger>
          <TabsTrigger value="sitemap"><FileSearch className="h-3 w-3 mr-1" />Sitemap</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : !latestAnalysis ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-lg font-medium">No analysis yet</p>
              <p className="text-sm">Enter a domain above and run individual modules or all at once</p>
            </CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm">Analysis Summary — {latestAnalysis.domain}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Status:</span> <Badge variant={latestAnalysis.status === "completed" ? "default" : "secondary"}>{latestAnalysis.status}</Badge></div>
                    <div><span className="text-muted-foreground">Pages Crawled:</span> {latestAnalysis.total_pages_crawled}</div>
                    <div><span className="text-muted-foreground">Keywords Found:</span> {latestAnalysis.total_keywords}</div>
                    <div><span className="text-muted-foreground">Completed:</span> {latestAnalysis.completed_at ? new Date(latestAnalysis.completed_at).toLocaleString() : "—"}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Module status summary */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Module Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: "keywords", label: "Keywords", has: keywords.length > 0 },
                      { key: "competitors", label: "Competitors", has: competitors.length > 0 },
                      { key: "audit", label: "Page Audit", has: !!latestAnalysis.analysis_json?.page_audit },
                      { key: "backlinks", label: "Backlinks", has: backlinks.length > 0 },
                      { key: "content", label: "Content", has: contentWorkflow.length > 0 },
                      { key: "roadmap", label: "Roadmap", has: roadmap.length > 0 },
                      { key: "sitemap", label: "Sitemap", has: !!sitemapData },
                      { key: "gaps", label: "Gap Analysis", has: gaps.length > 0 },
                    ].map(m => (
                      <div key={m.key} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span>{m.label}</span>
                        {m.has || moduleStatuses[m.key] === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : moduleStatuses[m.key] === "running" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Not run</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {latestAnalysis.analysis_json?.page_audit && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">SEO Score Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(latestAnalysis.analysis_json.page_audit).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                            <span className={scoreColor(Number(val))}>{String(val)}/100</span>
                          </div>
                          <Progress value={Number(val)} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {latestAnalysis.analysis_json?.on_page_issues?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Issues Found ({latestAnalysis.analysis_json.on_page_issues.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {latestAnalysis.analysis_json.on_page_issues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50">
                          {issue.severity === "high" ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> :
                           issue.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" /> :
                           <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
                          <div>
                            <p className="font-medium">{issue.issue}</p>
                            {issue.recommendation && <p className="text-xs text-muted-foreground mt-0.5">{issue.recommendation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* KEYWORDS TAB */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <RunModuleButton module="keywords" status={moduleStatuses.keywords} onClick={() => runModule("keywords")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.keywords} />
            {keywords.length > 0 && <Badge variant="outline">{keywords.length} keywords</Badge>}
            {["primary","secondary","long_tail","lsi","local","question"].map(type => {
              const count = keywords.filter(k => k.keyword_type === type).length;
              return count > 0 ? <Badge key={type} variant="secondary">{type.replace("_"," ")}: {count}</Badge> : null;
            })}
          </div>
          {keywords.length === 0 ? (
            <EmptyModuleState label="Keywords" status={moduleStatuses.keywords} onRun={() => runModule("keywords")} disabled={!hasDomain} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Intent</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Opportunity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.slice(0, 100).map(kw => (
                        <TableRow key={kw.id}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{kw.keyword_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{kw.intent}</Badge></TableCell>
                          <TableCell>{kw.estimated_volume}</TableCell>
                          <TableCell><span className={scoreColor(100 - kw.difficulty_score)}>{kw.difficulty_score}</span></TableCell>
                          <TableCell><span className={scoreColor(kw.opportunity_score)}>{kw.opportunity_score}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="competitors" status={moduleStatuses.competitors} onClick={() => runModule("competitors")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.competitors} />
            {competitors.length > 0 && <Badge variant="outline">{competitors.length} competitors</Badge>}
          </div>
          {competitors.length === 0 ? (
            <EmptyModuleState label="Competitors" status={moduleStatuses.competitors} onRun={() => runModule("competitors")} disabled={!hasDomain} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Discovered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitors.map((c, i) => (
                        <TableRow key={c.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">
                            <a href={`https://${c.competitor_domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              {c.competitor_domain} <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>{c.competitor_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PAGE AUDIT TAB */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="audit" status={moduleStatuses.audit} onClick={() => runModule("audit")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.audit} />
          </div>
          {scores.length === 0 && !latestAnalysis?.analysis_json?.page_audit ? (
            <EmptyModuleState label="Page Audit" status={moduleStatuses.audit} onRun={() => runModule("audit")} disabled={!hasDomain} />
          ) : (
            <>
              {latestAnalysis?.analysis_json?.technical_issues?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Technical Issues</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {latestAnalysis.analysis_json.technical_issues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                          {issue.severity === "high" ? <XCircle className="h-4 w-4 text-destructive" /> :
                           <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          <span>{issue.issue}</span>
                          <Badge variant={priorityColor(issue.severity)} className="ml-auto">{issue.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {scores.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Page Scores ({scores.length})</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page URL</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scores.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs truncate max-w-[300px]">{(s as any).page_url}</TableCell>
                            <TableCell><Badge variant={scoreBadge((s as any).seo_score || 0)}>{(s as any).seo_score || 0}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* BACKLINKS TAB */}
        <TabsContent value="backlinks" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="backlinks" status={moduleStatuses.backlinks} onClick={() => runModule("backlinks")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.backlinks} />
            {backlinks.length > 0 && <Badge variant="outline">{backlinks.length} backlinks tracked</Badge>}
          </div>
          {backlinks.length === 0 ? (
            <EmptyModuleState label="Backlinks" status={moduleStatuses.backlinks} onRun={() => runModule("backlinks")} disabled={!hasDomain} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source URL</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Anchor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backlinks.map(bl => (
                        <TableRow key={bl.id}>
                          <TableCell className="font-mono text-xs truncate max-w-[200px]">{bl.source_url}</TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[200px]">{bl.target_url}</TableCell>
                          <TableCell>{bl.anchor_text}</TableCell>
                          <TableCell><Badge variant="outline">{bl.link_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{bl.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GAP ANALYSIS TAB */}
        <TabsContent value="gaps" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => analyzeGaps({ competitors: competitors.map(c => c.competitor_domain) })} disabled={gapAnalyzing || competitors.length === 0} size="sm">
              {gapAnalyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
              Run Gap Analysis
            </Button>
            {competitors.length === 0 && <span className="text-xs text-muted-foreground self-center">Run Competitors first</span>}
          </div>
          {latestAnalysis?.analysis_json?.content_gaps?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Content Gaps Discovered</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {latestAnalysis.analysis_json.content_gaps.map((gap: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="flex-1">{gap.topic}</span>
                      <Badge variant="outline">{gap.type}</Badge>
                      <Badge variant={priorityColor(gap.priority)}>{gap.priority}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {gaps.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Keyword Gaps ({gaps.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Gap Type</TableHead>
                      <TableHead>Opportunity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gaps.slice(0, 50).map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.keyword}</TableCell>
                        <TableCell><Badge variant="outline">{g.gap_type}</Badge></TableCell>
                        <TableCell><span className={scoreColor(g.opportunity_score || 0)}>{g.opportunity_score}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {gaps.length === 0 && !latestAnalysis?.analysis_json?.content_gaps?.length && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Run competitors analysis first, then run gap analysis</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ROADMAP TAB */}
        <TabsContent value="roadmap" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="roadmap" status={moduleStatuses.roadmap} onClick={() => runModule("roadmap")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.roadmap} />
          </div>
          {roadmap.length === 0 ? (
            <EmptyModuleState label="Roadmap" status={moduleStatuses.roadmap} onRun={() => runModule("roadmap")} disabled={!hasDomain} />
          ) : (
            <>
              {["high", "medium", "low"].map(priority => {
                const items = roadmap.filter(r => r.priority === priority);
                if (items.length === 0) return null;
                return (
                  <Card key={priority}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant={priorityColor(priority)}>{priority} priority</Badge>
                        <span className="text-muted-foreground">({items.length} items)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/50">
                            <button
                              onClick={() => updateRoadmapItem(item.id, { status: item.status === "completed" ? "pending" : "completed", completed_at: item.status === "completed" ? null : new Date().toISOString() })}
                              className="shrink-0"
                            >
                              {item.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />}
                            </button>
                            <span className={item.status === "completed" ? "line-through text-muted-foreground" : ""}>{item.title}</span>
                            <Badge variant="outline" className="ml-auto text-[10px]">{item.category}</Badge>
                            <Badge variant="secondary" className="text-[10px]">Impact: {item.estimated_impact}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* CONTENT WORKFLOW TAB */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="content" status={moduleStatuses.content} onClick={() => runModule("content")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.content} />
          </div>
          {contentWorkflow.length === 0 ? (
            <EmptyModuleState label="Content" status={moduleStatuses.content} onRun={() => runModule("content")} disabled={!hasDomain} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentWorkflow.map(cw => (
                        <TableRow key={cw.id}>
                          <TableCell className="font-medium">{cw.title}</TableCell>
                          <TableCell><Badge variant="outline">{cw.content_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{cw.status.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell>
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => updateContentWorkflow(cw.id, {
                                status: cw.status === "brief_created" ? "writing" : cw.status === "writing" ? "seo_review" : "published"
                              })}
                            >
                              Advance →
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SITEMAP TAB */}
        <TabsContent value="sitemap" className="space-y-4">
          <div className="flex items-center gap-2">
            <RunModuleButton module="sitemap" status={moduleStatuses.sitemap} onClick={() => runModule("sitemap")} disabled={!hasDomain} />
            <ModuleStatusBadge status={moduleStatuses.sitemap} />
            {sitemapData && <Badge variant="outline">{sitemapData.total_pages} pages</Badge>}
          </div>
          {!sitemapData ? (
            <EmptyModuleState label="Sitemap" status={moduleStatuses.sitemap} onRun={() => runModule("sitemap")} disabled={!hasDomain} />
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-sm">Sitemap — {sitemapData.total_pages} pages discovered</CardTitle></CardHeader>
              <CardContent>
                {!sitemapData.sitemap_found ? (
                  <p className="text-sm text-muted-foreground">No sitemap.xml found for this domain.</p>
                ) : (
                  <div className="max-h-[400px] overflow-auto space-y-1">
                    {sitemapData.urls.slice(0, 200).map((url, i) => (
                      <div key={i} className="text-xs font-mono p-1.5 rounded bg-muted/50 truncate">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{url}</a>
                      </div>
                    ))}
                    {sitemapData.urls.length > 200 && (
                      <p className="text-xs text-muted-foreground mt-2">...and {sitemapData.urls.length - 200} more pages</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeoIntelligencePage;
