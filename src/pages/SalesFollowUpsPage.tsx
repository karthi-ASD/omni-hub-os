import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFollowUps, FollowUp } from "@/hooks/useFollowUps";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  CalendarCheck, Phone, Mail, MessageSquare, Users, AlertTriangle,
  CheckCircle, Clock, SkipForward, ExternalLink, FileText, RefreshCw,
} from "lucide-react";
import {
  format, isToday, isTomorrow, isPast, parseISO, startOfDay,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { ScheduleFollowUpDialog } from "@/components/followups/ScheduleFollowUpDialog";
import { forceRefreshSalesData } from "@/lib/salesDataSync";

const TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
  other: FileText,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

type FilterTab = "today" | "tomorrow" | "this_week" | "this_month" | "overdue" | "upcoming";

const SalesFollowUpsPage = () => {
  const navigate = useNavigate();
  const { followUps, loading, markCompleted, markSkipped, reschedule } = useFollowUps();
  const [tab, setTab] = useState<FilterTab>("today");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  // Only show pending follow-ups in main filters
  const pending = useMemo(() => followUps.filter(f => f.status === "pending"), [followUps]);

  const now = new Date();

  const filtered = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return {
      today: pending.filter(f => isToday(parseISO(f.followup_date))),
      tomorrow: pending.filter(f => isTomorrow(parseISO(f.followup_date))),
      this_week: pending.filter(f => {
        const d = parseISO(f.followup_date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }),
      this_month: pending.filter(f => {
        const d = parseISO(f.followup_date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      }),
      overdue: pending.filter(f => {
        const d = parseISO(f.followup_date);
        return isPast(startOfDay(d)) && !isToday(d);
      }),
      upcoming: pending.filter(f => {
        const d = parseISO(f.followup_date);
        return !isPast(d) && !isToday(d);
      }),
    };
  }, [pending, now]);

  const displayItems = filtered[tab] || [];

  const handleReschedule = (id: string) => {
    if (rescheduleId === id && rescheduleDate) {
      reschedule(id, rescheduleDate);
      setRescheduleId(null);
      setRescheduleDate("");
    } else {
      setRescheduleId(id);
    }
  };

  const renderList = (items: FollowUp[]) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            No follow-ups in this category
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item) => {
          const followUpDate = parseISO(item.followup_date);
          const isOverdue = isPast(startOfDay(followUpDate)) && !isToday(followUpDate);
          const Icon = TYPE_ICONS[item.followup_type || "call"] || Phone;
          const priorityClass = PRIORITY_COLORS[item.priority || "medium"] || PRIORITY_COLORS.medium;

          return (
            <Card
              key={item.id}
              className={`rounded-2xl border-0 shadow-elevated transition-all ${isOverdue ? "border-l-4 border-l-destructive" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {isOverdue ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">
                        {item.lead_name || item.subject || "Follow-up"}
                      </p>
                      {item.priority && (
                        <Badge variant="outline" className={`text-[10px] ${priorityClass}`}>
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                    {item.lead_business_name && (
                      <p className="text-xs text-muted-foreground">{item.lead_business_name}</p>
                    )}
                    {item.subject && item.lead_name && (
                      <p className="text-xs text-muted-foreground">{item.subject}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                    )}
                    {item.lead_phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">📞 {item.lead_phone}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        By: {item.creator_name}
                      </span>
                      {item.followup_time && (
                        <span className="text-[10px] text-muted-foreground">
                          at {item.followup_time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date + Actions */}
                  <div className="text-right shrink-0 space-y-2">
                    <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
                      {format(followUpDate, "dd MMM yyyy")}
                    </Badge>

                    <div className="flex gap-1 justify-end flex-wrap">
                      {item.lead_phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Call"
                          onClick={() => window.open(`tel:${item.lead_phone}`, "_self")}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[hsl(var(--success))]"
                        title="Mark Completed"
                        onClick={() => markCompleted(item.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Reschedule"
                        onClick={() => handleReschedule(item.id)}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Skip"
                        onClick={() => markSkipped(item.id)}
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                      </Button>
                      {item.lead_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Open Lead"
                          onClick={() => navigate(`/leads?highlight=${item.lead_id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Inline reschedule */}
                    {rescheduleId === item.id && (
                      <div className="flex gap-1 items-center mt-1">
                        <Input
                          type="date"
                          className="h-7 text-xs w-32"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          disabled={!rescheduleDate}
                          onClick={() => handleReschedule(item.id)}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Follow-Ups"
        subtitle={`${filtered.today.length} today · ${filtered.overdue.length} overdue`}
        icon={CalendarCheck}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => forceRefreshSalesData()}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <ScheduleFollowUpDialog />
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="today">Today ({filtered.today.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({filtered.tomorrow.length})</TabsTrigger>
          <TabsTrigger value="this_week">This Week ({filtered.this_week.length})</TabsTrigger>
          <TabsTrigger value="this_month">This Month ({filtered.this_month.length})</TabsTrigger>
          <TabsTrigger
            value="overdue"
            className={filtered.overdue.length > 0 ? "text-destructive" : ""}
          >
            Overdue ({filtered.overdue.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">All Upcoming ({filtered.upcoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {renderList(displayItems)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesFollowUpsPage;
