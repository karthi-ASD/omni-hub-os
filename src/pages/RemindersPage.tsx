import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, Timer, X, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  done: Check,
  snoozed: Timer,
  overdue: AlertTriangle,
  cancelled: X,
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-destructive/10 text-destructive",
};

const RemindersPage = () => {
  const { reminders, loading, markDone, snooze, cancel } = useReminders();
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const [tab, setTab] = useState("pending");

  const filtered = reminders.filter(r => {
    if (tab === "overdue") return r.status === "pending" && isPast(new Date(r.due_at));
    if (tab === "all") return true;
    return r.status === tab;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="h-6 w-6" /> Reminders</h1>
        <p className="text-muted-foreground">Stay on top of follow-ups</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          {(isSuperAdmin || isBusinessAdmin) && <TabsTrigger value="all">All</TabsTrigger>}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No reminders</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => {
                const Icon = statusIcons[isPast(new Date(r.due_at)) && r.status === "pending" ? "overdue" : r.status] || Clock;
                const isOverdue = isPast(new Date(r.due_at)) && r.status === "pending";
                return (
                  <Card key={r.id} className={isOverdue ? "border-destructive/50" : ""}>
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      <Icon className={`h-5 w-5 shrink-0 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(r.due_at), "MMM d, yyyy HH:mm")}
                          {" · "}{r.entity_type} 
                        </p>
                      </div>
                      <Badge className={priorityColors[r.priority] || ""}>{r.priority}</Badge>
                      {r.status === "pending" && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => markDone(r.id)} title="Done"><Check className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => snooze(r.id, 30)} title="Snooze 30m"><Timer className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => cancel(r.id)} title="Cancel"><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RemindersPage;
