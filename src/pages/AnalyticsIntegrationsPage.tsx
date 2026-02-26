import { useAnalyticsConnections } from "@/hooks/useAnalyticsConnections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Link2, Plus, TrendingUp, Search, MapPin } from "lucide-react";

const PROVIDERS = [
  { key: "GA4", label: "Google Analytics 4", icon: TrendingUp },
  { key: "GSC", label: "Google Search Console", icon: Search },
  { key: "GBP", label: "Google Business Profile", icon: MapPin },
  { key: "GOOGLE_ADS", label: "Google Ads", icon: TrendingUp },
];

const AnalyticsIntegrationsPage = () => {
  const { connections, metrics, loading, addConnection } = useAnalyticsConnections();

  if (loading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const chartData = metrics.slice(0, 30).reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    sessions: m.sessions,
    clicks: m.gsc_clicks,
    impressions: m.gsc_impressions,
    leads: m.leads_count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics Integrations</h1>
        <p className="text-muted-foreground">Connect GA4, GSC, GBP and view daily metrics</p>
      </div>

      {/* Connections */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Connections</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {PROVIDERS.map(p => {
              const conn = connections.find(c => c.provider === p.key);
              return (
                <div key={p.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{p.label}</span>
                  </div>
                  {conn ? (
                    <Badge variant={conn.status === "active" ? "default" : "secondary"}>{conn.status}</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => addConnection(p.key)}>
                      <Plus className="h-3 w-3 mr-1" /> Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Note: OAuth credentials must be configured in Settings → Integrations to activate connections.</p>
        </CardContent>
      </Card>

      {/* Metrics Charts */}
      <Tabs defaultValue="traffic">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="search">Search Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card>
            <CardHeader><CardTitle className="text-base">Sessions & Leads (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sessions" />
                    <Bar dataKey="leads" fill="hsl(var(--chart-2))" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No metrics data yet. Connect GA4 and data will populate daily.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader><CardTitle className="text-base">GSC Clicks & Impressions</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" name="Clicks" />
                    <Line type="monotone" dataKey="impressions" stroke="hsl(var(--chart-3))" name="Impressions" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No search data yet. Connect GSC to see performance.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsIntegrationsPage;
