import { useState } from "react";
import { useClientIntegrity } from "@/hooks/useClientIntegrity";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/ui/page-header";
import { ManualRefresh } from "@/components/ui/manual-refresh";
import { SmartEmptyState } from "@/components/ui/smart-empty-state";
import { ShieldCheck, AlertTriangle, Link2, Search, ScanLine, Database, Users, FileWarning } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ClientDataIntegrityPage() {
  usePageTitle("Client Data Integrity");
  const { isSuperAdmin } = useAuth();
  const { duplicates, unmatchedRecords, loading, scanning, scanOrphans, linkRecord, refetch } = useClientIntegrity();
  const { clients } = useClients({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ recordId: string; sourceTable: string } | null>(null);
  const [clientSearch, setClientSearch] = useState("");

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  const filteredClients = clientSearch.length >= 2
    ? clients.filter(c =>
        c.contact_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.company_name || "").toLowerCase().includes(clientSearch.toLowerCase())
      ).slice(0, 20)
    : [];

  const handleLink = async (clientId: string) => {
    if (!linkDialog) return;
    const success = await linkRecord(linkDialog.recordId, clientId);
    if (success) {
      setLinkDialog(null);
      setClientSearch("");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <PageHeader title="Client Data Integrity" subtitle="Access restricted to Super Admins" icon={ShieldCheck} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Client Data Integrity" subtitle="Monitor and resolve data mapping issues" icon={ShieldCheck} />
        <ManualRefresh onRefresh={handleRefresh} lastUpdated={lastUpdated} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{duplicates.length}</p>
                <p className="text-xs text-muted-foreground">Duplicate Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileWarning className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{unmatchedRecords.length}</p>
                <p className="text-xs text-muted-foreground">Unmatched Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4 flex items-center">
            <Button onClick={scanOrphans} disabled={scanning} variant="outline" className="w-full">
              <ScanLine className="h-4 w-4 mr-2" />
              {scanning ? "Scanning..." : "Scan for Orphans"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="unmatched">
        <TabsList>
          <TabsTrigger value="unmatched">
            Unmatched Records
            {unmatchedRecords.length > 0 && <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1">{unmatchedRecords.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicates
            {duplicates.length > 0 && <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1">{duplicates.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Unmatched Records Tab */}
        <TabsContent value="unmatched" className="mt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : unmatchedRecords.length === 0 ? (
            <SmartEmptyState variant="no-data" entityName="unmatched records" />
          ) : (
            <Card className="rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Found</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatchedRecords.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{rec.source_table.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{rec.source_record_id.slice(0, 8)}…</TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-[10px]">{rec.resolution_status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(rec.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLinkDialog({ recordId: rec.id, sourceTable: rec.source_table })}>
                          <Link2 className="h-3 w-3 mr-1" /> Link to Client
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="mt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : duplicates.length === 0 ? (
            <SmartEmptyState variant="no-data" entityName="duplicate clients" />
          ) : (
            <Card className="rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Dup Email</TableHead>
                    <TableHead>Dup Phone</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>SEO</TableHead>
                    <TableHead>Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicates.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm">{d.contact_name}</TableCell>
                      <TableCell className="text-xs">{d.email}</TableCell>
                      <TableCell className="text-xs">{d.phone || "—"}</TableCell>
                      <TableCell>
                        {d.duplicate_email_count > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">{d.duplicate_email_count} dup</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {d.duplicate_phone_count > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">{d.duplicate_phone_count} dup</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">{d.ticket_count}</TableCell>
                      <TableCell className="text-xs">{d.seo_project_count}</TableCell>
                      <TableCell className="text-xs">{d.invoice_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Link to Client Dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(v) => { if (!v) { setLinkDialog(null); setClientSearch(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Link Record to Client
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {linkDialog && (
              <p className="text-xs text-muted-foreground">
                Linking <Badge variant="outline" className="text-[10px]">{linkDialog.sourceTable}</Badge> record to a client
              </p>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name or email..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    onClick={() => handleLink(c.id)}
                  >
                    <p className="text-sm font-medium">{c.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{c.email} {c.company_name ? `· ${c.company_name}` : ""}</p>
                  </button>
                ))}
                {clientSearch.length >= 2 && filteredClients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No matching clients</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
