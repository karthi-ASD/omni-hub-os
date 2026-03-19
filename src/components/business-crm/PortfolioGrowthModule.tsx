import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building2, DollarSign, TrendingUp, Award, Repeat } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function PortfolioGrowthModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: investors = [] } = useQuery({
    queryKey: ["crm-investors-portfolio", bid],
    queryFn: async () => { const { data } = await supabase.from("crm_investors").select("*").eq("business_id", bid!); return data || []; },
    enabled: !!bid,
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals-portfolio", bid],
    queryFn: async () => { const { data } = await supabase.from("crm_deals").select("*").eq("business_id", bid!); return data || []; },
    enabled: !!bid,
  });

  const settledDeals = deals.filter((d: any) => d.deal_stage === "settled");
  const totalSettledValue = settledDeals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const totalProperties = investors.reduce((s: number, i: any) => s + (i.current_property_count || 0), 0);
  const repeatInvestors = investors.filter((i: any) => (i.current_property_count || 0) > 1);
  const avgProperties = investors.length > 0 ? totalProperties / investors.length : 0;

  // Tier distribution
  const tierData = ["platinum", "gold", "silver", "standard"].map(tier => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: investors.filter((i: any) => i.investor_tier === tier).length,
  }));

  // Top investors by property count
  const topInvestors = [...investors].sort((a: any, b: any) => (b.current_property_count || 0) - (a.current_property_count || 0)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Investors", val: investors.length, icon: Users },
          { label: "Properties Held", val: totalProperties, icon: Building2 },
          { label: "Settled Value", val: `$${(totalSettledValue / 1e6).toFixed(1)}M`, icon: DollarSign },
          { label: "Repeat Investors", val: repeatInvestors.length, icon: Repeat },
          { label: "Avg Properties", val: avgProperties.toFixed(1), icon: TrendingUp },
          { label: "Settled Deals", val: settledDeals.length, icon: Award },
        ].map(k => (
          <Card key={k.label} className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><k.icon className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{k.val}</p><p className="text-[10px] text-muted-foreground">{k.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Investor Tier Distribution</CardTitle></CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Repeat Investor Leaderboard</CardTitle></CardHeader>
          <CardContent className="max-h-[200px] overflow-y-auto">
            {topInvestors.length > 0 ? (
              <div className="space-y-2">
                {topInvestors.map((i: any, idx: number) => (
                  <div key={i.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                    <div className="flex-1"><p className="text-sm font-medium text-foreground">{i.full_name}</p></div>
                    <Badge variant="outline" className="text-[10px]">{i.current_property_count || 0} properties</Badge>
                    <Badge className={`text-[10px] ${i.investor_tier === "platinum" ? "bg-purple-500/10 text-purple-400" : i.investor_tier === "gold" ? "bg-amber-500/10 text-amber-400" : ""}`}>{i.investor_tier}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-6">No investor data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Overview Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Portfolio Segmentation</CardTitle></CardHeader>
        <Table><TableHeader><TableRow><TableHead>Segment</TableHead><TableHead>Investors</TableHead><TableHead>Properties</TableHead><TableHead>Avg Budget</TableHead></TableRow></TableHeader><TableBody>
          {["conservative", "moderate", "aggressive"].map(risk => {
            const seg = investors.filter((i: any) => i.risk_profile === risk);
            const props = seg.reduce((s: number, i: any) => s + (i.current_property_count || 0), 0);
            const avgBudget = seg.length > 0 ? seg.reduce((s: number, i: any) => s + (i.budget_max || 0), 0) / seg.length : 0;
            return (
              <TableRow key={risk}>
                <TableCell className="capitalize font-medium">{risk}</TableCell>
                <TableCell>{seg.length}</TableCell>
                <TableCell>{props}</TableCell>
                <TableCell>${(avgBudget / 1000).toFixed(0)}K</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table>
      </Card>
    </div>
  );
}
