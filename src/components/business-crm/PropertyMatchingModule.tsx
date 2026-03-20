import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MapPinned, Building2, DollarSign } from "lucide-react";

export function PropertyMatchingModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: properties = [] } = useQuery({
    queryKey: ["prop-match", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("business_id", bid!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid,
  });

  const available = properties.filter((p: any) => p.availability === "available");
  const reserved = properties.filter((p: any) => p.availability === "reserved");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Property Matching</h2>
        <p className="text-xs text-muted-foreground">Match investors with suitable properties based on their profile</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
            <div><p className="text-lg font-bold text-foreground">{properties.length}</p><p className="text-[10px] text-muted-foreground">Total Properties</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10"><MapPinned className="h-4 w-4 text-emerald-500" /></div>
            <div><p className="text-lg font-bold text-foreground">{available.length}</p><p className="text-[10px] text-muted-foreground">Available</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10"><DollarSign className="h-4 w-4 text-amber-500" /></div>
            <div><p className="text-lg font-bold text-foreground">{reserved.length}</p><p className="text-[10px] text-muted-foreground">Reserved</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Available Properties</CardTitle></CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No available properties in inventory</p>
          ) : (
            <div className="space-y-2">
              {available.slice(0, 10).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.property_name || p.address || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{p.property_type || "Property"} • {p.suburb || p.city || "Unknown location"}</p>
                  </div>
                  <div className="text-right">
                    {p.price && <p className="text-sm font-semibold text-foreground">${Number(p.price).toLocaleString()}</p>}
                    <Badge variant="outline" className="text-[10px]">{p.availability}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
