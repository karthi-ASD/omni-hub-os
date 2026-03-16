import { useClientActivityLog } from "@/hooks/useClientActivityLog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, Mail, MessageSquare, FileText, DollarSign, CreditCard,
  UserCheck, Ticket, Clock, Globe, Zap, CalendarCheck,
} from "lucide-react";
import { format } from "date-fns";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  lead_created: Zap,
  note_added: FileText,
  conversion_requested: UserCheck,
  conversion_approved: UserCheck,
  xero_contact_synced: Globe,
  invoice_created: FileText,
  payment_received: CreditCard,
  follow_up: CalendarCheck,
  support_ticket: Ticket,
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Clock,
  DEFAULT: Zap,
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead_created: "bg-primary/10 text-primary",
  note_added: "bg-accent/10 text-accent",
  conversion_requested: "bg-warning/10 text-warning",
  conversion_approved: "bg-green-500/10 text-green-600",
  xero_contact_synced: "bg-blue-500/10 text-blue-600",
  invoice_created: "bg-violet-500/10 text-violet-600",
  payment_received: "bg-green-500/10 text-green-600",
  follow_up: "bg-amber-500/10 text-amber-600",
  support_ticket: "bg-orange-500/10 text-orange-600",
  DEFAULT: "bg-muted text-muted-foreground",
};

interface ClientActivityTimelineProps {
  clientId: string | undefined;
}

export function ClientActivityTimeline({ clientId }: ClientActivityTimelineProps) {
  const { activities, loading } = useClientActivityLog(clientId);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No activity logged for this client yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-3">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
      {activities.map(act => {
        const Icon = ACTIVITY_ICONS[act.activity_type] || ACTIVITY_ICONS.DEFAULT;
        const colorClass = ACTIVITY_COLORS[act.activity_type] || ACTIVITY_COLORS.DEFAULT;
        return (
          <div key={act.id} className="relative">
            <div className="absolute -left-[18px] top-1.5 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <Icon className="h-2.5 w-2.5 text-primary" />
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className={`text-[10px] capitalize ${colorClass}`}>
                  {act.activity_type.replace(/_/g, " ")}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(act.created_at), "dd MMM yyyy, HH:mm")}
                </span>
                {act.activity_source !== "manual" && (
                  <Badge variant="secondary" className="text-[9px]">{act.activity_source}</Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">{act.created_by_name}</span>
              </div>
              {act.description && <p className="text-xs text-foreground/80">{act.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
