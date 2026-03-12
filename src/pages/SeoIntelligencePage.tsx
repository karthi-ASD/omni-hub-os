import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useSeoIntelligenceEngine } from "@/hooks/useSeoIntelligenceEngine";
import { useSeoRankChecks } from "@/hooks/useSeoRankChecks";
import { useSeoBacklinks, LINK_TYPES, BACKLINK_STATUSES } from "@/hooks/useSeoBacklinks";
import { useSeoContentGeneration, CONTENT_TYPES, TONES, CONTENT_STATUSES } from "@/hooks/useSeoContentGeneration";
import { useSeoPageScores } from "@/hooks/useSeoPageScores";
import { useSeoCompetitorGap, GAP_TYPES } from "@/hooks/useSeoCompetitorGap";
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
  ArrowLeft, TrendingUp, TrendingDown, Search, Loader2, Globe,
  Target, Sparkles, BarChart3, Link2, FileText, Shield, Map,
  Zap, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight,
} from "lucide-react";

const scoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

const scoreBadge = (score: number) => {
  if (score >= 80) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
};

const priorityColor = (p: string) => {
  if (p === "high") return "destructive";
  if (p === "medium") return "secondary";
  return "outline";
};

const SeoIntelligencePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useSeoProjects();
  const project = projects.find(p => p.id === projectId);

  const {
    analyses, keywords, roadmap, contentWorkflow, trafficEstimate,
    loading: engineLoading, analyzing, analysisProgress, runDomainAnalysis,
    updateRoadmapItem, updateContentWorkflow,
  } = useSeoIntelligenceEngine(projectId);

  const { checks, loading: ranksLoading } = useSeoRankChecks(projectId);
  const { backlinks, loading: blLoading } = useSeoBacklinks(projectId);
  const { scores, loading: scLoading } = useSeoPageScores(projectId);
  const { gaps, loading: gapLoading, analyzing: gapAnalyzing, analyzeGaps } = useSeoCompetitorGap(projectId);
  const { competitors } = useSeoCompetitors(projectId);

  const [domainInput, setDomainInput] = useState(project?.website_domain || "");
  const latestAnalysis = analyses[0];

  const handleAnalyze = () => {
    if (!domainInput.trim()) return;
    runDomainAnalysis(domainInput.trim());
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

      {/* Domain Analysis Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter domain to analyze (e.g. example.com.au)"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={analyzing || !domainInput.trim()}>
              {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {analyzing ? "Analyzing..." : "Run Full Analysis"}
            </Button>
          </div>
          {analyzing && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Running proprietary SEO intelligence engine...</p>
              <Progress value={45} className="h-2" />
              <p className="text-xs text-muted-foreground">Crawling → Keyword Discovery → Competitor Analysis → Audit → Scoring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {latestAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className={`text-3xl font-bold ${scoreColor(latestAnalysis.seo_score)}`}>
                {latestAnalysis.seo_score}
              </div>
              <p className="text-xs text-muted-foreground mt-1">SEO Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-foreground">
                {latestAnalysis.total_keywords}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Keywords</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-foreground">
                {latestAnalysis.estimated_traffic.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Est. Traffic/mo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-foreground">
                {competitors.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Competitors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-3xl font-bold text-foreground">
                {backlinks.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Backlinks</p>
            </CardContent>
          </Card>
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
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : !latestAnalysis ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-lg font-medium">No analysis yet</p>
              <p className="text-sm">Enter a domain above to run the NextWeb SEO Intelligence Engine</p>
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

              {/* Scores breakdown */}
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

              {/* Issues Summary */}
              {latestAnalysis.analysis_json?.on_page_issues?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Issues Found ({latestAnalysis.analysis_json.on_page_issues.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {latestAnalysis.analysis_json.on_page_issues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50">
                          {issue.severity === "high" ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> :
                           issue.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" /> :
                           <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />}
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
            <Badge variant="outline">{keywords.length} keywords</Badge>
            {["primary","secondary","long_tail","lsi","local","question"].map(type => {
              const count = keywords.filter(k => k.keyword_type === type).length;
              return count > 0 ? <Badge key={type} variant="secondary">{type.replace("_"," ")}: {count}</Badge> : null;
            })}
          </div>
          {keywords.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Run domain analysis to discover keywords
            </CardContent></Card>
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
                          <TableCell>
                            <span className={scoreColor(100 - kw.difficulty_score)}>{kw.difficulty_score}</span>
                          </TableCell>
                          <TableCell>
                            <span className={scoreColor(kw.opportunity_score)}>{kw.opportunity_score}</span>
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

        {/* COMPETITORS TAB */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{competitors.length} competitors</Badge>
          </div>
          {competitors.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Run domain analysis to auto-discover competitors
            </CardContent></Card>
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
          {scores.length === 0 && !latestAnalysis?.analysis_json?.page_audit ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Run domain analysis to generate page audits
            </CardContent></Card>
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
                           <AlertTriangle className="h-4 w-4 text-warning" />}
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
          <div className="flex gap-2">
            <Badge variant="outline">{backlinks.length} backlinks tracked</Badge>
          </div>
          {backlinks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No backlinks tracked yet
            </CardContent></Card>
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
            <Button onClick={() => analyzeGaps({ competitors: competitors.map(c => c.competitor_domain) })} disabled={gapAnalyzing} size="sm">
              {gapAnalyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
              Run Gap Analysis
            </Button>
          </div>
          {/* Content Gaps from AI */}
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
                        <TableCell><span className={scoreColor(g.opportunity_score)}>{g.opportunity_score}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ROADMAP TAB */}
        <TabsContent value="roadmap" className="space-y-4">
          {roadmap.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Run domain analysis to auto-generate SEO roadmap
            </CardContent></Card>
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
                              {item.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />}
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
          {contentWorkflow.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              Content gaps will be auto-populated after domain analysis
            </CardContent></Card>
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
      </Tabs>
    </div>
  );
};

export default SeoIntelligencePage;
