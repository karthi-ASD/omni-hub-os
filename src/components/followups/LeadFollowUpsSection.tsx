import { useMemo } from "react";
import { useFollowUps, FollowUp } from "@/hooks/useFollowUps";
import { ScheduleFollowUpDialog } from "./ScheduleFollowUpDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, CalendarCheck } from "lucide-react";
import { format, parseISO, isPast, isToday, startOfDay } from "date-fns";

interface Props {
  leadId: string;
  leadName?: string;
}

export function LeadFollowUpsSection({ leadId, leadName }: Props) {
  const { followUps, markCompleted } = useFollowUps();

  const leadFollowUps = useMemo(
    () => followUps.filter((f) => f.lead_id === leadId),
    [followUps, leadId]
  );

  const upcoming = leadFollowUps.filter(
    (f) => f.status === "pending"
  );
  const past = leadFollowUps.filter(
    (f) => f.status !== "pending"
  );

  const renderItem = (item: FollowUp) => {
    const d = parseISO(item.followup_date);
    const isOverdue =
      item.status === "pending" && isPast(startOfDay(d)) && !isToday(d);

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 p-2.5 rounded-lg border ${
          isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border"
        }`}
      >
        <CalendarCheck
          className={`h-4 w-4 shrink-0 ${
            isOverdue ? "text-destructive" : "text-primary"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {item.subject || "Follow-up"}
          </p>
          {item.notes && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {item.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={isOverdue ? "destructive" : "outline"}
            className="text-[10px]"
          >
            {format(d, "dd MMM")}
          </Badge>
          {item.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[hsl(var(--success))]"
              title="Mark Completed"
              onClick={() => markCompleted(item.id)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          {item.status === "completed" && (
            <Badge
              variant="outline"
              className="text-[10px] text-[hsl(var(--success))]"
            >
              Done
            </Badge>
          )}
          {item.status === "skipped" && (
            <Badge variant="outline" className="text-[10px]">
              Skipped
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Follow-Ups
        </h3>
        <ScheduleFollowUpDialog
          leadId={leadId}
          leadName={leadName}
          triggerLabel="+ Schedule"
          triggerVariant="outline"
          triggerSize="sm"
        />
      </div>

      {upcoming.length === 0 && past.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No follow-ups scheduled
        </p>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Upcoming ({upcoming.length})
          </p>
          {upcoming.map(renderItem)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              History ({past.length})
            </p>
            {past.slice(0, 5).map(renderItem)}
          </div>
        </>
      )}
    </div>
  );
}
