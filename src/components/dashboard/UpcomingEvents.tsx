import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export function UpcomingEvents() {
  const { events, loading } = useCalendarEvents();

  const upcoming = events
    .filter((e) => new Date(e.start_datetime) >= new Date())
    .slice(0, 5);

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-success/20 to-neon-green/20 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-success" />
          </div>
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 py-2.5 px-2.5 rounded-lg hover:bg-muted/40 transition-all duration-200 group"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0 group-hover:from-primary/25 group-hover:to-accent/25 transition-all">
                  <span className="text-xs font-extrabold text-primary">
                    {format(new Date(event.start_datetime), "dd")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(event.start_datetime), "MMM d · h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
