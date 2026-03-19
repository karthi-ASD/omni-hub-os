import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#D4A574", "#C4956A", "#B8860B", "#DAA520", "#CD853F", "#8B7355", "#A0926B", "#6B8E23", "#228B22", "#808080"];

export function ReportsModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: leads = [] } = useQuery({ queryKey: ["rpt-leads", bid], queryFn: async () => { const { data } = await supabase.from("crm_leads").select("*").eq("business_id", bid!); return data || []; }, enabled: !!bid });
  const { data: investors = [] } = useQuery({ queryKey: ["rpt-investors", bid], queryFn: async () => { const { data } = await supabase.from("crm_investors").select("*").eq("business_id", bid!); return data || []; }, enabled: !!bid });
  const { data: deals = [] } = useQuery({ queryKey: ["rpt-deals", bid], queryFn: async () => { const { data } = await supabase.from("crm_deals").select("*").eq("business_id", bid!); return data || []; }, enabled: !!bid });

  // Leads by source
  const sourceMap: Record<string, number> = {};
  leads.forEach((l: any) => { sourceMap[l.source || "Unknown"] = (sourceMap[l.source || "Unknown"] || 0) + 1; });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  // Lead stage distribution
  const stageMap: Record<string, number> = {};
  leads.forEach((l: any) => { stageMap[l.stage || "new"] = (stageMap[l.stage || "new"] || 0) + 1; });
  const stageData = Object.entries(stageMap).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Deal pipeline value
  const dealStageVal: Record<string, number> = {};
  deals.forEach((d: any) => { dealStageVal[d.deal_stage || "unknown"] = (dealStageVal[d.deal_stage || "unknown"] || 0) + (d.deal_value || 0); });
  const dealData = Object.entries(dealStageVal).map(([name, value]) => ({ name: name.replace(/_/g, " "), value: Math.round(value / 1000) }));

  // Investor type mix
  const typeMap: Record<string, number> = {};
  investors.forEach((i: any) => { typeMap[i.investor_type || "individual"] = (typeMap[i.investor_type || "individual"] || 0) + 1; });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  // Conversion rates
  const totalLeads = leads.length || 1;
  const qualifiedRate = ((leads.filter((l: any) => ["qualified", "converted"].includes(l.stage)).length / totalLeads) * 100).toFixed(1);
  const convertedRate = ((leads.filter((l: any) => l.stage === "converted").length / totalLeads) * 100).toFixed(1);
  const settledRate = deals.length > 0 ? ((deals.filter((d: any) => d.deal_stage === "settled").length / deals.length) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Conversion KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Qualification Rate", val: `${qualifiedRate}%` },
          { label: "Conversion Rate", val: `${convertedRate}%` },
          { label: "Deal Close Rate", val: `${settledRate}%` },
          { label: "Repeat Rate", val: `${investors.length > 0 ? ((investors.filter((i: any) => (i.current_property_count || 0) > 1).length / investors.length) * 100).toFixed(1) : 0}%` },
        ].map(k => (
          <Card key={k.label} className="bg-card border-border"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{k.val}</p><p className="text-xs text-muted-foreground mt-1">{k.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads by Source</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {sourceData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={sourceData}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Stage Distribution</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {stageData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>{stageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline Value by Stage ($K)</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {dealData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={dealData} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Investor Type Mix</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {typeData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>{typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
