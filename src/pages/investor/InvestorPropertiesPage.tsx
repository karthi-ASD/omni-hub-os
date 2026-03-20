import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, TrendingUp, DollarSign, Bed, Bath, Car } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  under_offer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  settled: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  reserved: "bg-pink-500/10 text-pink-500 border-pink-500/30",
};

export default function InvestorPropertiesPage() {
  usePageTitle("My Properties", "Properties linked to your investments");
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: clientLink } = useQuery({
    queryKey: ["investor-client-link", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("client_users")
        .select("client_id").eq("user_id", profile!.user_id).eq("is_primary", true).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const clientId = clientLink?.client_id;

  const { data: deals = [] } = useQuery({
    queryKey: ["investor-deal-properties", bid, clientId],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("id, deal_name, deal_stage, property_id, deal_value")
        .eq("business_id", bid!).eq("client_id", clientId!);
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  const propertyIds = deals.filter(d => d.property_id).map(d => d.property_id);

  const { data: properties = [] } = useQuery({
    queryKey: ["investor-props", propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      const { data } = await supabase.from("crm_properties").select("*").in("id", propertyIds);
      return data || [];
    },
    enabled: propertyIds.length > 0,
  });

  const totalValue = properties.reduce((s: number, p: any) => s + (p.listing_price || 0), 0);
  const avgYield = (() => {
    const withY = properties.filter((p: any) => p.estimated_yield);
    return withY.length ? withY.reduce((s: number, p: any) => s + p.estimated_yield, 0) / withY.length : 0;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Properties</h1>
          <p className="text-xs text-muted-foreground">{properties.length} properties linked to your investments</p>
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-primary">{properties.length}</p>
            <p className="text-[10px] text-muted-foreground">Properties</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-foreground">${(totalValue / 1e6).toFixed(1)}M</p>
            <p className="text-[10px] text-muted-foreground">Portfolio Value</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-emerald-500">{avgYield.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Yield</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Cards */}
      <div className="space-y-4">
        {properties.map((p: any) => {
          const deal = deals.find(d => d.property_id === p.id);
          const annualReturn = p.listing_price && p.estimated_yield ? (p.listing_price * p.estimated_yield / 100) : null;
          const growth5yr = p.listing_price && p.estimated_growth ? p.listing_price * Math.pow(1 + p.estimated_growth / 100, 5) : null;

          return (
            <Card key={p.id} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{p.property_name}</h3>
                    {p.suburb && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{p.suburb}{p.state ? `, ${p.state}` : ""}
                      </p>
                    )}
                  </div>
                  <Badge className={`text-[10px] border ${STATUS_COLORS[p.availability] || ""}`}>
                    {(p.availability || "").replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{p.property_type}</Badge>
                  {p.smsf_suitable && <Badge variant="secondary" className="text-[10px]">SMSF</Badge>}
                  {deal && <Badge variant="secondary" className="text-[10px]">Deal: {deal.deal_name}</Badge>}
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><span className="text-[10px] text-muted-foreground">Price</span><p className="font-semibold">{p.listing_price ? `$${Number(p.listing_price).toLocaleString()}` : "—"}</p></div>
                  <div><span className="text-[10px] text-muted-foreground">Yield</span><p className="font-semibold">{p.estimated_yield ? `${p.estimated_yield}%` : "—"}</p></div>
                  <div><span className="text-[10px] text-muted-foreground">Growth</span><p className="font-semibold">{p.estimated_growth ? `${p.estimated_growth}%` : "—"}</p></div>
                </div>

                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{p.bedrooms}</span>}
                  {p.bathrooms && <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                  {p.parking && <span className="flex items-center gap-0.5"><Car className="h-3 w-3" />{p.parking}</span>}
                  {p.land_size_sqm && <span>{p.land_size_sqm}m²</span>}
                </div>

                {annualReturn && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" /> ROI Projection
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-[10px] text-muted-foreground">Annual Rental</span><p className="font-semibold">${Math.round(annualReturn).toLocaleString()}</p></div>
                      {growth5yr && <div><span className="text-[10px] text-muted-foreground">5yr Value</span><p className="font-semibold">${Math.round(growth5yr).toLocaleString()}</p></div>}
                    </div>
                  </div>
                )}

                {p.developer_name && <p className="text-[10px] text-muted-foreground">Developer: <span className="text-foreground font-medium">{p.developer_name}</span></p>}
              </CardContent>
            </Card>
          );
        })}
        {properties.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No properties linked yet</p>
            <p className="text-xs">Properties will appear here once matched to your deals</p>
          </div>
        )}
      </div>
    </div>
  );
}
