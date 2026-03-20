import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export function TicketingSupportModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: tickets = [] } = useQuery({
    queryKey: ["crm-tickets", bid],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").eq("business_id", bid!).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!bid,
  });

  const open = tickets.filter((t: any) => !["resolved", "closed"].includes(t.status));
  const resolved = tickets.filter((t: any) => t.status === "resolved");
  const escalated = tickets.filter((t: any) => t.status === "escalated");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Ticketing & Support</h2>
        <p className="text-xs text-muted-foreground">Manage investor queries and internal support requests</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open Tickets", value: open.length, icon: Inbox, color: "text-primary" },
          { label: "Escalated", value: escalated.length, icon: AlertTriangle, color: "text-destructive" },
          { label: "Resolved", value: resolved.length, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Total", value: tickets.length, icon: Clock, color: "text-muted-foreground" },
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
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Tickets</CardTitle></CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No open tickets</p>
          ) : (
            <div className="space-y-2">
              {open.slice(0, 10).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.subject || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{t.ticket_number || "–"} • {t.priority || "normal"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
