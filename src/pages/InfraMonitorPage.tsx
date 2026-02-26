import { useInfraMonitoring } from "@/hooks/useInfraMonitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Shield, Rocket, Activity } from "lucide-react";

const InfraMonitorPage = () => {
  const { nodes, uptimeChecks, deployments, securityLogs, loading } = useInfraMonitoring();

  const statusVariant = (s: string) => s === "healthy" || s === "up" || s === "success" ? "default" : s === "degraded" ? "secondary" : "destructive";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Infrastructure & Compliance</h1>
        <p className="text-muted-foreground">Multi-region nodes, uptime, deployments, and security audit</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><Server className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{nodes.length}</p><p className="text-xs text-muted-foreground">Infra Nodes</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">{uptimeChecks.filter(u => u.status === "up").length}/{uptimeChecks.length}</p><p className="text-xs text-muted-foreground">Services Up</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><Rocket className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{deployments.length}</p><p className="text-xs text-muted-foreground">Deployments</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">{securityLogs.filter(s => s.risk_level === "high" || s.risk_level === "critical").length}</p><p className="text-xs text-muted-foreground">High-Risk Events</p></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="nodes">
            <TabsList>
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="uptime">Uptime</TabsTrigger>
              <TabsTrigger value="deployments">Deployments</TabsTrigger>
              <TabsTrigger value="security">Security Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="nodes">
              <Card><Table>
                <TableHeader><TableRow><TableHead>Region</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Latency</TableHead><TableHead>Last Sync</TableHead></TableRow></TableHeader>
                <TableBody>
                  {nodes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.region}</TableCell>
                      <TableCell className="capitalize">{n.role}</TableCell>
                      <TableCell><Badge variant={statusVariant(n.status) as any}>{n.status}</Badge></TableCell>
                      <TableCell>{n.latency_ms}ms</TableCell>
                      <TableCell>{new Date(n.last_sync).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {nodes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No nodes configured</TableCell></TableRow>}
                </TableBody>
              </Table></Card>
            </TabsContent>

            <TabsContent value="uptime">
              <Card><Table>
                <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Endpoint</TableHead><TableHead>Status</TableHead><TableHead>Response Time</TableHead><TableHead>Checked</TableHead></TableRow></TableHeader>
                <TableBody>
                  {uptimeChecks.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.service_name}</TableCell>
                      <TableCell className="font-mono text-xs">{u.endpoint}</TableCell>
                      <TableCell><Badge variant={statusVariant(u.status) as any}>{u.status}</Badge></TableCell>
                      <TableCell>{u.response_time_ms}ms</TableCell>
                      <TableCell>{new Date(u.checked_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {uptimeChecks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No uptime checks</TableCell></TableRow>}
                </TableBody>
              </Table></Card>
            </TabsContent>

            <TabsContent value="deployments">
              <Card><Table>
                <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Environment</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead><TableHead>Deployed</TableHead></TableRow></TableHeader>
                <TableBody>
                  {deployments.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-medium">{d.version}</TableCell>
                      <TableCell className="capitalize">{d.environment}</TableCell>
                      <TableCell><Badge variant={statusVariant(d.status) as any}>{d.status}</Badge></TableCell>
                      <TableCell>{d.notes || "—"}</TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {deployments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No deployments</TableCell></TableRow>}
                </TableBody>
              </Table></Card>
            </TabsContent>

            <TabsContent value="security">
              <Card><Table>
                <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Risk</TableHead><TableHead>IP</TableHead><TableHead>User Agent</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                <TableBody>
                  {securityLogs.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.action}</TableCell>
                      <TableCell><Badge variant={s.risk_level === "critical" || s.risk_level === "high" ? "destructive" : s.risk_level === "medium" ? "secondary" : "outline"}>{s.risk_level}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{s.ip_address || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{s.user_agent || "—"}</TableCell>
                      <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {securityLogs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No security events</TableCell></TableRow>}
                </TableBody>
              </Table></Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default InfraMonitorPage;
