import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWebsiteTrees, WebsiteTreeRecord } from "@/hooks/useWebsiteTrees";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Globe, ChevronRight, ChevronDown, ExternalLink, FolderTree,
  FileText, Loader2, Search, Layers, BarChart3, TrendingUp, TrendingDown,
  Minus, Brain, Home, FolderOpen, File, Sparkles, Network,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ── Types ── */
interface TreeNodeData {
  url: string;
  title: string;
  level: number;
  children: TreeNodeData[];
}

/* ── Utility functions ── */
function countAllPages(nodes: TreeNodeData[]): number {
  let count = 0;
  for (const n of nodes) {
    count += 1;
    if (n.children?.length) count += countAllPages(n.children);
  }
  return count;
}

function getMaxDepth(nodes: TreeNodeData[], currentMax = 0): number {
  for (const n of nodes) {
    const lvl = (n.level || 0) + 1;
    if (lvl > currentMax) currentMax = lvl;
    if (n.children?.length) currentMax = getMaxDepth(n.children, currentMax);
  }
  return currentMax;
}

function getTopSections(nodes: TreeNodeData[]): { name: string; count: number }[] {
  if (!nodes?.length) return [];
  const root = nodes[0];
  if (!root?.children?.length) return [{ name: "/", count: countAllPages(nodes) }];
  return root.children
    .map((child) => ({
      name: child.title || extractPath(child.url),
      count: 1 + countAllPages(child.children || []),
    }))
    .sort((a, b) => b.count - a.count);
}

function extractPath(url: string): string {
  try {
    const path = new URL(url).pathname;
    const seg = path.split("/").filter(Boolean);
    return seg[0] ? `/${seg[0]}` : "/";
  } catch {
    return url;
  }
}

function getDepthDistribution(nodes: TreeNodeData[]): { level: number; count: number }[] {
  const map: Record<number, number> = {};
  function walk(n: TreeNodeData) {
    const lvl = n.level || 0;
    map[lvl] = (map[lvl] || 0) + 1;
    n.children?.forEach(walk);
  }
  nodes.forEach(walk);
  return Object.entries(map)
    .map(([k, v]) => ({ level: Number(k), count: v }))
    .sort((a, b) => a.level - b.level);
}

