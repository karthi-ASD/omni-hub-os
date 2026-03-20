import { useState, useEffect } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useActivityIntelligence, type DaySummary, type ActivityRecord, type BehaviourRecord } from "@/hooks/useActivityIntelligence";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Trash2, CalendarDays, MapPin, Users, Activity,
  Eye, MousePointerClick, FileText, MessageSquare, Shield,
  TrendingUp, Clock, Sparkles, Filter, BarChart3, Globe,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ────── Icon map for modules/actions ────── */
const MODULE_ICON: Record<string, typeof Activity> = {
  auth: Shield, leads: TrendingUp, tickets: MessageSquare, tasks: FileText,
  crm: BarChart3, communication: MessageSquare, system: Activity, calendar: CalendarDays,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  logout: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  create: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  update: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20",
  submit: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  view: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  page_visit: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  page_leave: "bg-slate-400/10 text-slate-500 border-slate-400/20",
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find((k) => action?.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-muted text-muted-foreground border-border";
}

/* ────── Day Summary Dots ────── */
function DaySummaryDots({ summary }: { summary: DaySummary | undefined }) {
  if (!summary || summary.activities + summary.behaviours === 0) return null;
  return (
    <div className="flex gap-0.5 justify-center mt-0.5">
      {summary.activities > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
      {summary.leads > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {summary.tickets > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
      {summary.behaviours > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
    </div>
  );
}

/* ────── Activity Timeline Item ────── */
function ActivityTimelineItem({ record }: { record: ActivityRecord }) {
  const Icon = MODULE_ICON[record.module] || Activity;
  return (
    <div className="flex gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={cn("mt-0.5 p-1.5 rounded-lg shrink-0", getActionColor(record.action_type))}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{record.action_type.replace(/_/g, " ")}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{record.module}</Badge>
        </div>
        {record.description && <p className="text-xs text-muted-foreground mt-0.5">{record.description}</p>}
        {record.entity_type && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {record.entity_type} {record.entity_id ? `· ${record.entity_id.slice(0, 8)}…` : ""}
          </p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
        {format(new Date(record.created_at), "h:mm a")}
      </span>
    </div>
  );
}

/* ────── Behaviour Timeline Item ────── */
function BehaviourTimelineItem({ record }: { record: BehaviourRecord }) {
  const isVisit = record.action === "page_visit";
  return (
    <div className="flex gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={cn("mt-0.5 p-1.5 rounded-lg shrink-0", isVisit ? "bg-sky-500/10 text-sky-600" : "bg-slate-400/10 text-slate-500")}>
        {isVisit ? <Eye className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{record.page_name || "Unknown Page"}</p>
        <p className="text-[10px] text-muted-foreground">{record.page_url}</p>
        {record.time_spent > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">⏱ {record.time_spent}s spent</p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
        {format(new Date(record.created_at), "h:mm a")}
      </span>
    </div>
  );
}

/* ────── Insights Panel ────── */
function InsightsPanel({ insights }: { insights: ReturnType<ReturnType<typeof useActivityIntelligence>["getInsights"]> extends infer R ? () => R : never }) {
  const data = typeof insights === "function" ? insights() : insights;
  return (
    <div className="space-y-4">
      {/* AI Summary placeholder */}
      <Card className="rounded-xl border-0 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">AI Summary</p>
            <p className="text-xs text-muted-foreground">{data.aiSummary}</p>
          </div>
        </CardContent>
      </Card>

      {data.topModules.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Modules</p>
          <div className="space-y-1.5">
            {data.topModules.map(([mod, count]) => (
              <div key={mod} className="flex justify-between items-center text-sm">
                <span className="capitalize">{mod}</span>
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topPages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Most Visited Pages</p>
          <div className="space-y-1.5">
            {data.topPages.map(([page, count]) => (
              <div key={page} className="flex justify-between items-center text-sm">
                <span className="truncate mr-2">{page}</span>
                <Badge variant="secondary" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   MAIN COMPONENT — Activity Intelligence Calendar
   ==================================================================== */

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading: eventsLoading, createEvent, deleteEvent } = useCalendarEvents(currentMonth);
  const {
    monthlySummary, dayActivities, dayBehaviours,
    loading: summaryLoading, dayLoading,
    fetchMonthlySummary, fetchDayDetails, getInsights,
  } = useActivityIntelligence();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("activities");

  // Filters
  const [filterModule, setFilterModule] = useState("all");

  // Form state for new event
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [visibility, setVisibility] = useState("tenant");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [recurrence, setRecurrence] = useState("");

  // Fetch monthly summary when month changes
  useEffect(() => {
    fetchMonthlySummary(currentMonth);
  }, [currentMonth, fetchMonthlySummary]);

  // Fetch day details when date is selected
  const handleSelectDate = (d: Date) => {
    setSelectedDate(d);
    fetchDayDetails(d);
    setDayPanelOpen(true);
  };

  const eventsOnDay = events.filter((e) => isSameDay(new Date(e.start_datetime), selectedDate));
  const daysWithEvents = events.map((e) => new Date(e.start_datetime));

  // Build a map of YYYY-MM-DD → DaySummary
  const summaryMap: Record<string, DaySummary> = {};
  monthlySummary.forEach((s) => { summaryMap[s.date] = s; });

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const start = new Date(selectedDate);
    const [sh, sm] = startTime.split(":").map(Number);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(selectedDate);
    const [eh, em] = endTime.split(":").map(Number);
    end.setHours(eh, em, 0, 0);
    if (end <= start) { toast.error("End time must be after start time"); return; }
    const attendeeList = attendees.split(",").map((a) => a.trim()).filter(Boolean);
    const result = await createEvent({
      title, description: description || undefined,
      start_datetime: start.toISOString(), end_datetime: end.toISOString(),
      visibility, location: location || undefined,
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
      recurrence_rule: recurrence || undefined,
    });
    if (result?.error) { toast.error("Failed to create event"); } else {
      toast.success("Event created");
      setTitle(""); setDescription(""); setLocation(""); setAttendees(""); setRecurrence(""); setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const error = await deleteEvent(id);
    if (error) { toast.error("Failed to delete event"); } else { toast.success("Event deleted"); }
  };

  // Filtered activities
  const filteredActivities = filterModule === "all"
    ? dayActivities
    : dayActivities.filter((a) => a.module === filterModule);

  const uniqueModules = [...new Set(dayActivities.map((a) => a.module))];

  const selectedDaySummary = summaryMap[format(selectedDate, "yyyy-MM-dd")];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Activity Intelligence Calendar"
        subtitle="Track actions, behaviour, and events across the platform"
        icon={CalendarDays}
        actions={[{ label: "New Event", icon: Plus, onClick: () => setDialogOpen(true) }]}
      />

      {/* Summary badges */}
      {selectedDaySummary && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
            <Activity className="h-3 w-3" /> {selectedDaySummary.activities} Activities
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
            <Eye className="h-3 w-3" /> {selectedDaySummary.behaviours} Page Visits
          </Badge>
          {selectedDaySummary.leads > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 border-emerald-500/30 text-emerald-600">
              <TrendingUp className="h-3 w-3" /> {selectedDaySummary.leads} Leads
            </Badge>
          )}
          {selectedDaySummary.tickets > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 border-amber-500/30 text-amber-600">
              <MessageSquare className="h-3 w-3" /> {selectedDaySummary.tickets} Tickets
            </Badge>
          )}
          {selectedDaySummary.tasks > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
              <FileText className="h-3 w-3" /> {selectedDaySummary.tasks} Tasks
            </Badge>
          )}
          {selectedDaySummary.communications > 0 && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5">
              <MessageSquare className="h-3 w-3" /> {selectedDaySummary.communications} Comms
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-elevated">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && handleSelectDate(d)}
              onMonthChange={setCurrentMonth}
              className={cn("p-3 pointer-events-auto w-full")}
              modifiers={{ hasEvent: daysWithEvents }}
              modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold" }}
            />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 px-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" /> Activities
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Leads
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Tickets
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Page Visits
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day sidebar — events + quick summary */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {format(selectedDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scheduled events */}
            {eventsLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : eventsOnDay.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Events</p>
                {eventsOnDay.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.start_datetime), "h:mm a")} – {format(new Date(event.end_datetime), "h:mm a")}
                      </p>
                      {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {event.location}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">No scheduled events</p>
            )}

            {/* View full details button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { fetchDayDetails(selectedDate); setDayPanelOpen(true); }}
            >
              <Activity className="h-4 w-4" /> View Day Intelligence
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ────── Day Intelligence Dialog ────── */}
      <Dialog open={dayPanelOpen} onOpenChange={setDayPanelOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Intelligence — {format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="activities" className="gap-1.5 text-xs">
                <Activity className="h-3.5 w-3.5" /> Activities
              </TabsTrigger>
              <TabsTrigger value="behaviour" className="gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" /> Behaviour
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5" /> Events
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Insights
              </TabsTrigger>
            </TabsList>

            {/* Activities Tab */}
            <TabsContent value="activities" className="flex-1 min-h-0 mt-3">
              {/* Filters */}
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {uniqueModules.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {filteredActivities.length} records
                </Badge>
              </div>

              <ScrollArea className="h-[420px] pr-2">
                {dayLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No activities for this day</p>
                ) : (
                  filteredActivities.map((a) => <ActivityTimelineItem key={a.id} record={a} />)
                )}
              </ScrollArea>
            </TabsContent>

            {/* Behaviour Tab */}
            <TabsContent value="behaviour" className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-[460px] pr-2">
                {dayLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : dayBehaviours.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No behaviour data for this day</p>
                ) : (
                  dayBehaviours.map((b) => <BehaviourTimelineItem key={b.id} record={b} />)
                )}
              </ScrollArea>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-[460px] pr-2">
                {eventsOnDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No scheduled events</p>
                ) : (
                  <div className="space-y-3">
                    {eventsOnDay.map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_datetime), "h:mm a")} – {format(new Date(event.end_datetime), "h:mm a")}
                          </p>
                          {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {event.location}</p>}
                          {event.attendees && event.attendees.length > 0 && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Users className="h-3 w-3" /> {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}</p>}
                          {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-[460px] pr-2">
                <InsightsPanel insights={getInsights} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ────── Create Event Dialog ────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Event — {format(selectedDate, "MMM d, yyyy")}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
              <div><Label>End Time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
            </div>
            <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Meeting Room A, Zoom link" /></div>
            <div><Label>Attendees (comma-separated emails)</Label><Input value={attendees} onChange={(e) => setAttendees(e.target.value)} /></div>
            <div><Label>Recurrence</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger><SelectValue placeholder="No recurrence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="FREQ=DAILY">Daily</SelectItem>
                  <SelectItem value="FREQ=WEEKLY">Weekly</SelectItem>
                  <SelectItem value="FREQ=MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
