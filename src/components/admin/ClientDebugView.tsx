import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Activity, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

interface ClientDebugViewProps {
  clientDebug: {
    client: any;
    modules: Record<string, number>;
    email_duplicates: any[];
    phone_duplicates: any[];
    unmatched_records: any[];
    health_status: string;
  } | null;
  clients: { id: string; contact_name: string; email: string; company_name?: string | null }[];
  onSelectClient: (clientId: string) => void;
  loading?: boolean;
}

const healthColors: Record<string, string> = {
  healthy: "bg-green-500/10 text-green-700 border-green-200",
  needs_linking: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  duplicate_risk: "bg-red-500/10 text-red-700 border-red-200",
  missing_external_mapping: "bg-orange-500/10 text-orange-700 border-orange-200",
};

const healthLabels: Record<string, string> = {
  healthy: "Healthy",
  needs_linking: "Needs Linking",
  duplicate_risk: "Duplicate Risk",
  missing_external_mapping: "Missing External Mapping",
};

export function ClientDebugView({ clientDebug, clients, onSelectClient, loading }: ClientDebugViewProps) {
  const [search, setSearch] = useState("");

  const filtered = search.length >= 2
    ? clients.filter(c =>
        c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.company_name || "").toLowerCase().includes(search.toLowerCase())
      ).slice(0, 15)
    : [];

  return (
    <div className="space-y-4">
      {/* Client Search */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Client Debug View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search client to inspect..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {filtered.length > 0 && (
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {filtered.map(c => (
                  <button key={c.id} className="w-full text-left p-2 rounded-md border border-border hover:bg-accent/50 transition-colors text-sm" onClick={() => { onSelectClient(c.id); setSearch(""); }}>
                    <span className="font-medium">{c.contact_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.email}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading client debug info...</span>
        </div>
      )}

      {clientDebug && (
        <>
          {/* Health Status + Identity */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{clientDebug.client.contact_name}</CardTitle>
                <Badge className={`text-xs ${healthColors[clientDebug.health_status] || ""}`}>
                  {healthLabels[clientDebug.health_status] || clientDebug.health_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-mono text-xs">{clientDebug.client.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-mono text-xs">{clientDebug.client.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Xero Contact ID</p>
                  <p className="font-mono text-xs">{clientDebug.client.xero_contact_id || <span className="text-destructive">Not mapped</span>}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Client ID</p>
                  <p className="font-mono text-xs">{clientDebug.client.id.slice(0, 12)}…</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Link Status */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Module Linkage Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(clientDebug.modules).map(([table, count]) => (
                  <div key={table} className="flex items-center gap-2 p-2 rounded-md border text-xs">
                    {count > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className="truncate capitalize">{table.replace(/_/g, " ")}</span>
                    <Badge variant={count > 0 ? "default" : "secondary"} className="ml-auto text-[10px] h-4 px-1">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duplicates */}
          {(clientDebug.email_duplicates.length > 0 || clientDebug.phone_duplicates.length > 0) && (
            <Card className="rounded-xl border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Duplicate Clients Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientDebug.email_duplicates.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Email Duplicates</p>
                    {clientDebug.email_duplicates.map((d: any) => (
                      <div key={d.id} className="text-xs flex items-center gap-2 p-1.5 rounded bg-muted/50">
                        <span>{d.contact_name}</span>
                        <span className="text-muted-foreground">{d.email}</span>
                        <span className="font-mono text-muted-foreground ml-auto">{d.id.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {clientDebug.phone_duplicates.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Phone Duplicates</p>
                    {clientDebug.phone_duplicates.map((d: any) => (
                      <div key={d.id} className="text-xs flex items-center gap-2 p-1.5 rounded bg-muted/50">
                        <span>{d.contact_name}</span>
                        <span className="text-muted-foreground">{d.phone}</span>
                        <span className="font-mono text-muted-foreground ml-auto">{d.id.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