function flattenAll(nodes: TreeNodeData[]): TreeNodeData[] {
  const result: TreeNodeData[] = [];
  function walk(n: TreeNodeData) {
    result.push(n);
    n.children?.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

function generateInsights(
  totalPages: number,
  maxDepth: number,
  sections: { name: string; count: number }[],
  competitorAvgPages: number | null
): string[] {
  const insights: string[] = [];
  if (competitorAvgPages !== null) {
    if (totalPages > competitorAvgPages) {
      insights.push(`Your website has ${totalPages - Math.round(competitorAvgPages)} more pages than competitors — strong content presence.`);
    } else if (totalPages < competitorAvgPages) {
      insights.push(`Competitors average ${Math.round(competitorAvgPages)} pages — consider expanding your content.`);
    } else {
      insights.push("Your page count matches competitors — focus on content quality for differentiation.");
    }
  }
  if (maxDepth > 3) {
    insights.push(`Structure depth is ${maxDepth} levels — deep structures may impact crawl efficiency.`);
  } else if (maxDepth <= 2) {
    insights.push("Flat site structure (≤2 levels) — great for search engine crawlability.");
  }
  if (sections.length > 0) {
    const top = sections[0];
    const pct = totalPages > 0 ? Math.round((top.count / totalPages) * 100) : 0;
    insights.push(`"${top.name}" is your largest section with ${top.count} pages (${pct}% of site).`);
  }
  if (sections.length >= 5) {
    insights.push(`${sections.length} distinct sections detected — well-organized site architecture.`);
  }
  return insights;
}

/* ── Page Component ── */
const ClientWebsiteStructurePage = () => {
  usePageTitle("Website Intelligence");
  const { clientId, loading: authLoading } = useAuth();
  const { clientTree, competitorTrees, loading } = useWebsiteTrees(undefined, clientId || undefined);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  // Derived analytics
  const analytics = useMemo(() => {
    if (!clientTree?.tree_data?.length) return null;
    const nodes: TreeNodeData[] = clientTree.tree_data;
    const totalPages = clientTree.total_pages || countAllPages(nodes);
    const maxDepth = getMaxDepth(nodes);
    const sections = getTopSections(nodes);
    const avgPagesPerSection = sections.length > 0 ? totalPages / sections.length : 0;
    const depthDist = getDepthDistribution(nodes);

    const competitorAvgPages =
      competitorTrees.length > 0
        ? competitorTrees.reduce((sum, ct) => sum + (ct.total_pages || 0), 0) / competitorTrees.length
        : null;

    const insights = generateInsights(totalPages, maxDepth, sections, competitorAvgPages);

    return { totalPages, maxDepth, sections, avgPagesPerSection, depthDist, competitorAvgPages, insights };
  }, [clientTree, competitorTrees]);

  // Search/filter for tree view
  const filteredFlat = useMemo(() => {
    if (!clientTree?.tree_data?.length) return [];
    const all = flattenAll(clientTree.tree_data);
    return all.filter((n) => {
      if (searchQuery && !n.url.toLowerCase().includes(searchQuery.toLowerCase()) && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterLevel !== null && n.level !== filterLevel) return false;
      return true;
    });
  }, [clientTree, searchQuery, filterLevel]);

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Analyzing your website…</p>
        </div>
      </div>
    );
  }

  const hasData = !!clientTree;

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader />
        <Card className="rounded-2xl border-dashed border-2 border-primary/20">
          <CardContent className="text-center py-16 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Network className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your Website Intelligence is Getting Ready</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                We're mapping your website structure to provide actionable SEO intelligence. Data will appear here after your SEO team generates the analysis.
              </p>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" /> Powered by NextWeb Intelligence
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader />

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-xs gap-1.5">
            <FolderTree className="h-3.5 w-3.5" /> Structure
          </TabsTrigger>
          {competitorTrees.length > 0 && (
            <TabsTrigger value="compare" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Comparison
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {analytics && (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={<FileText className="h-4 w-4" />} label="Total Pages" value={analytics.totalPages} gradient="from-blue-500/10 to-blue-600/5" />
                <KpiCard icon={<Layers className="h-4 w-4" />} label="Max Depth" value={`${analytics.maxDepth} levels`} gradient="from-violet-500/10 to-violet-600/5" />
                <KpiCard icon={<FolderOpen className="h-4 w-4" />} label="Sections" value={analytics.sections.length} gradient="from-emerald-500/10 to-emerald-600/5" />
                <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Avg Pages/Section" value={analytics.avgPagesPerSection.toFixed(1)} gradient="from-amber-500/10 to-amber-600/5" />
                <KpiCard icon={<Globe className="h-4 w-4" />} label="Last Updated" value={new Date(clientTree.updated_at).toLocaleDateString()} gradient="from-sky-500/10 to-sky-600/5" />
                <KpiCard
                  icon={<Layers className="h-4 w-4" />}
                  label="Competitor Avg"
                  value={analytics.competitorAvgPages !== null ? `${Math.round(analytics.competitorAvgPages)} pages` : "N/A"}
                  gradient="from-rose-500/10 to-rose-600/5"
                />
              </div>

              {/* Section Breakdown + Depth Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Top Sections */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" /> Top Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analytics.sections.slice(0, 8).map((s, i) => {
                      const pct = analytics.totalPages > 0 ? (s.count / analytics.totalPages) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate max-w-[180px]">{s.name}</span>
                            <span className="text-muted-foreground">{s.count} pages ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Depth Analysis */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> Depth Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analytics.depthDist.map((d) => {
                      const maxCount = Math.max(...analytics.depthDist.map((x) => x.count));
                      const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                      return (
                        <div key={d.level} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">Level {d.level}</span>
                            <span className="text-muted-foreground">{d.count} pages</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Smart Insights */}
              {analytics.insights.length > 0 && (
                <Card className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" /> Smart Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {analytics.insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-background/60 border border-border/50">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── STRUCTURE TAB ── */}
        <TabsContent value="structure" className="space-y-4 mt-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages by URL or title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              <Badge
                variant={filterLevel === null ? "default" : "outline"}
                className="cursor-pointer text-xs px-3"
                onClick={() => setFilterLevel(null)}
              >
                All
              </Badge>
              {analytics?.depthDist.map((d) => (
                <Badge
                  key={d.level}
                  variant={filterLevel === d.level ? "default" : "outline"}
                  className="cursor-pointer text-xs px-3"
                  onClick={() => setFilterLevel(filterLevel === d.level ? null : d.level)}
                >
                  L{d.level}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tree or Flat List */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-primary" /> Site Map
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {searchQuery || filterLevel !== null ? `${filteredFlat.length} results` : `${analytics?.totalPages || 0} pages`}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto">
                {searchQuery || filterLevel !== null ? (
                  filteredFlat.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No pages match your filter.</p>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredFlat.map((n, i) => (
                        <div key={n.url + i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-muted/50 text-sm group">
                          <PageIcon level={n.level} hasChildren={false} />
                          <span className="truncate flex-1 font-medium">{n.title || "Untitled"}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">L{n.level}</Badge>
                          <a href={n.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <ReadOnlyTree nodes={clientTree.tree_data || []} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMPARISON TAB ── */}
        {competitorTrees.length > 0 && (
          <TabsContent value="compare" className="space-y-4 mt-4">
            {/* Comparison Table */}
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> You vs Competitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 font-medium">Metric</th>
                        <th className="text-center py-2 font-medium">Your Site</th>
                        {competitorTrees.map((ct, i) => (
                          <th key={ct.id} className="text-center py-2 font-medium truncate max-w-[120px]">
                            {ct.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow
                        label="Total Pages"
                        clientValue={analytics?.totalPages || 0}
                        competitorValues={competitorTrees.map((ct) => ct.total_pages || 0)}
                        higherIsBetter
                      />
                      <ComparisonRow
                        label="Max Depth"
                        clientValue={analytics?.maxDepth || 0}
                        competitorValues={competitorTrees.map((ct) => getMaxDepth(ct.tree_data || []))}
                        higherIsBetter={false}
                      />
                      <ComparisonRow
                        label="Sections"
                        clientValue={analytics?.sections.length || 0}
                        competitorValues={competitorTrees.map((ct) => getTopSections(ct.tree_data || []).length)}
                        higherIsBetter
                      />
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Competitor Trees */}
            {competitorTrees.map((ct, i) => (
              <Card key={ct.id} className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Competitor {i + 1}: {ct.domain.replace(/^https?:\/\//, "")}
                    <Badge variant="outline" className="text-[10px] ml-auto">{ct.total_pages} pages</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-auto">
                    <ReadOnlyTree nodes={ct.tree_data || []} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ClientWebsiteStructurePage;

/* ── Shared Components ── */

const PageHeader = () => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
      <Network className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h1 className="text-xl font-bold">Website Intelligence</h1>
      <p className="text-xs text-muted-foreground">Structure analysis & competitive insights powered by NextWeb</p>
    </div>
  </div>
);

const KpiCard = ({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string | number; gradient: string }) => (
  <Card className="rounded-xl overflow-hidden">
    <CardContent className={`p-4 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </CardContent>
  </Card>
);

const PageIcon = ({ level, hasChildren }: { level: number; hasChildren: boolean }) => {
  if (level === 0) return <Home className="h-4 w-4 text-primary shrink-0" />;
  if (hasChildren) return <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  return <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
};

const ComparisonRow = ({
  label,
  clientValue,
  competitorValues,
  higherIsBetter,
}: {
  label: string;
  clientValue: number;
  competitorValues: number[];
  higherIsBetter: boolean;
}) => {
  const getIndicator = (client: number, competitor: number) => {
    if (client === competitor) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    const better = higherIsBetter ? client > competitor : client < competitor;
    return better ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
    );
  };

  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 text-muted-foreground text-xs">{label}</td>
      <td className="py-2.5 text-center font-semibold">{clientValue}</td>
      {competitorValues.map((cv, i) => (
        <td key={i} className="py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span>{cv}</span>
            {getIndicator(clientValue, cv)}
          </div>
        </td>
      ))}
    </tr>
  );
};

const ReadOnlyTree = ({ nodes }: { nodes: TreeNodeData[] }) => {
  if (!nodes || nodes.length === 0) return <p className="text-xs text-muted-foreground py-2">No pages found.</p>;
  return (
    <div>
      {nodes.map((node, i) => (
        <ReadOnlyNode key={node.url + i} node={node} />
      ))}
    </div>
  );
};

const ReadOnlyNode = ({ node }: { node: TreeNodeData }) => {
  const [expanded, setExpanded] = useState(node.level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${(node.level || 0) * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <button className="p-0.5 rounded hover:bg-muted" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        <PageIcon level={node.level} hasChildren={hasChildren} />

        <span className="text-sm font-medium truncate flex-1">{node.title || "Untitled"}</span>

        {hasChildren && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{node.children.length}</Badge>
        )}

        <a
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </a>
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-border/40 ml-[calc(var(--indent,0px)+18px)]" style={{ "--indent": `${(node.level || 0) * 20 + 8}px` } as any}>
          {node.children.map((child, i) => (
            <ReadOnlyNode key={child.url + i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};
