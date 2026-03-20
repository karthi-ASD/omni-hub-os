import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Clock, CheckCircle, Phone, Mail } from "lucide-react";

export default function InvestorEnquiriesPage() {
  usePageTitle("My Enquiries", "Your investment enquiries and communications");
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

  // Get leads/enquiries linked to this client
  const { data: leads = [] } = useQuery({
    queryKey: ["investor-enquiries", bid, clientId],
    queryFn: async () => {
      const { data } = await (supabase.from("crm_leads") as any).select("*")
        .eq("business_id", bid!).eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  // Also get timeline events
  const { data: timeline = [] } = useQuery({
    queryKey: ["investor-timeline", bid, clientId],
    queryFn: async () => {
      const { data } = await supabase.from("account_timeline").select("*")
        .eq("business_id", bid!).eq("client_id", clientId!)
        .order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    contacted: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    qualified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    lost: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Enquiries</h1>
          <p className="text-xs text-muted-foreground">Your investment enquiries and activity timeline</p>
        </div>
      </div>

      {/* Enquiries */}
      {leads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Enquiries ({leads.length})</h2>
          <div className="space-y-3">
            {leads.map((lead: any) => (
              <Card key={lead.id} className="rounded-xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{lead.name || "Enquiry"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lead.source ? `Source: ${lead.source}` : ""} • {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={`text-[10px] border ${statusColors[lead.stage] || ""}`}>
                      {lead.stage}
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                    {lead.investment_budget && <span>Budget: ${Number(lead.investment_budget).toLocaleString()}</span>}
                    {lead.preferred_location && <span>Location: {lead.preferred_location}</span>}
                    {lead.investment_type && <span>Type: {lead.investment_type}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Activity Timeline</h2>
        {timeline.length > 0 ? (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            {timeline.map((event: any) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <Card className="rounded-xl border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{event.event_title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {event.event_description && <p className="text-xs text-muted-foreground mt-0.5">{event.event_description}</p>}
                    {event.module_name && <Badge variant="outline" className="text-[9px] mt-1">{event.module_name}</Badge>}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs">Your investment journey timeline will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
