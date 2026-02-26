import { useUsageAnalytics } from "@/hooks/useUsageAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const UsageAnalyticsPage = () => {
  const { sessions, events, loading } = useUsageAnalytics();

  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground">Portal & mobile usage tracking (opt-in)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.round(avgDuration / 60)} min</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Events</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions"><Activity className="h-4 w-4 mr-1" /> Sessions</TabsTrigger>
          <TabsTrigger value="events"><MousePointerClick className="h-4 w-4 mr-1" /> Events</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>App</TableHead><TableHead>Started</TableHead><TableHead>Duration</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No sessions</TableCell></TableRow>
                ) : sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><Badge variant="outline" className="capitalize">{s.app_type}</Badge></TableCell>
                    <TableCell>{format(new Date(s.started_at), "dd MMM HH:mm")}</TableCell>
                    <TableCell>{s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : "Active"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="events">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : events.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No events</TableCell></TableRow>
                ) : events.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.event_type}</TableCell>
                    <TableCell>{format(new Date(e.created_at), "dd MMM HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsageAnalyticsPage;
