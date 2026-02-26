import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Server, Zap } from "lucide-react";

const ObservabilityPage = () => {
  const { health, healthChecks, jobs, errors, jobStats, loading } = useSystemMonitoring();

  const okChecks = healthChecks.filter(c => c.status === "OK").length;
  const degradedChecks = healthChecks.filter(c => c.status === "DEGRADED").length;
  const downChecks = healthChecks.filter(c => c.status === "DOWN").length;
  const avgLatency = healthChecks.length ? Math.round(healthChecks.reduce((s, c) => s + (c.latency_ms || 0), 0) / healthChecks.length) : 0;
  const errorRate = errors.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold">Observability Dashboard</h1><p className="text-muted-foreground">System health, jobs, errors & performance metrics</p></div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 flex items-center gap-4"><CheckCircle className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Services OK</p><p className="text-2xl font-bold">{okChecks}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">Degraded</p><p className="text-2xl font-bold">{degradedChecks}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Zap className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Avg Latency</p><p className="text-2xl font-bold">{avgLatency}ms</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Recent Errors</p><p className="text-2xl font-bold">{errorRate}</p></div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Jobs Pending</p><p className="text-xl font-bold">{jobStats.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Processing</p><p className="text-xl font-bold">{jobStats.processing}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Failed</p><p className="text-xl font-bold text-destructive">{jobStats.failed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Completed</p><p className="text-xl font-bold text-accent">{jobStats.completed}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Service Health Checks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? <div className="flex justify-center py-4"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
              healthChecks.length === 0 ? <p className="text-sm text-muted-foreground">No health checks recorded.</p> :
              healthChecks.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.service_name}</span>
                  <div className="flex items-center gap-2">
                    {c.latency_ms && <span className="text-muted-foreground">{c.latency_ms}ms</span>}
                    <Badge variant={c.status === "OK" ? "default" : c.status === "DEGRADED" ? "secondary" : "destructive"}>{c.status}</Badge>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Recent Errors</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {errors.length === 0 ? <p className="text-sm text-muted-foreground">No recent errors.</p> :
              errors.slice(0, 10).map(e => (
                <div key={e.id} className="text-sm border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{e.error_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs mt-1 truncate">{e.message}</p>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObservabilityPage;
