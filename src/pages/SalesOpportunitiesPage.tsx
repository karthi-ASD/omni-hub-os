import { useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TrendingUp, Target, MapPin, Building2, Globe, Star } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export default function SalesOpportunitiesPage() {
  const { leads, loading: leadsLoading } = useLeads();
  const { deals, loading: dealsLoading } = useDeals();

  const loading = leadsLoading || dealsLoading;

  // High opportunity leads (stages: new, contacted, meeting_booked)
  const hotLeads = useMemo(() =>
    leads.filter((l) => ["new", "contacted", "meeting_booked"].includes(l.stage || ""))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15),
    [leads]
  );

  // Industry breakdown
  const industryData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const ind = (l as any).industry || "Unknown";
      map[ind] = (map[ind] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [leads]);

  // City breakdown
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const city = (l as any).city || (l as any).location || "Unknown";
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [leads]);

  // Active deals value
  const activeDealValue = useMemo(() =>
    deals.filter((d) => !["won", "lost"].includes(d.stage || ""))
      .reduce((sum, d) => sum + (Number(d.estimated_value) || 0), 0),
    [deals]
  );

  const wonThisMonth = useMemo(() => {
    const now = new Date();
    return deals.filter(
      (d) => d.stage === "won" && new Date(d.created_at).getMonth() === now.getMonth()
    ).length;
  }, [deals]);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Opportunities" subtitle="Identify top prospects and market insights for strategic outreach." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Leads" value={hotLeads.length} icon={Target} gradient="from-primary to-accent" loading={loading} />
        <StatCard label="Pipeline Value" value={`$${activeDealValue.toLocaleString()}`} icon={TrendingUp} gradient="from-green-500 to-emerald-600" loading={loading} />
        <StatCard label="Won This Month" value={wonThisMonth} icon={Star} gradient="from-amber-500 to-orange-600" loading={loading} />
        <StatCard label="Industries" value={industryData.length} icon={Building2} gradient="from-violet-500 to-purple-600" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Leads by Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={industryData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" className="text-xs fill-muted-foreground" width={75} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No industry data yet</p>
            )}
          </CardContent>
        </Card>

        {/* City Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" /> Leads by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={cityData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {cityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No city data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Top Prospects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hotLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active leads found</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Business</th>
                    <th className="pb-2 font-medium">Contact</th>
                    <th className="pb-2 font-medium">Stage</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {hotLeads.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 font-medium">{lead.name}</td>
                      <td className="py-2.5 text-muted-foreground">{(lead as any).contact_person || "—"}</td>
                      <td className="py-2.5">
                        <Badge variant={lead.stage === "meeting_booked" ? "default" : "secondary"} className="text-xs">
                          {lead.stage?.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{lead.source || "—"}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
