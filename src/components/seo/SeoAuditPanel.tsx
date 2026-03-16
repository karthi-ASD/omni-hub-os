import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import {
  Scan, AlertTriangle, CheckCircle, FileWarning, Image, Link2,
  Globe, Code, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeoPageAudit } from "@/hooks/useSeoPageAudits";

interface Props {
  audits: SeoPageAudit[];
  loading: boolean;
  crawling: boolean;
  crawlProgress: string;
  onRunAudit: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

export function SeoAuditPanel({ audits, loading, crawling, crawlProgress, onRunAudit }: Props) {
  if (loading) return <Skeleton className="h-48 w-full" />;

  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + (a.seo_score || 0), 0) / audits.length)
    : 0;
  const missingTitles = audits.filter(a => !a.title_tag).length;
  const missingMeta = audits.filter(a => !a.meta_description).length;
  const missingH1 = audits.filter(a => !a.h1_tag).length;
  const missingSchema = audits.filter(a => !a.schema_present).length;
  const totalMissingAlt = audits.reduce((s, a) => s + (a.missing_alt_tags_count || 0), 0);
  const thinPages = audits.filter(a => (a.word_count || 0) < 300).length;
  const totalIssues = audits.reduce((s, a) => s + ((a.issues_json as any[])?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Run Audit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SEO Site Audit</h2>
          <p className="text-sm text-muted-foreground">
            {audits.length > 0
              ? `Last audit: ${new Date(audits[0].audit_date || audits[0].created_at).toLocaleDateString()} · ${audits.length} pages scanned`
              : "No audit data yet. Run your first audit."}
          </p>
        </div>
        <Button onClick={onRunAudit} disabled={crawling} className="gap-2">
          {crawling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
          {crawling ? "Auditing..." : "Run SEO Audit"}
        </Button>
      </div>

      {/* Crawl Progress */}
      {crawling && crawlProgress && (
        <Card className="rounded-2xl border-0 shadow-elevated bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">{crawlProgress}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {audits.length === 0 && !crawling && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-16 text-center">
            <Scan className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No audit data</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click "Run SEO Audit" to crawl the website and detect issues</p>
          </CardContent>
        </Card>
      )}

      {audits.length > 0 && (
        <>
          {/* Score Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="rounded-2xl border-0 shadow-elevated col-span-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="relative h-16 w-16">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={avgScore >= 80 ? "hsl(var(--success))" : avgScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                      strokeWidth="3" strokeDasharray={`${avgScore} ${100 - avgScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={cn("absolute inset-0 flex items-center justify-center text-lg font-bold", getScoreColor(avgScore))}>
                    {avgScore}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">SEO Health Score</p>
                  <p className="text-xs text-muted-foreground">{audits.length} pages analyzed</p>
                </div>
              </CardContent>
            </Card>
            <StatCard label="Missing Titles" value={missingTitles} icon={FileText} gradient="from-destructive to-red-500" alert={missingTitles > 0} />
            <StatCard label="Missing Meta" value={missingMeta} icon={FileWarning} gradient="from-warning to-orange-500" alert={missingMeta > 0} />
            <StatCard label="Missing H1" value={missingH1} icon={AlertTriangle} gradient="from-destructive to-red-500" alert={missingH1 > 0} />
            <StatCard label="Missing Schema" value={missingSchema} icon={Code} gradient="from-info to-blue-500" />
            <StatCard label="Missing Alt" value={totalMissingAlt} icon={Image} gradient="from-warning to-amber-500" alert={totalMissingAlt > 0} />
            <StatCard label="Thin Pages" value={thinPages} icon={FileText} gradient="from-destructive to-rose-500" alert={thinPages > 0} />
          </div>

          {/* Page-Level Results Table */}
          <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Page-Level Audit Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold min-w-[200px]">URL</TableHead>
                      <TableHead className="font-semibold text-center">Score</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Meta</TableHead>
                      <TableHead className="font-semibold">H1</TableHead>
                      <TableHead className="font-semibold text-center">Words</TableHead>
                      <TableHead className="font-semibold text-center">Images</TableHead>
                      <TableHead className="font-semibold text-center">Links</TableHead>
                      <TableHead className="font-semibold text-center">Schema</TableHead>
                      <TableHead className="font-semibold text-center">Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map(a => {
                      const issues = (a.issues_json as any[]) || [];
                      const highIssues = issues.filter(i => i.severity === "high").length;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs truncate max-w-[250px]" title={a.page_url}>
                            {(() => {
                              try { return new URL(a.page_url).pathname || "/"; } catch { return a.page_url; }
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("font-bold text-sm", getScoreColor(a.seo_score || 0))}>
                              {a.seo_score || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            {a.title_tag ? (
                              <span className="text-xs truncate max-w-[150px] block" title={a.title_tag}>{a.title_tag.substring(0, 40)}{a.title_tag.length > 40 ? "..." : ""}</span>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.meta_description ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {a.h1_tag ? (
                              <span className="text-xs truncate max-w-[120px] block" title={a.h1_tag}>{a.h1_tag.substring(0, 30)}</span>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("text-xs font-mono", (a.word_count || 0) < 300 ? "text-destructive" : "")}>
                              {a.word_count || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs">
                              {a.image_count || 0}
                              {(a.missing_alt_tags_count || 0) > 0 && (
                                <span className="text-destructive ml-1">({a.missing_alt_tags_count} no alt)</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <span className="text-muted-foreground">{a.internal_links_count || 0}i / {a.external_links_count || 0}e</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {a.schema_present ? (
                              <CheckCircle className="h-4 w-4 text-success mx-auto" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-warning mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {highIssues > 0 ? (
                              <Badge variant="destructive" className="text-[10px]">{highIssues} critical</Badge>
                            ) : issues.length > 0 ? (
                              <Badge variant="secondary" className="text-[10px]">{issues.length}</Badge>
                            ) : (
                              <CheckCircle className="h-4 w-4 text-success mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Issues Summary */}
          <IssuesSummary audits={audits} />
        </>
      )}
    </div>
  );
}

function IssuesSummary({ audits }: { audits: SeoPageAudit[] }) {
  const allIssues: any[] = [];
  audits.forEach(a => {
    const issues = (a.issues_json as any[]) || [];
    issues.forEach(issue => {
      allIssues.push({ ...issue, page_url: a.page_url });
    });
  });

  const highIssues = allIssues.filter(i => i.severity === "high");
  const mediumIssues = allIssues.filter(i => i.severity === "medium");
  const lowIssues = allIssues.filter(i => i.severity === "low");

  if (allIssues.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <IssueCard title="Critical Issues" issues={highIssues} color="destructive" />
      <IssueCard title="Warnings" issues={mediumIssues} color="warning" />
      <IssueCard title="Notices" issues={lowIssues} color="muted-foreground" />
    </div>
  );
}

function IssueCard({ title, issues, color }: { title: string; issues: any[]; color: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full bg-${color}`} />
          {title} ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {issues.length === 0 ? (
          <p className="text-xs text-muted-foreground">None found</p>
        ) : (
          issues.slice(0, 15).map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle className={cn("h-3 w-3 shrink-0 mt-0.5", `text-${color}`)} />
              <div>
                <p className="font-medium">{issue.issue}</p>
                {issue.page_url && (
                  <p className="text-muted-foreground font-mono truncate max-w-[200px]">
                    {(() => { try { return new URL(issue.page_url).pathname; } catch { return issue.page_url; } })()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {issues.length > 15 && (
          <p className="text-xs text-muted-foreground pt-1">+{issues.length - 15} more...</p>
        )}
      </CardContent>
    </Card>
  );
}
