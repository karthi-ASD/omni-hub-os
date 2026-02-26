import { useInvestorMetrics } from "@/hooks/useInvestorMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, BarChart3, FileText, Calculator, Download } from "lucide-react";
import { useState } from "react";

const InvestorPitchPage = () => {
  const { metrics, loading } = useInvestorMetrics();
  const [narrativeType, setNarrativeType] = useState("seed");
  const [assumptions, setAssumptions] = useState({
    churnRate: 5,
    cacMonths: 3,
    cacCost: 500,
    grossMargin: 80,
    growthRate: 15,
    revenueMultiple: 10,
  });

  const impliedValuation = metrics.arr * assumptions.revenueMultiple;
  const ltv = metrics.avgRevenuePerTenant > 0 ? (metrics.avgRevenuePerTenant * 12) / (assumptions.churnRate / 100) : 0;
  const ltvCacRatio = assumptions.cacCost > 0 ? ltv / assumptions.cacCost : 0;

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["MRR", metrics.mrr],
      ["ARR", metrics.arr],
      ["Active Tenants", metrics.activeTenants],
      ["Avg Revenue/Tenant", metrics.avgRevenuePerTenant],
      ["Lead→Deal Conversion", `${metrics.conversionRate}%`],
      ["Churn Rate (assumed)", `${assumptions.churnRate}%`],
      ["LTV", Math.round(ltv)],
      ["CAC", assumptions.cacCost],
      ["LTV:CAC", ltvCacRatio.toFixed(1)],
      ["Gross Margin", `${assumptions.grossMargin}%`],
      ["Revenue Multiple", assumptions.revenueMultiple],
      ["Implied Valuation", Math.round(impliedValuation)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "investor_metrics.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investor Pitch & Valuation</h1>
          <p className="text-muted-foreground">Data-driven metrics and valuation model</p>
        </div>
        <Button onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <Tabs defaultValue="metrics">
          <TabsList>
            <TabsTrigger value="metrics">SaaS Metrics</TabsTrigger>
            <TabsTrigger value="valuation">Valuation Model</TabsTrigger>
            <TabsTrigger value="deck">Deck Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "MRR", value: `$${metrics.mrr.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
                { label: "ARR", value: `$${metrics.arr.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500" },
                { label: "Active Tenants", value: metrics.activeTenants, icon: BarChart3, color: "text-blue-500" },
                { label: "ARPA", value: `$${metrics.avgRevenuePerTenant.toLocaleString()}`, icon: DollarSign, color: "text-purple-500" },
                { label: "Conversion Rate", value: `${metrics.conversionRate}%`, icon: TrendingUp, color: "text-orange-500" },
                { label: "LTV (estimated)", value: `$${Math.round(ltv).toLocaleString()}`, icon: DollarSign, color: "text-cyan-500" },
                { label: "LTV:CAC Ratio", value: ltvCacRatio.toFixed(1), icon: BarChart3, color: "text-indigo-500" },
                { label: "Implied Valuation", value: `$${Math.round(impliedValuation).toLocaleString()}`, icon: Calculator, color: "text-amber-500" },
              ].map(c => (
                <Card key={c.label}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <c.icon className={`h-5 w-5 ${c.color}`} />
                      <div>
                        <p className="text-2xl font-bold">{c.value}</p>
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="valuation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Assumptions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Monthly Churn Rate (%)</Label><Input type="number" value={assumptions.churnRate} onChange={e => setAssumptions(a => ({ ...a, churnRate: Number(e.target.value) }))} /></div>
                  <div><Label>CAC ($)</Label><Input type="number" value={assumptions.cacCost} onChange={e => setAssumptions(a => ({ ...a, cacCost: Number(e.target.value) }))} /></div>
                  <div><Label>Gross Margin (%)</Label><Input type="number" value={assumptions.grossMargin} onChange={e => setAssumptions(a => ({ ...a, grossMargin: Number(e.target.value) }))} /></div>
                  <div><Label>Monthly Growth Rate (%)</Label><Input type="number" value={assumptions.growthRate} onChange={e => setAssumptions(a => ({ ...a, growthRate: Number(e.target.value) }))} /></div>
                  <div><Label>Revenue Multiple (x ARR)</Label><Input type="number" value={assumptions.revenueMultiple} onChange={e => setAssumptions(a => ({ ...a, revenueMultiple: Number(e.target.value) }))} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Outputs</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">ARR</span><span className="font-bold">${metrics.arr.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">LTV</span><span className="font-bold">${Math.round(ltv).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">LTV:CAC</span><span className="font-bold">{ltvCacRatio.toFixed(1)}x</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Gross Margin</span><span className="font-bold">{assumptions.grossMargin}%</span></div>
                  <div className="border-t pt-4 flex justify-between"><span className="text-lg font-semibold">Implied Valuation</span><span className="text-lg font-bold text-primary">${Math.round(impliedValuation).toLocaleString()}</span></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deck">
            <Card>
              <CardHeader><CardTitle>Pitch Deck Generator</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Narrative Type</Label>
                  <Select value={narrativeType} onValueChange={setNarrativeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seed">Seed Round</SelectItem>
                      <SelectItem value="pre_a">Pre-Series A</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <p className="font-semibold">Deck will include:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Problem & Solution slides</li>
                    <li>Product overview with screenshots</li>
                    <li>Traction: MRR ${metrics.mrr.toLocaleString()} → ARR ${metrics.arr.toLocaleString()}</li>
                    <li>Business model (subscription packages)</li>
                    <li>Go-to-market (partner network)</li>
                    <li>Financial projections & valuation</li>
                    <li>Ask & use of funds</li>
                    <li>Roadmap</li>
                  </ul>
                </div>
                <Button className="w-full" variant="outline" disabled>
                  <FileText className="mr-2 h-4 w-4" />Generate Deck (PDF export coming soon)
                </Button>
                <p className="text-xs text-muted-foreground text-center">PDF/PPTX generation requires a file generation library. Use CSV export for now.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InvestorPitchPage;
