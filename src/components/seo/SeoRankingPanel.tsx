import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Loader2, RefreshCw, Search,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GscDataRow } from "@/hooks/useGscData";
import type { SeoKeyword } from "@/hooks/useSeo";
import type { RankingHistoryRow } from "@/hooks/useKeywordRankingHistory";

interface Props {
  gscData: GscDataRow[];
  keywords: SeoKeyword[];
  rankingHistory: RankingHistoryRow[];
  gscLoading: boolean;
  syncing: boolean;
  onSync: () => void;
}

export function SeoRankingPanel({ gscData, keywords, rankingHistory, gscLoading, syncing, onSync }: Props) {
  const [period, setPeriod] = useState<"7" | "14" | "28">("14");

  // Aggregate GSC stats
  const stats = useMemo(() => {
    const cutoff = new Date(Date.now() - Number(period) * 86400000).toISOString().split("T")[0];
    const filtered = gscData.filter(d => d.date >= cutoff);
    const totalClicks = filtered.reduce((s, d) => s + d.clicks, 0);
    const totalImpressions = filtered.reduce((s, d) => s + d.impressions, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgPosition = filtered.length > 0
      ? filtered.reduce((s, d) => s + d.position, 0) / filtered.length
      : 0;
    return { totalClicks, totalImpressions, avgCtr, avgPosition };
  }, [gscData, period]);

  // Daily trend chart data
  const dailyTrend = useMemo(() => {
    const cutoff = new Date(Date.now() - Number(period) * 86400000).toISOString().split("T")[0];
    const byDate = new Map<string, { clicks: number; impressions: number; positions: number[]; }>();
    for (const d of gscData) {
      if (d.date < cutoff) continue;
      const existing = byDate.get(d.date) || { clicks: 0, impressions: 0, positions: [] };
      existing.clicks += d.clicks;
      existing.impressions += d.impressions;
      existing.positions.push(d.position);
      byDate.set(d.date, existing);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: date.substring(5),
        Clicks: v.clicks,
        Impressions: v.impressions,
        "Avg Position": parseFloat((v.positions.reduce((s, p) => s + p, 0) / v.positions.length).toFixed(1)),
      }));
  }, [gscData, period]);

  // Top queries table
  const topQueries = useMemo(() => {
    const cutoff = new Date(Date.now() - Number(period) * 86400000).toISOString().split("T")[0];
    const byQuery = new Map<string, { clicks: number; impressions: number; positions: number[] }>();
    for (const d of gscData) {
      if (d.date < cutoff) continue;
      const existing = byQuery.get(d.query) || { clicks: 0, impressions: 0, positions: [] };
      existing.clicks += d.clicks;
      existing.impressions += d.impressions;
      existing.positions.push(d.position);
      byQuery.set(d.query, existing);
    }
    return [...byQuery.entries()]
      .map(([query, v]) => ({
        query,
        clicks: v.clicks,
        impressions: v.impressions,
        ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
        position: parseFloat((v.positions.reduce((s, p) => s + p, 0) / v.positions.length).toFixed(1)),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 30);
  }, [gscData, period]);

  // Ranking history chart for tracked keywords
  const rankingChart = useMemo(() => {
    if (!rankingHistory.length) return [];
    const byDate = new Map<string, Record<string, number>>();
    const keywordNames = new Map(keywords.map(k => [k.id, k.keyword]));

    for (const h of rankingHistory) {
      const date = h.date_checked.substring(0, 10);
      const row = byDate.get(date) || {};
      const name = keywordNames.get(h.keyword_id) || h.keyword_id.substring(0, 8);
      row[name] = h.rank_position || 0;
      byDate.set(date, row);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date: date.substring(5), ...values }));
  }, [rankingHistory, keywords]);

  const trackedKeywordNames = useMemo(() => {
    const names = new Set<string>();
    const keywordNames = new Map(keywords.map(k => [k.id, k.keyword]));
    for (const h of rankingHistory) {
      const name = keywordNames.get(h.keyword_id);
      if (name) names.add(name);
    }
    return [...names].slice(0, 8);
  }, [rankingHistory, keywords]);

  const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8b5cf6", "#06b6d4"];

  // Keyword ranking distribution
  const top3 = keywords.filter(k => k.current_ranking != null && k.current_ranking <= 3).length;
  const top10 = keywords.filter(k => k.current_ranking != null && k.current_ranking <= 10).length;
  const improved = keywords.filter(k => k.current_ranking != null && k.previous_ranking != null && k.current_ranking < k.previous_ranking).length;
  const declined = keywords.filter(k => k.current_ranking != null && k.previous_ranking != null && k.current_ranking > k.previous_ranking).length;

  if (gscLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rankings & Search Console</h2>
          <p className="text-sm text-muted-foreground">
            {gscData.length > 0
              ? `${gscData.length} data points · Last sync: ${gscData[0]?.date || "—"}`
              : "No ranking data yet. Click sync to pull data."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="28">Last 28 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onSync} disabled={syncing} size="sm" className="gap-1.5">
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {syncing ? "Syncing..." : "Sync Rankings"}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Clicks" value={stats.totalClicks.toLocaleString()} icon={Search} gradient="from-primary to-accent" />
        <StatCard label="Impressions" value={stats.totalImpressions.toLocaleString()} icon={BarChart3} gradient="from-info to-blue-500" />
        <StatCard label="Avg CTR" value={`${(stats.avgCtr * 100).toFixed(1)}%`} icon={ArrowUpRight} gradient="from-success to-emerald-500" />
        <StatCard label="Avg Position" value={stats.avgPosition.toFixed(1)} icon={TrendingUp} gradient="from-warning to-orange-500" />
        <StatCard label="Top 3" value={top3} icon={TrendingUp} gradient="from-success to-emerald-600" />
        <StatCard label="Top 10" value={top10} icon={TrendingUp} gradient="from-primary to-accent" />
        <StatCard label="Improved" value={improved} icon={ArrowUpRight} gradient="from-success to-emerald-500" />
        <StatCard label="Declined" value={declined} icon={ArrowDownRight} gradient="from-destructive to-red-500" alert={declined > 0} />
      </div>

      {/* Performance Chart */}
      {dailyTrend.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Search Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="hsl(var(--muted-foreground))" reversed />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Impressions" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} opacity={0.5} />
                <Line yAxisId="right" type="monotone" dataKey="Avg Position" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ranking History Chart */}
      {rankingChart.length > 0 && trackedKeywordNames.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Keyword Ranking History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rankingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis reversed fontSize={11} stroke="hsl(var(--muted-foreground))" label={{ value: "Position", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                {trackedKeywordNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Queries Table */}
      {topQueries.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Top Search Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Query</TableHead>
                    <TableHead className="font-semibold text-right">Clicks</TableHead>
                    <TableHead className="font-semibold text-right">Impressions</TableHead>
                    <TableHead className="font-semibold text-right">CTR</TableHead>
                    <TableHead className="font-semibold text-right">Position</TableHead>
                    <TableHead className="font-semibold text-center">Tracked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topQueries.map((q) => {
                    const tracked = keywords.some(k => k.keyword.toLowerCase() === q.query.toLowerCase());
                    return (
                      <TableRow key={q.query}>
                        <TableCell className="font-medium text-sm">{q.query}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{q.clicks}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{q.impressions}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(q.ctr * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-mono text-sm font-bold",
                            q.position <= 3 ? "text-success" : q.position <= 10 ? "text-primary" : q.position <= 20 ? "text-warning" : "text-destructive",
                          )}>
                            {q.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {tracked ? (
                            <Badge variant="secondary" className="text-[10px]">Tracked</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
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
      )}

      {gscData.length === 0 && !syncing && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No ranking data available</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
              Click "Sync Rankings" to pull data from Google Search Console. If no API key is configured, simulated data will be generated based on your tracked keywords.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
