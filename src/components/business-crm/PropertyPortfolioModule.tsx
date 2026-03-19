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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Building2, MapPin, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string;
  property_name: string;
  property_type: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  listing_price: number | null;
  estimated_yield: number | null;
  estimated_growth: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  land_size_sqm: number | null;
  availability: string;
  is_off_market: boolean;
  developer_name: string | null;
  description: string | null;
  created_at: string;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500 border-green-500/30",
  under_offer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  settled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  off_market: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  pre_market: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
};

export function PropertyPortfolioModule() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({
    property_name: "", property_type: "residential", address: "", suburb: "",
    state: "", postcode: "", listing_price: "", estimated_yield: "",
    estimated_growth: "", bedrooms: "", bathrooms: "", parking: "",
    land_size_sqm: "", availability: "available", is_off_market: false,
    developer_name: "", description: "",
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["crm-properties", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_properties")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false });
      return (data || []) as Property[];
    },
    enabled: !!profile?.business_id,
  });

  const filtered = properties.filter(p => {
    if (filterType !== "all" && p.property_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.property_name.toLowerCase().includes(q) ||
        (p.suburb || "").toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.property_name.trim()) { toast.error("Property name is required"); return; }
    const { error } = await supabase.from("crm_properties").insert({
      business_id: profile!.business_id!,
      property_name: form.property_name,
      property_type: form.property_type,
      address: form.address || null,
      suburb: form.suburb || null,
      state: form.state || null,
      postcode: form.postcode || null,
      listing_price: form.listing_price ? Number(form.listing_price) : null,
      estimated_yield: form.estimated_yield ? Number(form.estimated_yield) : null,
      estimated_growth: form.estimated_growth ? Number(form.estimated_growth) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      parking: form.parking ? Number(form.parking) : null,
      land_size_sqm: form.land_size_sqm ? Number(form.land_size_sqm) : null,
      availability: form.availability,
      is_off_market: form.is_off_market,
      developer_name: form.developer_name || null,
      description: form.description || null,
    } as any);
    if (error) { toast.error("Failed to add property"); return; }
    toast.success("Property added");
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["crm-properties"] });
  };

  const formatPrice = (v: number | null) => v != null ? `$${v.toLocaleString()}` : "—";

  // Stats
  const totalValue = properties.reduce((s, p) => s + (p.listing_price || 0), 0);
  const avgYield = properties.filter(p => p.estimated_yield).reduce((s, p, _, a) => s + (p.estimated_yield || 0) / a.length, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{properties.length}</p><p className="text-xs text-muted-foreground">Properties</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">${(totalValue / 1000000).toFixed(1)}M</p><p className="text-xs text-muted-foreground">Portfolio Value</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{avgYield.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Avg Yield</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search properties..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="land">Land</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Property</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{p.property_name}</p>
                  {p.suburb && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.suburb}{p.state ? `, ${p.state}` : ""}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{p.property_type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${AVAILABILITY_COLORS[p.availability] || ""}`}>{p.availability.replace("_", " ")}</Badge>
                {p.is_off_market && <Badge variant="secondary" className="text-[10px]">Off-Market</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Price:</span> <span className="font-medium text-foreground">{formatPrice(p.listing_price)}</span></div>
                <div><span className="text-muted-foreground">Yield:</span> <span className="font-medium text-foreground">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</span></div>
                {p.bedrooms && <div><span className="text-muted-foreground">Beds:</span> {p.bedrooms}</div>}
                {p.land_size_sqm && <div><span className="text-muted-foreground">Land:</span> {p.land_size_sqm}m²</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No properties found</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Property</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Property Name *</Label><Input value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Availability</Label>
                <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="under_offer">Under Offer</SelectItem>
                    <SelectItem value="off_market">Off Market</SelectItem>
                    <SelectItem value="pre_market">Pre Market</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label className="text-xs">Suburb</Label><Input value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} /></div>
              <div><Label className="text-xs">State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))} /></div>
              <div><Label className="text-xs">Listing Price ($)</Label><Input type="number" value={form.listing_price} onChange={e => setForm(f => ({ ...f, listing_price: e.target.value }))} /></div>
              <div><Label className="text-xs">Est. Yield (%)</Label><Input type="number" step="0.1" value={form.estimated_yield} onChange={e => setForm(f => ({ ...f, estimated_yield: e.target.value }))} /></div>
              <div><Label className="text-xs">Est. Growth (%)</Label><Input type="number" step="0.1" value={form.estimated_growth} onChange={e => setForm(f => ({ ...f, estimated_growth: e.target.value }))} /></div>
              <div><Label className="text-xs">Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} /></div>
              <div><Label className="text-xs">Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} /></div>
              <div><Label className="text-xs">Parking</Label><Input type="number" value={form.parking} onChange={e => setForm(f => ({ ...f, parking: e.target.value }))} /></div>
              <div><Label className="text-xs">Land (m²)</Label><Input type="number" value={form.land_size_sqm} onChange={e => setForm(f => ({ ...f, land_size_sqm: e.target.value }))} /></div>
              <div><Label className="text-xs">Developer</Label><Input value={form.developer_name} onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <Button onClick={handleSave} className="w-full">Add Property</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
