import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  UserPlus, Phone, CalendarClock, Building2, FileText,
  DollarSign, Scale, FileCheck, Home, RefreshCw, MessageSquare,
} from "lucide-react";

const STAGE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  lead_created: { icon: UserPlus, color: "bg-blue-500", label: "Lead Created" },
  first_contact: { icon: Phone, color: "bg-green-500", label: "First Contact" },
  followup: { icon: CalendarClock, color: "bg-amber-500", label: "Follow-up" },
  opportunity_shared: { icon: Building2, color: "bg-purple-500", label: "Opportunity Shared" },
  eoi_submitted: { icon: FileText, color: "bg-cyan-500", label: "EOI Submitted" },
  deposit: { icon: DollarSign, color: "bg-emerald-500", label: "Deposit Event" },
  finance_update: { icon: Scale, color: "bg-orange-500", label: "Finance Update" },
  contract: { icon: FileCheck, color: "bg-indigo-500", label: "Contract Stage" },
  settlement: { icon: Home, color: "bg-pink-500", label: "Settlement" },
  repeat_investment: { icon: RefreshCw, color: "bg-primary", label: "Repeat Investment" },
  communication: { icon: MessageSquare, color: "bg-zinc-500", label: "Communication" },
};

interface Props {
  investorId: string;
}

export function InvestorJourneyTimeline({ investorId }: Props) {
  const { profile } = useAuth();

  // Build timeline from communications + tasks + deals
  const { data: comms = [] } = useQuery({
    queryKey: ["investor-comms", investorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_communications")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .eq("linked_type", "investor")
        .eq("linked_id", investorId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!profile?.business_id && !!investorId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["investor-tasks", investorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .eq("linked_investor_id", investorId)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!profile?.business_id && !!investorId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["investor-deals", investorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_deals")
        .select("*")
        .eq("business_id", profile!.business_id!)
        .eq("investor_id", investorId)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.business_id && !!investorId,
  });

  // Merge into unified timeline
  const timeline = [
    ...comms.map((c: any) => ({
      type: c.channel === "note" ? "followup" : "communication",
      title: c.subject || `${c.channel} communication`,
      description: c.summary,
      date: c.created_at,
      meta: c.performed_by,
    })),
    ...tasks.map((t: any) => ({
      type: t.task_type?.includes("finance") ? "finance_update" : t.task_type?.includes("deposit") ? "deposit" : "followup",
      title: t.title,
      description: t.notes,
      date: t.created_at,
      meta: t.owner,
    })),
    ...deals.map((d: any) => ({
      type: d.deal_stage === "settlement" ? "settlement" : d.deal_stage === "contract" ? "contract" : d.eoi_status === "submitted" ? "eoi_submitted" : "opportunity_shared",
      title: d.deal_name,
      description: `Stage: ${d.deal_stage} • Value: $${(d.deal_value || 0).toLocaleString()}`,
      date: d.created_at,
      meta: d.next_action_owner,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timeline.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-xs">No journey events yet</div>;
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {timeline.map((event, idx) => {
        const config = STAGE_CONFIG[event.type] || STAGE_CONFIG.communication;
        const Icon = config.icon;

        return (
          <div key={idx} className="relative flex items-start gap-3 py-2.5">
            {/* Dot */}
            <div className={`absolute left-[-13px] w-[22px] h-[22px] rounded-full ${config.color} flex items-center justify-center shrink-0 ring-2 ring-background`}>
              <Icon className="h-3 w-3 text-white" />
            </div>

            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-medium text-foreground">{event.title}</p>
                <Badge variant="outline" className="text-[9px]">{config.label}</Badge>
              </div>
              {event.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(event.date), "dd MMM yyyy, h:mm a")}
                </span>
                {event.meta && <span className="text-[10px] text-muted-foreground">• {event.meta}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
