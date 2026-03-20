import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus, Search, Building2, MapPin, DollarSign, TrendingUp, Home,
  Factory, Landmark, Lock, Eye, FileText, Link2, Bed, Bath, Car,
} from "lucide-react";

const PROPERTY_TYPES = [
  { key: "all", label: "All", icon: Building2 },
  { key: "residential", label: "Residential", icon: Home },
  { key: "commercial", label: "Commercial", icon: Landmark },
  { key: "industrial", label: "Industrial", icon: Factory },
  { key: "development", label: "Development", icon: Building2 },
  { key: "off_market", label: "Off-Market", icon: Lock },
  { key: "pre_market", label: "Pre-Market", icon: Eye },
];

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  under_offer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  settled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  off_market: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  pre_market: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  reserved: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  sold: "bg-muted text-muted-foreground border-border",
};

export function PropertyInventoryModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const bid = profile?.business_id;
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [form, setForm] = useState({
    property_name: "", property_type: "residential", category: "residential_investment",
    listing_type: "standard", developer_name: "", suburb: "", state: "", postcode: "", address: "",
    listing_price: "", estimated_yield: "", estimated_growth: "", availability: "available",
    is_off_market: false, smsf_suitable: false, min_investment: "", completion_timeline: "",
    launch_stage: "", risk_notes: "", commission_notes: "", description: "",
    bedrooms: "", bathrooms: "", parking: "", land_size_sqm: "", building_size_sqm: "",
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["crm-properties", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("business_id", bid!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid,
  });

  const filtered = useMemo(() => {
    let items = properties;
    if (typeFilter === "off_market") items = items.filter((p: any) => p.is_off_market);
    else if (typeFilter === "pre_market") items = items.filter((p: any) => p.availability === "pre_market");
    else if (typeFilter !== "all") items = items.filter((p: any) => p.property_type === typeFilter);

    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p: any) =>
        p.property_name.toLowerCase().includes(q) ||
        (p.suburb || "").toLowerCase().includes(q) ||
        (p.developer_name || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [properties, typeFilter, search]);

  const stats = useMemo(() => ({
    total: properties.length,
    available: properties.filter((p: any) => p.availability === "available").length,
    offMarket: properties.filter((p: any) => p.is_off_market).length,
    totalValue: properties.reduce((s: number, p: any) => s + (p.listing_price || 0), 0),
    avgYield: (() => {
      const withYield = properties.filter((p: any) => p.estimated_yield);
      return withYield.length ? withYield.reduce((s: number, p: any) => s + p.estimated_yield, 0) / withYield.length : 0;
    })(),
  }), [properties]);

  const handleSave = async () => {
    if (!form.property_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_properties").insert({
      business_id: bid!, property_name: form.property_name,
      property_type: form.property_type, category: form.category, listing_type: form.listing_type,
      developer_name: form.developer_name || null, suburb: form.suburb || null,
      state: form.state || null, postcode: form.postcode || null, address: form.address || null,
      listing_price: form.listing_price ? Number(form.listing_price) : null,
      estimated_yield: form.estimated_yield ? Number(form.estimated_yield) : null,
      estimated_growth: form.estimated_growth ? Number(form.estimated_growth) : null,
      availability: form.availability, is_off_market: form.is_off_market,
      smsf_suitable: form.smsf_suitable,
      min_investment: form.min_investment ? Number(form.min_investment) : null,
      completion_timeline: form.completion_timeline || null, launch_stage: form.launch_stage || null,
      risk_notes: form.risk_notes || null, commission_notes: form.commission_notes || null,
      description: form.description || null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      parking: form.parking ? Number(form.parking) : null,
      land_size_sqm: form.land_size_sqm ? Number(form.land_size_sqm) : null,
      building_size_sqm: form.building_size_sqm ? Number(form.building_size_sqm) : null,
    } as any);
    if (error) { toast.error("Failed to add property"); return; }
    toast.success("Property added");
    setShowAdd(false);
    qc.invalidateQueries({ queryKey: ["crm-properties"] });
  };

  const roiProjection = (p: any) => {
    if (!p.listing_price || !p.estimated_yield) return null;
    const annualReturn = (p.listing_price * p.estimated_yield) / 100;
    const growth5yr = p.estimated_growth ? p.listing_price * Math.pow(1 + (p.estimated_growth / 100), 5) : null;
    return { annualReturn, growth5yr };
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Properties", val: stats.total, icon: Building2, fmt: String(stats.total) },
          { label: "Available", val: stats.available, icon: MapPin, fmt: String(stats.available) },
          { label: "Off-Market", val: stats.offMarket, icon: Lock, fmt: String(stats.offMarket) },
          { label: "Portfolio Value", val: stats.totalValue, icon: DollarSign, fmt: `$${(stats.totalValue / 1e6).toFixed(1)}M` },
          { label: "Avg Yield", val: stats.avgYield, icon: TrendingUp, fmt: `${stats.avgYield.toFixed(1)}%` },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{k.fmt}</p>
                  <p className="text-[9px] text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Type filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PROPERTY_TYPES.map(t => {
          const Icon = t.icon;
          const isActive = typeFilter === t.key;
          const count = t.key === "all" ? properties.length
            : t.key === "off_market" ? properties.filter((p: any) => p.is_off_market).length
            : t.key === "pre_market" ? properties.filter((p: any) => p.availability === "pre_market").length
            : properties.filter((p: any) => p.property_type === t.key).length;
          return (
            <Button key={t.key} size="sm" variant={isActive ? "default" : "ghost"}
              onClick={() => setTypeFilter(t.key)}
              className={`text-xs gap-1.5 flex-shrink-0 ${isActive ? "" : "text-muted-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />{t.label}
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{count}</Badge>
            </Button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-lg p-0.5">
          <Button size="sm" variant={view === "cards" ? "default" : "ghost"} onClick={() => setView("cards")} className="text-xs h-7">Cards</Button>
          <Button size="sm" variant={view === "table" ? "default" : "ghost"} onClick={() => setView("table")} className="text-xs h-7">Table</Button>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5"><Plus className="h-4 w-4" />Add Property</Button>
      </div>

      {/* Cards View */}
      {view === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => {
            const roi = roiProjection(p);
            return (
              <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSelected(p)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{p.property_name}</p>
                      {p.suburb && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.suburb}{p.state ? `, ${p.state}` : ""}</p>}
                    </div>
                    <Badge className={`text-[10px] border ${STATUS_COLORS[p.availability] || ""}`}>
                      {(p.availability || "").replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{p.property_type}</Badge>
                    {p.is_off_market && <Badge variant="secondary" className="text-[10px]">Off-Market</Badge>}
                    {p.smsf_suitable && <Badge variant="secondary" className="text-[10px]">SMSF</Badge>}
                    {p.urgency_tag && <Badge variant="destructive" className="text-[10px] animate-pulse">{p.urgency_tag === "limited" ? "🔥 Limited" : p.urgency_tag === "high_demand" ? "📈 High Demand" : p.urgency_tag}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Price</span><p className="font-semibold text-foreground">{p.listing_price ? `$${Number(p.listing_price).toLocaleString()}` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Yield</span><p className="font-semibold text-foreground">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Growth</span><p className="font-semibold text-foreground">{p.estimated_growth ? `${p.estimated_growth}%` : "—"}</p></div>
                  </div>
                  {roi && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 text-xs space-y-0.5">
                      <p className="font-medium text-foreground">ROI Projection</p>
                      <p className="text-muted-foreground">Annual: <span className="text-foreground font-medium">${roi.annualReturn.toLocaleString()}</span></p>
                      {roi.growth5yr && <p className="text-muted-foreground">5yr Value: <span className="text-foreground font-medium">${Math.round(roi.growth5yr).toLocaleString()}</span></p>}
                    </div>
                  )}
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
                    {p.bathrooms && <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                    {p.parking && <span className="flex items-center gap-0.5"><Car className="h-3 w-3" />{p.parking}</span>}
                    {p.land_size_sqm && <span>{p.land_size_sqm}m²</span>}
                  </div>
                  {p.developer_name && <p className="text-[10px] text-muted-foreground">Developer: <span className="text-foreground">{p.developer_name}</span></p>}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No properties found</div>}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Property</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">Yield</TableHead>
                <TableHead className="text-xs">Growth</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Developer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelected(p)}>
                  <TableCell className="font-medium text-sm">{p.property_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{p.property_type}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.suburb || "—"}{p.state ? `, ${p.state}` : ""}</TableCell>
                  <TableCell className="font-medium text-sm">{p.listing_price ? `$${Number(p.listing_price).toLocaleString()}` : "—"}</TableCell>
                  <TableCell className="text-sm">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</TableCell>
                  <TableCell className="text-sm">{p.estimated_growth ? `${p.estimated_growth}%` : "—"}</TableCell>
                  <TableCell><Badge className={`text-[10px] border ${STATUS_COLORS[p.availability] || ""}`}>{(p.availability || "").replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.developer_name || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No properties found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Property Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">{selected.property_name}</SheetTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border ${STATUS_COLORS[selected.availability] || ""}`}>
                    {(selected.availability || "").replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{selected.property_type}</Badge>
                  {selected.is_off_market && <Badge variant="secondary" className="text-[10px]">Off-Market</Badge>}
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                  <TabsTrigger value="roi" className="text-xs">ROI</TabsTrigger>
                  <TabsTrigger value="docs" className="text-xs">Docs & Links</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-3 mt-3">
                  <Card className="bg-card border-border">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Location</p>
                      {selected.address && <p className="text-sm">{selected.address}</p>}
                      <p className="text-sm">{[selected.suburb, selected.state, selected.postcode].filter(Boolean).join(", ") || "—"}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Specifications</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Bedrooms:</span><p className="font-medium">{selected.bedrooms || "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Bathrooms:</span><p className="font-medium">{selected.bathrooms || "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Parking:</span><p className="font-medium">{selected.parking || "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Land:</span><p className="font-medium">{selected.land_size_sqm ? `${selected.land_size_sqm}m²` : "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Building:</span><p className="font-medium">{selected.building_size_sqm ? `${selected.building_size_sqm}m²` : "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Completion:</span><p className="font-medium">{selected.completion_timeline || "—"}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Financials</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Price:</span><p className="font-medium">{selected.listing_price ? `$${Number(selected.listing_price).toLocaleString()}` : "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Min Investment:</span><p className="font-medium">{selected.min_investment ? `$${Number(selected.min_investment).toLocaleString()}` : "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Yield:</span><p className="font-medium">{selected.estimated_yield ? `${selected.estimated_yield}%` : "—"}</p></div>
                        <div><span className="text-muted-foreground text-xs">Growth:</span><p className="font-medium">{selected.estimated_growth ? `${selected.estimated_growth}%` : "—"}</p></div>
                        <div className="col-span-2"><span className="text-muted-foreground text-xs">SMSF:</span><p className="font-medium">{selected.smsf_suitable ? "✓ Suitable" : "Not specified"}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                  {selected.developer_name && (
                    <Card className="bg-card border-border">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Developer</p>
                        <p className="text-sm font-medium">{selected.developer_name}</p>
                      </CardContent>
                    </Card>
                  )}
                  {selected.description && (
                    <Card className="bg-card border-border">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                        <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                      </CardContent>
                    </Card>
                  )}
                  {selected.risk_notes && (
                    <Card className="bg-card border-destructive/20">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-destructive uppercase mb-1">Risk Notes</p>
                        <p className="text-sm text-destructive/80">{selected.risk_notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="roi" className="space-y-3 mt-3">
                  {selected.listing_price && selected.estimated_yield ? (
                    <>
                      {[1, 3, 5, 10].map(yr => {
                        const annual = (selected.listing_price * selected.estimated_yield) / 100;
                        const growth = selected.estimated_growth || 0;
                        const futureVal = selected.listing_price * Math.pow(1 + growth / 100, yr);
                        const totalRent = annual * yr;
                        const totalReturn = (futureVal - selected.listing_price) + totalRent;
                        const roi = (totalReturn / selected.listing_price) * 100;
                        return (
                          <Card key={yr} className="bg-card border-border">
                            <CardContent className="p-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">{yr}-Year Projection</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div><span className="text-muted-foreground text-xs">Property Value:</span><p className="font-medium">${Math.round(futureVal).toLocaleString()}</p></div>
                                <div><span className="text-muted-foreground text-xs">Total Rental Income:</span><p className="font-medium">${Math.round(totalRent).toLocaleString()}</p></div>
                                <div><span className="text-muted-foreground text-xs">Capital Growth:</span><p className="font-medium text-emerald-500">+${Math.round(futureVal - selected.listing_price).toLocaleString()}</p></div>
                                <div><span className="text-muted-foreground text-xs">Total ROI:</span><p className="font-bold text-primary">{roi.toFixed(1)}%</p></div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-center py-8 text-sm text-muted-foreground">Add price and yield to see ROI projections</p>
                  )}
                </TabsContent>

                <TabsContent value="docs" className="space-y-3 mt-3">
                  {selected.documents_json ? (
                    <div className="space-y-2">
                      {(Array.isArray(selected.documents_json) ? selected.documents_json : []).map((doc: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name || `Document ${i + 1}`}</p>
                          </div>
                          {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer"><Link2 className="h-4 w-4 text-primary" /></a>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-sm text-muted-foreground">No documents attached</p>
                  )}
                  {selected.commission_notes && (
                    <Card className="bg-card border-border">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Commission Notes</p>
                        <p className="text-sm">{selected.commission_notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Property Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Property Name *</Label><Input value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Availability</Label>
                <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="under_offer">Under Offer</SelectItem>
                    <SelectItem value="off_market">Off Market</SelectItem>
                    <SelectItem value="pre_market">Pre Market</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label className="text-xs">Suburb</Label><Input value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} /></div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} /></div>
              <div><Label className="text-xs">Price ($)</Label><Input type="number" value={form.listing_price} onChange={e => setForm(f => ({ ...f, listing_price: e.target.value }))} /></div>
              <div><Label className="text-xs">Yield (%)</Label><Input type="number" step="0.1" value={form.estimated_yield} onChange={e => setForm(f => ({ ...f, estimated_yield: e.target.value }))} /></div>
              <div><Label className="text-xs">Growth (%)</Label><Input type="number" step="0.1" value={form.estimated_growth} onChange={e => setForm(f => ({ ...f, estimated_growth: e.target.value }))} /></div>
              <div><Label className="text-xs">Developer</Label><Input value={form.developer_name} onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} /></div>
              <div><Label className="text-xs">Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} /></div>
              <div><Label className="text-xs">Parking</Label><Input type="number" value={form.parking} onChange={e => setForm(f => ({ ...f, parking: e.target.value }))} /></div>
              <div><Label className="text-xs">Land (m²)</Label><Input type="number" value={form.land_size_sqm} onChange={e => setForm(f => ({ ...f, land_size_sqm: e.target.value }))} /></div>
              <div><Label className="text-xs">Min Investment</Label><Input type="number" value={form.min_investment} onChange={e => setForm(f => ({ ...f, min_investment: e.target.value }))} /></div>
              <div><Label className="text-xs">Completion</Label><Input value={form.completion_timeline} onChange={e => setForm(f => ({ ...f, completion_timeline: e.target.value }))} placeholder="e.g. Q4 2027" /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_off_market} onCheckedChange={v => setForm(f => ({ ...f, is_off_market: v }))} /><Label className="text-xs">Off-Market</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.smsf_suitable} onCheckedChange={v => setForm(f => ({ ...f, smsf_suitable: v }))} /><Label className="text-xs">SMSF Suitable</Label></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div><Label className="text-xs">Risk Notes</Label><Input value={form.risk_notes} onChange={e => setForm(f => ({ ...f, risk_notes: e.target.value }))} /></div>
            <Button onClick={handleSave} className="w-full">Add Property</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
