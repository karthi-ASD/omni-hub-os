import { useGoogleMapsStats } from "@/hooks/useGoogleMapsStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Eye, Phone, Navigation, MousePointerClick, Star, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface Props {
  projectId: string;
}

export function MapsPerformancePanel({ projectId }: Props) {
  const { aggregated, syncStatus, loading } = useGoogleMapsStats({ projectId });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const { totalViews, totalCalls, totalDirections, totalWebClicks, viewsGrowth, latestRating, latestReviews, chartData } = aggregated;

  const growthBadge = (pct: number) => (
    <Badge variant="secondary" className="text-xs gap-1">
      {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </Badge>
  );

  const kpis = [
    { label: "Total Views", value: totalViews, icon: Eye, growth: viewsGrowth },
    { label: "Phone Calls", value: totalCalls, icon: Phone },
    { label: "Direction Requests", value: totalDirections, icon: Navigation },
    { label: "Website Clicks", value: totalWebClicks, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      {syncStatus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last sync: {syncStatus.last_sync_at ? new Date(syncStatus.last_sync_at).toLocaleString() : "Never"}</span>
          <Badge variant={syncStatus.sync_status === "synced" ? "default" : "secondary"} className="text-xs ml-1">{syncStatus.sync_status}</Badge>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <k.icon className="h-4 w-4 text-muted-foreground" />
                {k.growth !== undefined && growthBadge(k.growth)}
              </div>
              <p className="text-2xl font-bold">{k.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{k.label} (Last 30 Days)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Card */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Average Rating</span>
            </div>
            <p className="text-3xl font-bold">{latestRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{latestReviews} total reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Views Breakdown</span>
            </div>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-lg font-bold">{aggregated.viewsSearch.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Search</p>
              </div>
              <div>
                <p className="text-lg font-bold">{aggregated.viewsMaps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Maps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views Trend */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Views Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="viewsSearch" stroke="hsl(var(--primary))" name="Search" strokeWidth={2} />
                <Line type="monotone" dataKey="viewsMaps" stroke="hsl(var(--chart-2))" name="Maps" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Actions Trend */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Actions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" name="Calls" />
                <Bar dataKey="directions" fill="hsl(var(--chart-2))" name="Directions" />
                <Bar dataKey="webClicks" fill="hsl(var(--chart-3))" name="Web Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {chartData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <Navigation className="h-7 w-7 text-primary/30" />
            </div>
            <p className="font-medium">No Maps Performance Data Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Connect Google Business Profile in the Integrations tab to start tracking local performance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
