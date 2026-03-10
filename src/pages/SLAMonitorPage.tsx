import { useSLATracking } from "@/hooks/useSLATracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const SLAMonitorPage = () => {
  const { slaItems, loading } = useSLATracking();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const onTrack = slaItems.filter(s => (s.computed_status || s.status) === "on_track").length;
  const atRisk = slaItems.filter(s => (s.computed_status || s.status) === "at_risk").length;
  const breached = slaItems.filter(s => (s.computed_status || s.status) === "breached").length;
  const score = slaItems.length > 0 ? Math.round(((slaItems.length - breached) / slaItems.length) * 100) : 100;

  const statusColor = (s: string) => {
    switch (s) { case "on_track": return "default"; case "at_risk": return "secondary"; case "breached": return "destructive"; default: return "outline"; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SLA Monitoring</h1>
        <p className="text-muted-foreground">Track service level agreements across all projects and tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Shield className="h-4 w-4" /> SLA Score</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{score}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4" /> On Track</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{onTrack}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> At Risk</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{atRisk}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Breached</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{breached}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Project</TableHead><TableHead>Task</TableHead><TableHead>Department</TableHead>
            <TableHead>SLA (hrs)</TableHead><TableHead>Deadline</TableHead><TableHead>Hours Left</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {slaItems.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No SLA items tracked yet</TableCell></TableRow>
            ) : slaItems.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.client_projects?.client_name || "—"}</TableCell>
                <TableCell>{s.project_tasks?.title || "—"}</TableCell>
                <TableCell>{s.departments?.name || "—"}</TableCell>
                <TableCell>{s.sla_hours}h</TableCell>
                <TableCell>{s.deadline_at ? new Date(s.deadline_at).toLocaleString() : "—"}</TableCell>
                <TableCell>
                  <span className={s.hours_remaining < 0 ? "text-destructive font-semibold" : s.hours_remaining < 12 ? "text-yellow-600" : ""}>
                    {s.hours_remaining != null ? `${s.hours_remaining}h` : "—"}
                  </span>
                </TableCell>
                <TableCell><Badge variant={statusColor(s.computed_status || s.status)}>{(s.computed_status || s.status)?.replace(/_/g, " ")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default SLAMonitorPage;
