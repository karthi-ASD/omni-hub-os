import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, Phone, Mail, Calendar, ArrowRight, Building2 } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  note: MessageSquare, call: Phone, email: Mail, meeting: Calendar,
  property_match: Building2, stage_change: ArrowRight,
};

export function ActivityFeedModule() {
  const { profile } = useAuth();

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No activity yet</p>
        <p className="text-sm mt-1">Actions across investors, properties, deals, and partners will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {activities.map((a: any) => {
        const Icon = ICON_MAP[a.activity_type] || MessageSquare;
        return (
          <Card key={a.id} className="bg-card border-border">
            <CardContent className="p-3 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{a.entity_type}</Badge>
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(a.created_at), "dd MMM yyyy, h:mm a")}
                  {a.performed_by && ` • ${a.performed_by}`}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
