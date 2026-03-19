import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Building2, MapPin, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "residential_investment", label: "Residential Investment" },
  { value: "commercial_investment", label: "Commercial Investment" },
  { value: "industrial", label: "Industrial Opportunity" },
  { value: "off_market", label: "Off-Market" },
  { value: "pre_market", label: "Pre-Market" },
  { value: "development", label: "Development Investment" },
  { value: "smsf_suitable", label: "SMSF-Suitable" },
];

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500 border-green-500/30",
  under_offer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  settled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  off_market: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  pre_market: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
};

export function OpportunitiesModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const [form, setForm] = useState({
    property_name: "", category: "residential_investment", property_type: "residential",
    listing_type: "standard", developer_name: "", suburb: "", state: "", postcode: "",
    listing_price: "", estimated_yield: "", estimated_growth: "", availability: "available",
    is_off_market: false, smsf_suitable: false, min_investment: "", completion_timeline: "",
    launch_stage: "", risk_notes: "", commission_notes: "", description: "",
    bedrooms: "", bathrooms: "", parking: "", land_size_sqm: "",
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["crm-properties", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false });
      return data || [];
    }, enabled: !!profile?.business_id,
  });

  const filtered = properties.filter((p: any) => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search) { const q = search.toLowerCase(); return p.property_name.toLowerCase().includes(q) || (p.suburb || "").toLowerCase().includes(q); }
    return true;
  });

  const handleSave = async () => {
    if (!form.property_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_properties").insert({
      business_id: profile!.business_id!, property_name: form.property_name,
      category: form.category, property_type: form.property_type, listing_type: form.listing_type,
      developer_name: form.developer_name || null, suburb: form.suburb || null, state: form.state || null,
      postcode: form.postcode || null, listing_price: form.listing_price ? Number(form.listing_price) : null,
      estimated_yield: form.estimated_yield ? Number(form.estimated_yield) : null,
      estimated_growth: form.estimated_growth ? Number(form.estimated_growth) : null,
      availability: form.availability, is_off_market: form.is_off_market, smsf_suitable: form.smsf_suitable,
      min_investment: form.min_investment ? Number(form.min_investment) : null,
      completion_timeline: form.completion_timeline || null, launch_stage: form.launch_stage || null,
      risk_notes: form.risk_notes || null, commission_notes: form.commission_notes || null,
      description: form.description || null, bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null, parking: form.parking ? Number(form.parking) : null,
      land_size_sqm: form.land_size_sqm ? Number(form.land_size_sqm) : null,
    } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Opportunity added"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-properties"] });
  };

  const totalValue = properties.reduce((s: number, p: any) => s + (p.listing_price || 0), 0);
  const avgYield = properties.filter((p: any) => p.estimated_yield).length > 0
    ? properties.filter((p: any) => p.estimated_yield).reduce((s: number, p: any) => s + p.estimated_yield, 0) / properties.filter((p: any) => p.estimated_yield).length : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{properties.length}</p><p className="text-[10px] text-muted-foreground">Total Opportunities</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">${(totalValue / 1e6).toFixed(1)}M</p><p className="text-[10px] text-muted-foreground">Total Value</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{avgYield.toFixed(1)}%</p><p className="text-[10px] text-muted-foreground">Avg Yield</p></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2.5"><div className="p-2 rounded-lg bg-primary/10"><MapPin className="h-4 w-4 text-primary" /></div><div><p className="text-lg font-bold text-foreground">{properties.filter((p: any) => p.is_off_market).length}</p><p className="text-[10px] text-muted-foreground">Off-Market</p></div></CardContent></Card>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat("all")}>All</Badge>
        {CATEGORIES.map(c => <Badge key={c.value} variant={filterCat === c.value ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat(c.value)}>{c.label}</Badge>)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "cards" ? "default" : "ghost"} onClick={() => setView("cards")} className="text-xs h-7">Cards</Button>
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Opportunity</Button>
      </div>

      {view === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div><p className="font-semibold text-sm text-foreground">{p.property_name}</p>
                    {p.suburb && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.suburb}{p.state ? `, ${p.state}` : ""}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.value === p.category)?.label || p.category}</Badge>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Badge className={`text-[10px] ${STATUS_COLORS[p.availability] || ""}`}>{(p.availability || "").replace("_", " ")}</Badge>
                  {p.is_off_market && <Badge variant="secondary" className="text-[10px]">Off-Market</Badge>}
                  {p.smsf_suitable && <Badge variant="secondary" className="text-[10px]">SMSF</Badge>}
                  {p.urgency_tag && <Badge variant="destructive" className="text-[10px] animate-pulse">{p.urgency_tag === "limited" ? "🔥 Limited" : p.urgency_tag === "high_demand" ? "📈 High Demand" : p.urgency_tag === "eoi_closing" ? "⏰ EOI Closing" : p.urgency_tag}</Badge>}
                  {p.demand_level === "high" && !p.urgency_tag && <Badge variant="secondary" className="text-[10px]">High Demand</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div><span className="text-muted-foreground">Price:</span> <span className="font-medium text-foreground">{p.listing_price ? `$${p.listing_price.toLocaleString()}` : "—"}</span></div>
                  <div><span className="text-muted-foreground">Yield:</span> <span className="font-medium text-foreground">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</span></div>
                  {p.developer_name && <div className="col-span-2"><span className="text-muted-foreground">Developer:</span> {p.developer_name}</div>}
                </div>
                {p.urgency_deadline && (
                  <p className="text-[10px] text-destructive font-medium">Deadline: {new Date(p.urgency_deadline).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No opportunities found</div>}
        </div>
      )}

      {view === "table" && (
        <Card className="bg-card border-border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3 text-xs font-medium text-muted-foreground">Name</th><th className="p-3 text-xs font-medium text-muted-foreground">Category</th><th className="p-3 text-xs font-medium text-muted-foreground">Location</th><th className="p-3 text-xs font-medium text-muted-foreground">Price</th><th className="p-3 text-xs font-medium text-muted-foreground">Yield</th><th className="p-3 text-xs font-medium text-muted-foreground">Status</th></tr></thead><tbody>
          {filtered.map((p: any) => (
            <tr key={p.id} className="border-b border-border/50"><td className="p-3 font-medium">{p.property_name}</td><td className="p-3"><Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.value === p.category)?.label || p.category}</Badge></td><td className="p-3 text-muted-foreground">{p.suburb || "—"}{p.state ? `, ${p.state}` : ""}</td><td className="p-3">{p.listing_price ? `$${p.listing_price.toLocaleString()}` : "—"}</td><td className="p-3">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</td><td className="p-3"><Badge className={`text-[10px] ${STATUS_COLORS[p.availability] || ""}`}>{(p.availability || "").replace("_", " ")}</Badge></td></tr>
          ))}
        </tbody></table></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Title *</Label><Input value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Availability</Label><Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="under_offer">Under Offer</SelectItem><SelectItem value="off_market">Off Market</SelectItem><SelectItem value="pre_market">Pre Market</SelectItem><SelectItem value="settled">Settled</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Suburb</Label><Input value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} /></div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">Price ($)</Label><Input type="number" value={form.listing_price} onChange={e => setForm(f => ({ ...f, listing_price: e.target.value }))} /></div>
              <div><Label className="text-xs">Yield (%)</Label><Input type="number" step="0.1" value={form.estimated_yield} onChange={e => setForm(f => ({ ...f, estimated_yield: e.target.value }))} /></div>
              <div><Label className="text-xs">Growth (%)</Label><Input type="number" step="0.1" value={form.estimated_growth} onChange={e => setForm(f => ({ ...f, estimated_growth: e.target.value }))} /></div>
              <div><Label className="text-xs">Developer</Label><Input value={form.developer_name} onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Min Investment</Label><Input type="number" value={form.min_investment} onChange={e => setForm(f => ({ ...f, min_investment: e.target.value }))} /></div>
              <div><Label className="text-xs">Completion</Label><Input value={form.completion_timeline} onChange={e => setForm(f => ({ ...f, completion_timeline: e.target.value }))} placeholder="e.g. Q4 2027" /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_off_market} onCheckedChange={v => setForm(f => ({ ...f, is_off_market: v }))} /><Label className="text-xs">Off-Market</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.smsf_suitable} onCheckedChange={v => setForm(f => ({ ...f, smsf_suitable: v }))} /><Label className="text-xs">SMSF Suitable</Label></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <Button onClick={handleSave} className="w-full">Add Opportunity</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
