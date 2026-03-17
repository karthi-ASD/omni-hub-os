import { useParams, useNavigate } from "react-router-dom";
import { useClientSeoProjectDetail } from "@/hooks/useClientSeoProject";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Minus,
  Search, TrendingUp, CheckCircle, Eye, Globe, Calendar,
  MapPin, Package, BarChart3, Wrench, Users,
} from "lucide-react";

const RankBadge = ({ current, previous }: { current: number | null; previous: number | null }) => {
  if (!current) return <span className="text-muted-foreground text-xs">—</span>;
  const diff = previous ? previous - current : 0;
  if (diff > 0) return <span className="text-success font-semibold text-xs flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />+{diff}</span>;
  if (diff < 0) return <span className="text-destructive font-semibold text-xs flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" />{diff}</span>;
  return <span className="text-muted-foreground text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" />0</span>;
};

const ClientSeoProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, keywords, competitors, workLog, loading } = useClientSeoProjectDetail(projectId);
  usePageTitle(project?.project_name || "SEO Project");

  const kwTop3 = keywords.filter(k => k.current_ranking && k.current_ranking <= 3).length;
  const kwTop10 = keywords.filter(k => k.current_ranking && k.current_ranking <= 10).length;
  const kwTop20 = keywords.filter(k => k.current_ranking && k.current_ranking <= 20).length;
  const completedTasks = workLog.filter(t => t.status === "completed").length;
  const totalGrowth = keywords.reduce((sum, k) => {
    if (k.current_ranking && k.previous_ranking) return sum + (k.previous_ranking - k.current_ranking);
    return sum;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h2 className="text-lg font-semibold mb-2">Project not found</h2>
        <Button variant="outline" onClick={() => navigate("/client-seo-projects")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/client-seo-projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{project.project_name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {project.website_domain || "—"}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.target_location || "—"}</span>
          </p>
        </div>
        <Badge variant={project.project_status === "active" ? "default" : "secondary"} className="ml-auto text-xs">
          {project.project_status}
        </Badge>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Keywords", value: keywords.length, icon: Search, color: "text-primary" },
          { label: "Top 10 Rankings", value: kwTop10, icon: TrendingUp, color: "text-success" },
          { label: "Ranking Growth", value: totalGrowth, icon: ArrowUpRight, color: "text-info", prefix: totalGrowth > 0 ? "+" : "", suffix: " pos" },
          { label: "Tasks Completed", value: completedTasks, icon: CheckCircle, color: "text-success" },
        ].map(m => (
          <Card key={m.label} className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-card flex items-center justify-center border border-border/50 ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <AnimatedCounter end={m.value} prefix={m.prefix || ""} suffix={m.suffix || ""} className="text-xl font-extrabold" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1"><Package className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1"><Search className="h-3.5 w-3.5" /> Keywords</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Performance</TabsTrigger>
          <TabsTrigger value="workdone" className="gap-1"><Wrench className="h-3.5 w-3.5" /> Work Done</TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1"><Users className="h-3.5 w-3.5" /> Competitors</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardHeader><CardTitle className="text-sm font-bold">Project Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Package", value: project.service_package || "Standard" },
                  { label: "Start Date", value: project.contract_start ? new Date(project.contract_start).toLocaleDateString("en-AU") : "—" },
                  { label: "Target Location", value: project.target_location || "—" },
                  { label: "Domain", value: project.website_domain || "—" },
                  { label: "Onboarding", value: project.onboarding_status || "—" },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold capitalize">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardHeader><CardTitle className="text-sm font-bold">Keyword Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Top 3", count: kwTop3, color: "bg-success" },
                  { label: "Top 10", count: kwTop10, color: "bg-info" },
                  { label: "Top 20", count: kwTop20, color: "bg-primary" },
                  { label: "Total Tracked", count: keywords.length, color: "bg-muted-foreground" },
                ].map(tier => (
                  <div key={tier.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-muted-foreground">{tier.label}</span>
                      <span className="font-bold">{tier.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${tier.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min((tier.count / Math.max(keywords.length, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {keywords.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No keywords tracked yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── KEYWORDS ── */}
        <TabsContent value="keywords">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> All Keywords ({keywords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Keyword</TableHead>
                        <TableHead className="text-xs text-center">Current Rank</TableHead>
                        <TableHead className="text-xs text-center">Change</TableHead>
                        <TableHead className="text-xs text-right">Search Volume</TableHead>
                        <TableHead className="text-xs text-center">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.map(kw => (
                        <TableRow key={kw.id} className="hover:bg-muted/30">
                          <TableCell className="text-sm font-medium">{kw.keyword}</TableCell>
                          <TableCell className="text-center">
                            {kw.current_ranking ? (
                              <Badge variant={kw.current_ranking <= 3 ? "default" : kw.current_ranking <= 10 ? "secondary" : "outline"} className="font-mono text-xs">
                                #{kw.current_ranking}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-center"><RankBadge current={kw.current_ranking} previous={kw.previous_ranking} /></TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{kw.search_volume?.toLocaleString() ?? "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] capitalize">{kw.keyword_type || "primary"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Keywords will appear here once your SEO campaign begins
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PERFORMANCE ── */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Keywords in Top 3</p>
                <AnimatedCounter end={kwTop3} className="text-3xl font-black text-success" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-info" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Keywords in Top 10</p>
                <AnimatedCounter end={kwTop10} className="text-3xl font-black text-info" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-6 text-center">
                <ArrowUpRight className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Ranking Growth</p>
                <AnimatedCounter end={totalGrowth} prefix={totalGrowth > 0 ? "+" : ""} suffix=" pos" className="text-3xl font-black" />
              </CardContent>
            </Card>
          </div>
          {/* Top movers */}
          <Card className="rounded-2xl border-0 shadow-elevated mt-6">
            <CardHeader><CardTitle className="text-sm font-bold">Top Movers</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const movers = keywords
                  .filter(k => k.current_ranking && k.previous_ranking)
                  .map(k => ({ ...k, change: (k.previous_ranking ?? 0) - (k.current_ranking ?? 0) }))
                  .sort((a, b) => b.change - a.change)
                  .slice(0, 10);
                if (movers.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">No ranking changes recorded yet</p>;
                return (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-xs text-center">Previous</TableHead>
                      <TableHead className="text-xs text-center">Current</TableHead>
                      <TableHead className="text-xs text-center">Change</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {movers.map(k => (
                        <TableRow key={k.id}>
                          <TableCell className="text-sm font-medium">{k.keyword}</TableCell>
                          <TableCell className="text-center text-muted-foreground">#{k.previous_ranking}</TableCell>
                          <TableCell className="text-center"><Badge variant="secondary" className="font-mono">#{k.current_ranking}</Badge></TableCell>
                          <TableCell className="text-center"><RankBadge current={k.current_ranking} previous={k.previous_ranking} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WORK DONE ── */}
        <TabsContent value="workdone">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" /> Work Log ({workLog.length} tasks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workLog.length > 0 ? (
                <div className="space-y-2">
                  {workLog.map(task => (
                    <div key={task.id} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${task.status === "completed" ? "text-success" : task.status === "in_progress" ? "text-info" : "text-muted-foreground"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{task.task_title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize flex items-center gap-2">
                          {task.task_category}
                          {task.updated_at && <span>• {new Date(task.updated_at).toLocaleDateString("en-AU")}</span>}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "default" : task.status === "in_progress" ? "secondary" : "outline"} className="text-[10px] shrink-0">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-center text-xs text-muted-foreground pt-3">
                    ✅ {completedTasks} of {workLog.length} tasks completed
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Work log will appear here as tasks are completed by your SEO team
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPETITORS ── */}
        <TabsContent value="competitors">
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-info" /> Competitor Analysis ({competitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competitors.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">Competitor</TableHead>
                      <TableHead className="text-xs">Domain</TableHead>
                      <TableHead className="text-xs text-center">Ranking Position</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {competitors.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm font-medium">{c.competitor_name || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.competitor_domain}</TableCell>
                          <TableCell className="text-center">
                            {c.ranking_position ? <Badge variant="outline" className="font-mono text-xs">#{c.ranking_position}</Badge> : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Competitor data will appear once your SEO team adds competitor analysis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientSeoProjectDetailPage;
