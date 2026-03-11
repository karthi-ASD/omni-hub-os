import { useState } from "react";
import { useCalendarEvents, CalendarEvent } from "@/hooks/useCalendarEvents";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CalendarDays, MapPin, Users } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, createEvent, deleteEvent } = useCalendarEvents(currentMonth);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [visibility, setVisibility] = useState("tenant");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [recurrence, setRecurrence] = useState("");

  const eventsOnDay = events.filter((e) => isSameDay(new Date(e.start_datetime), selectedDate));
  const daysWithEvents = events.map((e) => new Date(e.start_datetime));

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Calendar"
        subtitle="Manage events and schedules"
        icon={CalendarDays}
        actions={[{ label: "New Event", icon: Plus, onClick: () => setDialogOpen(true) }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-elevated">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              onMonthChange={setCurrentMonth}
              className={cn("p-3 pointer-events-auto w-full")}
              modifiers={{ hasEvent: daysWithEvents }}
              modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold" }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {format(selectedDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : eventsOnDay.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events this day</p>
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
                      {event.recurrence_rule && <p className="text-[10px] text-primary mt-0.5">↻ Recurring</p>}
                      {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Event Dialog */}
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
