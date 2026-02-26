import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

const statusColor = (s: string) => {
  if (s === "healthy" || s === "completed") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (s === "degraded" || s === "processing" || s === "pending") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-destructive/10 text-destructive";
};

const SystemMonitorPage = () => {
  const { health, jobs, errors, loading, jobStats } = useSystemMonitoring();

  const statCards = [
    { label: "Pending Jobs", value: jobStats.pending, icon: Clock },
    { label: "Processing", value: jobStats.processing, icon: Activity },
    { label: "Failed Jobs", value: jobStats.failed, icon: XCircle },
    { label: "Completed", value: jobStats.completed, icon: CheckCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">System Monitor</h1>
        <p className="text-muted-foreground">Health, jobs & error tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">Service Health</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
          <TabsTrigger value="errors">Error Logs ({errors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {loading ? <Skeleton className="h-24 w-full" /> : health.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No health checks recorded yet</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead>Response Time</TableHead><TableHead>Last Checked</TableHead>
            </TableRow></TableHeader><TableBody>
              {health.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.service_name}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColor(h.status)}>{h.status}</Badge></TableCell>
                  <TableCell>{h.response_time_ms ? `${h.response_time_ms}ms` : "—"}</TableCell>
                  <TableCell>{new Date(h.last_checked).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {loading ? <Skeleton className="h-24 w-full" /> : jobs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No background jobs</CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Retries</TableHead><TableHead>Created</TableHead>
            </TableRow></TableHeader><TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.job_type}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColor(j.status)}>{j.status}</Badge></TableCell>
                  <TableCell>{j.retries}/{j.max_retries}</TableCell>
                  <TableCell>{new Date(j.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {loading ? <Skeleton className="h-24 w-full" /> : errors.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              No errors logged
            </CardContent></Card>
          ) : (
            <Card><Table><TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Message</TableHead><TableHead>Path</TableHead><TableHead>Time</TableHead>
            </TableRow></TableHeader><TableBody>
              {errors.map((e) => (
                <TableRow key={e.id}>
                  <TableCell><Badge variant="destructive">{e.error_type}</Badge></TableCell>
                  <TableCell className="max-w-[300px] truncate">{e.message}</TableCell>
                  <TableCell className="text-muted-foreground">{e.request_path || "—"}</TableCell>
                  <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitorPage;
