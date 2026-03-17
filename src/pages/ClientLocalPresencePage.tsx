import { useAuth } from "@/contexts/AuthContext";
import { useGoogleMapsStats } from "@/hooks/useGoogleMapsStats";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import {
  MapPin, Eye, Phone, Navigation, MousePointerClick, Star,
  TrendingUp, TrendingDown, Lightbulb, Clock, RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { NarrativeSummary } from "@/components/shared/NarrativeSummary";

const ClientLocalPresencePage = () => {
  const { clientId } = useAuth();
  usePageTitle("Local Presence");
  const { aggregated, syncStatus, loading } = useGoogleMapsStats({ clientId: clientId || undefined });

  const {
    totalViews, viewsSearch, viewsMaps, totalCalls, totalDirections, totalWebClicks,
    viewsGrowth, latestRating, latestReviews, chartData,
    prevCalls, prevDirections, prevWebClicks,
  } = aggregated;

  const callsGrowth = prevCalls > 0 ? ((totalCalls - prevCalls) / prevCalls) * 100 : 0;
  const directionsGrowth = prevDirections > 0 ? ((totalDirections - prevDirections) / prevDirections) * 100 : 0;
  const clicksGrowth = prevWebClicks > 0 ? ((totalWebClicks - prevWebClicks) / prevWebClicks) * 100 : 0;

  // Smart insights
  const insights = useMemo(() => {
    const msgs: { text: string; positive: boolean }[] = [];
    if (viewsGrowth > 5) msgs.push({ text: `Your business visibility grew by ${viewsGrowth.toFixed(0)}% — more customers are finding you on Google.`, positive: true });
    else if (viewsGrowth < -5) msgs.push({ text: `Visibility decreased by ${Math.abs(viewsGrowth).toFixed(0)}%. Let's work on improving your local rankings.`, positive: false });
    if (callsGrowth > 0) msgs.push({ text: `Call activity increased — customers are reaching out more.`, positive: true });
    if (directionsGrowth > 0) msgs.push({ text: `More people are requesting directions to your business.`, positive: true });
    if (latestRating >= 4.5) msgs.push({ text: `Your ${latestRating.toFixed(1)}★ rating is excellent — this builds strong trust with new customers.`, positive: true });
    else if (latestRating > 0 && latestRating < 4) msgs.push({ text: `Your rating could improve. Encouraging satisfied customers to leave reviews helps.`, positive: false });
    if (viewsMaps > viewsSearch) msgs.push({ text: `Most of your views come from Google Maps — your map listing is working well.`, positive: true });
    if (msgs.length === 0) msgs.push({ text: `Your local presence data is being collected. Insights will appear as more data arrives.`, positive: true });
    return msgs;
  }, [viewsGrowth, callsGrowth, directionsGrowth, latestRating, viewsMaps, viewsSearch]);

  // Visibility source pie
  const visibilityPie = [
    { name: "Search", value: viewsSearch, color: "hsl(var(--primary))" },
    { name: "Maps", value: viewsMaps, color: "hsl(var(--chart-2))" },
  ].filter(d => d.value > 0);

  const GrowthBadge = ({ pct }: { pct: number }) => (
    <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pct >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
      {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-48 w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Narrative Summary ─── */}
      {hasData && (
        <NarrativeSummary
          type="maps"
          metrics={{
            totalViews,
            viewsGrowth,
            totalCalls,
            totalDirections,
            latestRating,
            latestReviews,
          }}
        />
      )}

      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Your Local Presence</h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            How customers find and interact with your business on Google Maps & Search
          </p>

          {syncStatus && (
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {syncStatus.last_sync_at ? timeSince(syncStatus.last_sync_at) : "—"}</span>
              <Badge variant="outline" className="text-xs">{syncStatus.sync_status}</Badge>
            </div>
          )}
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* ─── KPI Cards ─── */}
      {hasData ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-5 w-5 text-primary/60" />
                <GrowthBadge pct={viewsGrowth} />
              </div>
              <p className="text-3xl font-bold"><AnimatedCounter end={totalViews} /></p>
              <p className="text-xs text-muted-foreground mt-1">Total Views (30 days)</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Phone className="h-5 w-5 text-primary/60" />
                <GrowthBadge pct={callsGrowth} />
              </div>
              <p className="text-3xl font-bold"><AnimatedCounter end={totalCalls} /></p>
              <p className="text-xs text-muted-foreground mt-1">Calls Received</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Navigation className="h-5 w-5 text-primary/60" />
                <GrowthBadge pct={directionsGrowth} />
              </div>
              <p className="text-3xl font-bold"><AnimatedCounter end={totalDirections} /></p>
              <p className="text-xs text-muted-foreground mt-1">Direction Requests</p>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <MousePointerClick className="h-5 w-5 text-primary/60" />
                <GrowthBadge pct={clicksGrowth} />
              </div>
              <p className="text-3xl font-bold"><AnimatedCounter end={totalWebClicks} /></p>
              <p className="text-xs text-muted-foreground mt-1">Website Clicks</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ─── Visibility Growth ─── */}
      {hasData && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Visibility Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="viewsSearch" stroke="hsl(var(--primary))" fill="url(#gViews)" name="Search Views" strokeWidth={2} />
                  <Area type="monotone" dataKey="viewsMaps" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} name="Maps Views" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visibility Sources Pie */}
          <Card>
            <CardHeader><CardTitle className="text-base">Where They Find You</CardTitle></CardHeader>
            <CardContent>
              {visibilityPie.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={visibilityPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                        {visibilityPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-xs mt-2">
                    {visibilityPie.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}: {d.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No visibility data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Customer Actions ─── */}
      {hasData && (
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Actions Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" name="Calls" radius={[2, 2, 0, 0]} />
                <Bar dataKey="directions" fill="hsl(var(--chart-2))" name="Directions" radius={[2, 2, 0, 0]} />
                <Bar dataKey="webClicks" fill="hsl(var(--chart-3))" name="Website Clicks" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ─── Reviews & Rating ─── */}
      {hasData && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-primary/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-medium">Average Rating</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">{latestRating.toFixed(1)}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(latestRating) ? "text-primary fill-primary" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{latestReviews} total reviews</p>
            </CardContent>
          </Card>

          {chartData.some(d => d.rating > 0) && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Rating Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData.filter(d => d.rating > 0)}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Smart Insights ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${ins.positive ? "bg-primary" : "bg-destructive"}`} />
                <p className="text-sm">{ins.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Empty State ─── */}
      {!hasData && (
        <Card className="border-2 border-dashed border-primary/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-5">
              <MapPin className="h-9 w-9 text-primary/30" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Local Presence Data is Being Prepared</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Once connected, you'll see how customers discover and interact with your business on Google Maps and Search. Check back after the first sync completes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function timeSince(date: string) {
  const hrs = Math.round((Date.now() - new Date(date).getTime()) / 3600000);
  if (hrs < 1) return "less than 1 hour ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default ClientLocalPresencePage;
