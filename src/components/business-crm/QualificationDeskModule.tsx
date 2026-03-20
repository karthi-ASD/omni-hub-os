import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Filter, CheckCircle, XCircle, Clock } from "lucide-react";

export function QualificationDeskModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: leads = [] } = useQuery({
    queryKey: ["qual-desk-leads", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("*").eq("business_id", bid!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid,
  });

  const newLeads = leads.filter((l: any) => l.stage === "new");
  const qualified = leads.filter((l: any) => l.stage === "qualified");
  const disqualified = leads.filter((l: any) => l.stage === "disqualified");
  const contacted = leads.filter((l: any) => l.stage === "contacted");

  const stats = [
    { label: "New / Unqualified", value: newLeads.length, icon: Clock, color: "text-muted-foreground" },
    { label: "Contacted", value: contacted.length, icon: Filter, color: "text-primary" },
    { label: "Qualified", value: qualified.length, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Disqualified", value: disqualified.length, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Qualification Desk</h2>
        <p className="text-xs text-muted-foreground">Qualify, score, and route incoming leads</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
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
        <CardHeader className="pb-2"><CardTitle className="text-sm">Leads Pending Qualification</CardTitle></CardHeader>
        <CardContent>
          {newLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">All leads have been qualified</p>
          ) : (
            <div className="space-y-2">
              {newLeads.slice(0, 10).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{l.email || l.phone || "No contact"} • {l.source || "Unknown source"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{l.priority || "normal"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
