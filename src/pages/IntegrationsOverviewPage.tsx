import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plug, Search, CheckCircle2, AlertTriangle, XCircle, Clock,
  RefreshCw, ExternalLink, BarChart3, MapPin, ArrowRight,
  AlertCircle, Wifi, WifiOff, Activity,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectIntegrationRow {
  projectId: string;
  projectName: string;
  clientName: string;
  domain: string;
  ga4: ConnectionInfo | null;
  gbp: ConnectionInfo | null;
}

interface ConnectionInfo {
  id: string;
  status: string;
  is_active: boolean;
  last_error: string | null;
}

interface SyncInfo {
  project_id: string;
  source: string;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  active: {
    label: "Live Data Flowing",
    icon: <Wifi className="h-3.5 w-3.5" />,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  error: {
    label: "Needs Attention",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  disconnected: {
    label: "Disconnected",
    icon: <WifiOff className="h-3.5 w-3.5" />,
    className: "bg-muted text-muted-foreground border-border",
  },
  none: {
    label: "Not Connected",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-muted text-muted-foreground border-border",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.none;
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function timeSince(date: string) {
  const hrs = Math.round((Date.now() - new Date(date).getTime()) / 3600000);
  if (hrs < 1) return "< 1h ago";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const IntegrationsOverviewPage = () => {
  usePageTitle("Integrations Overview");
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProjectIntegrationRow[]>([]);
  const [syncs, setSyncs] = useState<SyncInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [projRes, connRes, syncRes] = await Promise.all([
      (supabase as any).from("seo_projects").select("id, project_name, website_domain, client_id, clients(contact_name)").eq("project_status", "active"),
      (supabase as any).from("analytics_connections").select("id, project_id, provider, status, is_active, last_error"),
      (supabase as any).from("analytics_sync_status").select("project_id, source, last_sync_at, next_sync_at, sync_status, error_message"),
    ]);

    const projects = (projRes.data || []) as any[];
    const connections = (connRes.data || []) as any[];
    const syncData = (syncRes.data || []) as SyncInfo[];
    setSyncs(syncData);

    const connMap = new Map<string, any[]>();
    connections.forEach((c: any) => {
      const list = connMap.get(c.project_id) || [];
      list.push(c);
      connMap.set(c.project_id, list);
    });

    const mapped: ProjectIntegrationRow[] = projects.map((p: any) => {
      const conns = connMap.get(p.id) || [];
      const ga4 = conns.find((c: any) => c.provider === "GA4") || null;
      const gbp = conns.find((c: any) => c.provider === "GBP") || null;
      return {
        projectId: p.id,
        projectName: p.project_name || p.website_domain,
        clientName: p.clients?.contact_name || "—",
        domain: p.website_domain || "",
        ga4,
        gbp,
      };
    });

    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRetrySync = async (projectId: string, source: string) => {
    toast.info("Sync triggered…");
    const fnName = source === "google_maps" ? "sync-google-maps" : "scheduled-analytics-sync";
    await supabase.functions.invoke(fnName, { body: { projectId } });
    setTimeout(fetchData, 5000);
  };

  const getSyncForProject = (projectId: string, source: string) =>
    syncs.find(s => s.project_id === projectId && s.source === source);

  const filtered = rows.filter(r =>
    !search || r.projectName.toLowerCase().includes(search.toLowerCase()) || r.clientName.toLowerCase().includes(search.toLowerCase())
  );

  // Aggregate stats
  const totalProjects = rows.length;
  const ga4Connected = rows.filter(r => r.ga4?.status === "active" && r.ga4?.is_active).length;
  const gbpConnected = rows.filter(r => r.gbp?.status === "active" && r.gbp?.is_active).length;
  const errorsCount = rows.filter(r => r.ga4?.status === "error" || r.gbp?.status === "error").length;
  const staleCount = syncs.filter(s => {
    if (!s.last_sync_at) return true;
    return (Date.now() - new Date(s.last_sync_at).getTime()) > 48 * 3600000;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" /> Integrations Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor all Google Analytics & Business Profile connections across projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard label="Total Projects" value={totalProjects} icon={<BarChart3 className="h-4 w-4" />} />
        <SummaryCard label="GA4 Connected" value={ga4Connected} icon={<Activity className="h-4 w-4" />} accent="text-emerald-500" />
        <SummaryCard label="GBP Connected" value={gbpConnected} icon={<MapPin className="h-4 w-4" />} accent="text-emerald-500" />
        <SummaryCard label="Errors" value={errorsCount} icon={<AlertTriangle className="h-4 w-4" />} accent={errorsCount > 0 ? "text-destructive" : undefined} />
        <SummaryCard label="Stale Syncs" value={staleCount} icon={<Clock className="h-4 w-4" />} accent={staleCount > 0 ? "text-amber-500" : undefined} />
      </div>

      {/* Alerts */}
      {errorsCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">{errorsCount} integration{errorsCount > 1 ? "s" : ""} need attention</p>
            <p className="text-xs text-muted-foreground mt-0.5">Review the errors below and retry the sync or update credentials.</p>
          </div>
        </div>
      )}

      {staleCount > 0 && errorsCount === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Clock className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-600">{staleCount} sync{staleCount > 1 ? "s" : ""} are overdue</p>
            <p className="text-xs text-muted-foreground mt-0.5">Some projects haven't synced in over 48 hours.</p>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or clients…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Plug className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">No projects found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>GA4 Status</TableHead>
                  <TableHead>GA4 Sync</TableHead>
                  <TableHead>GBP Status</TableHead>
                  <TableHead>GBP Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(row => {
                  const gaSync = getSyncForProject(row.projectId, "google_analytics");
                  const gbpSync = getSyncForProject(row.projectId, "google_maps");
                  const gaStatus = row.ga4?.status || "none";
                  const gbpStatus = row.gbp?.status || "none";

                  return (
                    <TableRow key={row.projectId} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{row.projectName}</p>
                          <p className="text-xs text-muted-foreground">{row.domain}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.clientName}</TableCell>
                      <TableCell><StatusBadge status={gaStatus} /></TableCell>
                      <TableCell>
                        <SyncCell sync={gaSync} onRetry={() => handleRetrySync(row.projectId, "google_analytics")} />
                      </TableCell>
                      <TableCell><StatusBadge status={gbpStatus} /></TableCell>
                      <TableCell>
                        <SyncCell sync={gbpSync} onRetry={() => handleRetrySync(row.projectId, "google_maps")} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigate(`/seo-project/${row.projectId}`)}
                        >
                          Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsOverviewPage;

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground">{icon}<span className="text-xs font-medium">{label}</span></div>
        <p className={`text-2xl font-bold ${accent || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function SyncCell({ sync, onRetry }: { sync: SyncInfo | undefined; onRetry: () => void }) {
  if (!sync) return <span className="text-xs text-muted-foreground">—</span>;

  const isStale = sync.last_sync_at && (Date.now() - new Date(sync.last_sync_at).getTime()) > 48 * 3600000;
  const isError = sync.sync_status === "error" || sync.sync_status === "failed";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs">
        <div className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-destructive" : isStale ? "bg-amber-500" : "bg-emerald-500"}`} />
        <span className="text-muted-foreground">
          {sync.last_sync_at ? timeSince(sync.last_sync_at) : "Never"}
        </span>
      </div>
      {(isError || isStale) && (
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-primary" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      )}
      {sync.error_message && (
        <p className="text-[10px] text-destructive truncate max-w-[140px]" title={sync.error_message}>
          {sync.error_message}
        </p>
      )}
    </div>
  );
}
