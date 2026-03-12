import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Loader2, TrendingUp, Target, BarChart3, Shield,
  AlertTriangle, XCircle, CheckCircle2, Globe, Zap, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

const scoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const SalesSeoPitchPage = () => {
  const { profile } = useAuth();
  const [domain, setDomain] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const runQuickAudit = async () => {
    if (!domain.trim() || !profile?.business_id) return;
    setAnalyzing(true);
    setProgress(10);
    setResult(null);

    try {
      // Call the domain analyze function (no project needed for sales)
      const { data, error } = await supabase.functions.invoke("seo-domain-analyze", {
        body: {
          domain: domain.trim(),
          business_id: profile.business_id,
          seo_project_id: null,
        },
      });
      if (error) throw error;

      const analysisId = data?.analysis_id;
      if (!analysisId) throw new Error("No analysis started");

      // Poll for completion
      let elapsed = 0;
      const poll = setInterval(async () => {
        elapsed += 3;
        setProgress(Math.min(92, 10 + elapsed * 2));

        const { data: check } = await (supabase.from("seo_domain_analyses") as any)
          .select("*")
          .eq("id", analysisId)
          .single();

        if (check?.status === "completed") {
          clearInterval(poll);
          setProgress(100);
          setAnalyzing(false);

          // Fetch related data
          const [kwRes, compRes] = await Promise.all([
            (supabase.from("seo_keyword_intelligence") as any)
              .select("*").eq("domain_analysis_id", analysisId)
              .order("opportunity_score", { ascending: false }).limit(20),
            (supabase.from("seo_competitors") as any)
              .select("*").eq("business_id", profile.business_id)
              .order("created_at", { ascending: false }).limit(30),
          ]);

          setResult({
            analysis: check,
            keywords: kwRes.data || [],
            competitors: compRes.data || [],
          });
          toast.success("Prospect SEO audit complete!");
        } else if (check?.status === "failed" || elapsed > 180) {
          clearInterval(poll);
          setAnalyzing(false);
          setProgress(0);
          toast.error("Analysis failed or timed out.");
        }
      }, 3000);
    } catch (e: any) {
      setAnalyzing(false);
      setProgress(0);
      toast.error(e.message || "Failed to analyze");
    }
  };

  const analysis = result?.analysis;
  const keywords = result?.keywords || [];
  const competitors = result?.competitors || [];
  const issues = analysis?.analysis_json?.on_page_issues || [];
  const highIssues = issues.filter((i: any) => i.severity === "high");
  const contentGaps = analysis?.analysis_json?.content_gaps || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales SEO Intelligence</h1>
        <p className="text-sm text-muted-foreground">Quick-audit prospect domains for sales pitches</p>
      </div>

      {/* Domain Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter prospect domain (e.g. prospect.com.au)"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runQuickAudit()}
              className="flex-1"
            />
            <Button onClick={runQuickAudit} disabled={analyzing || !domain.trim()}>
              {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              {analyzing ? "Analyzing..." : "Quick SEO Audit"}
            </Button>
          </div>
          {analyzing && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress < 30 ? "Crawling prospect website..." :
                 progress < 60 ? "Discovering keywords & competitors..." :
                 "Generating audit report..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {analysis && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={`text-3xl font-bold ${scoreColor(analysis.seo_score)}`}>
                  {analysis.seo_score}
                </div>
                <p className="text-xs text-muted-foreground mt-1">SEO Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-bold text-foreground">{analysis.total_keywords}</div>
                <p className="text-xs text-muted-foreground mt-1">Keywords</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-bold text-foreground">{analysis.estimated_traffic.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Est. Traffic/mo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-bold text-foreground">{competitors.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Competitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-bold text-destructive">{highIssues.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Critical Issues</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pitch" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pitch"><Zap className="h-3 w-3 mr-1" />Pitch Summary</TabsTrigger>
              <TabsTrigger value="issues"><Shield className="h-3 w-3 mr-1" />SEO Issues</TabsTrigger>
              <TabsTrigger value="keywords"><Target className="h-3 w-3 mr-1" />Keywords</TabsTrigger>
              <TabsTrigger value="competitors"><BarChart3 className="h-3 w-3 mr-1" />Competitors</TabsTrigger>
            </TabsList>

            {/* PITCH SUMMARY */}
            <TabsContent value="pitch" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Domain Overview — {analysis.domain}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Overall SEO Score:</span> <span className={`font-bold ${scoreColor(analysis.seo_score)}`}>{analysis.seo_score}/100</span></div>
                    <div><span className="text-muted-foreground">Estimated Traffic:</span> <span className="font-bold">{analysis.estimated_traffic.toLocaleString()}/mo</span></div>
                    <div><span className="text-muted-foreground">Critical Issues:</span> <span className="font-bold text-destructive">{highIssues.length}</span></div>
                    <div><span className="text-muted-foreground">Content Gaps:</span> <span className="font-bold">{contentGaps.length}</span></div>
                  </div>

                  {/* Pitch-ready talking points */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold text-sm">🎯 Sales Pitch Points</h4>
                    {highIssues.length > 0 && (
                      <div className="p-3 bg-destructive/10 rounded-md text-sm">
                        <p className="font-medium text-destructive">⚠️ {highIssues.length} critical SEO issues found</p>
                        <ul className="mt-1 space-y-1 text-muted-foreground">
                          {highIssues.slice(0, 5).map((i: any, idx: number) => (
                            <li key={idx}>• {i.issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {contentGaps.length > 0 && (
                      <div className="p-3 bg-primary/10 rounded-md text-sm">
                        <p className="font-medium text-primary">📄 {contentGaps.length} content opportunities</p>
                        <ul className="mt-1 space-y-1 text-muted-foreground">
                          {contentGaps.slice(0, 5).map((g: any, idx: number) => (
                            <li key={idx}>• Missing: {g.topic} ({g.type})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {keywords.length > 0 && (
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p className="font-medium">🔍 Top keyword opportunities</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {keywords.slice(0, 10).map((kw: any) => (
                            <Badge key={kw.id} variant="outline" className="text-xs">{kw.keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              {analysis.analysis_json?.page_audit && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Score Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(analysis.analysis_json.page_audit).map(([key, val]) => (
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
            </TabsContent>

            {/* ISSUES */}
            <TabsContent value="issues" className="space-y-4">
              {issues.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No issues found</CardContent></Card>
              ) : (
                <Card>
                  <CardHeader><CardTitle className="text-sm">All SEO Issues ({issues.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {issues.map((issue: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50">
                          {issue.severity === "high" ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> :
                           issue.severity === "medium" ? <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" /> :
                           <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <p className="font-medium">{issue.issue}</p>
                            {issue.recommendation && <p className="text-xs text-muted-foreground mt-0.5">{issue.recommendation}</p>}
                          </div>
                          <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>{issue.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* KEYWORDS */}
            <TabsContent value="keywords">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Intent</TableHead>
                        <TableHead>Opportunity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.map((kw: any) => (
                        <TableRow key={kw.id}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{kw.keyword_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{kw.intent}</Badge></TableCell>
                          <TableCell><span className={scoreColor(kw.opportunity_score)}>{kw.opportunity_score}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* COMPETITORS */}
            <TabsContent value="competitors">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitors.slice(0, 30).map((c: any, i: number) => (
                        <TableRow key={c.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            <a href={`https://${c.competitor_domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              {c.competitor_domain} <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell>{c.competitor_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SalesSeoPitchPage;
