import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

export function AccountsCommissionsModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: deals = [] } = useQuery({
    queryKey: ["acc-comm-deals", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid,
  });

  const settled = deals.filter((d: any) => d.deal_stage === "settled");
  const totalValue = settled.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const commissionsDue = settled.filter((d: any) => !d.commission_paid);
  const depositsPending = deals.filter((d: any) => d.deposit_status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Accounts & Commissions</h2>
        <p className="text-xs text-muted-foreground">Track payments, deposits, and commission settlements</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Settled Deals", value: settled.length, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Total Revenue", value: `$${(totalValue / 1e6).toFixed(2)}M`, icon: TrendingUp, color: "text-primary" },
          { label: "Commissions Due", value: commissionsDue.length, icon: DollarSign, color: "text-amber-500" },
          { label: "Deposits Pending", value: depositsPending.length, icon: Clock, color: "text-muted-foreground" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className={`h-4 w-4 ${s.color}`} /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Commissions Pending Payment</CardTitle></CardHeader>
        <CardContent>
          {commissionsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">All commissions settled</p>
          ) : (
            <div className="space-y-2">
              {commissionsDue.slice(0, 10).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.deal_name || "Deal"}</p>
                    <p className="text-xs text-muted-foreground">Settled • Value: ${Number(d.deal_value || 0).toLocaleString()}</p>
                  </div>
                  <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">Unpaid</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
