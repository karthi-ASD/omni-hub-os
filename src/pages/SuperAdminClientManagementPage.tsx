import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdminClients, SuperAdminClient } from "@/hooks/useSuperAdminClients";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Trash2, RotateCcw, AlertTriangle, Merge, Eye, Pencil, Users, UserX, GitMerge, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";

const SuperAdminClientManagementPage = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    allClients, deletedClients, loading,
    softDeleteClient, restoreClient, permanentDeleteClient, mergeClients,
  } = useSuperAdminClients();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  // Soft delete state
  const [deleteTarget, setDeleteTarget] = useState<SuperAdminClient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Permanent delete state
  const [permDeleteTarget, setPermDeleteTarget] = useState<SuperAdminClient | null>(null);
  const [permDeleteConfirm, setPermDeleteConfirm] = useState("");

  // Restore
  const [restoreTarget, setRestoreTarget] = useState<SuperAdminClient | null>(null);

  // Merge state
  const [mergeSearchA, setMergeSearchA] = useState("");
  const [mergeSearchB, setMergeSearchB] = useState("");
  const [mergeClientA, setMergeClientA] = useState<SuperAdminClient | null>(null);
  const [mergeClientB, setMergeClientB] = useState<SuperAdminClient | null>(null);
  const [mergePrimary, setMergePrimary] = useState<"A" | "B">("A");
  const [mergeConfirm, setMergeConfirm] = useState("");
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const filteredAll = useMemo(() => {
    if (!search) return allClients;
    const q = search.toLowerCase();
    return allClients.filter(c =>
      c.contact_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company_name || "").toLowerCase().includes(q)
    );
  }, [allClients, search]);

  const filteredDeleted = useMemo(() => {
    if (!search) return deletedClients;
    const q = search.toLowerCase();
    return deletedClients.filter(c =>
      c.contact_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [deletedClients, search]);

  const mergeResultsA = useMemo(() => {
    if (!mergeSearchA || mergeSearchA.length < 2) return [];
    const q = mergeSearchA.toLowerCase();
    return allClients.filter(c =>
      (c.contact_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
      c.id !== mergeClientB?.id
    ).slice(0, 5);
  }, [allClients, mergeSearchA, mergeClientB]);

  const mergeResultsB = useMemo(() => {
    if (!mergeSearchB || mergeSearchB.length < 2) return [];
    const q = mergeSearchB.toLowerCase();
    return allClients.filter(c =>
      (c.contact_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
      c.id !== mergeClientA?.id
    ).slice(0, 5);
  }, [allClients, mergeSearchB, mergeClientA]);

  if (!isSuperAdmin) return <p className="text-muted-foreground p-8">Access denied. Super Admin only.</p>;

  const handleSoftDelete = async () => {
    if (deleteConfirm !== "DELETE" || !deleteTarget) return;
    await softDeleteClient(deleteTarget.id);
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  const handlePermanentDelete = async () => {
    if (permDeleteConfirm !== "PERMANENT DELETE" || !permDeleteTarget) return;
    await permanentDeleteClient(permDeleteTarget.id);
    setPermDeleteTarget(null);
    setPermDeleteConfirm("");
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await restoreClient(restoreTarget.id);
    setRestoreTarget(null);
  };

  const handleMerge = async () => {
    if (mergeConfirm !== "MERGE" || !mergeClientA || !mergeClientB) return;
    const primaryId = mergePrimary === "A" ? mergeClientA.id : mergeClientB.id;
    const secondaryId = mergePrimary === "A" ? mergeClientB.id : mergeClientA.id;
    await mergeClients(primaryId, secondaryId);
    setShowMergeDialog(false);
    setMergeClientA(null);
    setMergeClientB(null);
    setMergeConfirm("");
    setMergeSearchA("");
    setMergeSearchB("");
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-green-600",
      pending: "bg-yellow-500/10 text-yellow-600",
      cancelled: "bg-red-500/10 text-red-600",
      suspended: "bg-orange-500/10 text-orange-600",
      prospect: "bg-blue-500/10 text-blue-600",
    };
    return <Badge className={colors[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Client Management" subtitle="Super Admin client control — delete, restore, merge" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={allClients.filter(c => c.client_status === "active").length} icon={Users} gradient="from-primary to-accent" />
        <StatCard label="Total Clients" value={allClients.length} icon={Users} gradient="from-neon-green to-success" />
        <StatCard label="Deleted Clients" value={deletedClients.length} icon={UserX} gradient="from-destructive to-red-400" />
        <StatCard label="Merged Clients" value={allClients.filter(c => c.client_status === "merged").length} icon={GitMerge} gradient="from-neon-purple to-primary" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Clients</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Clients</TabsTrigger>
          <TabsTrigger value="merge">Merge Clients</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {tab !== "merge" && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {/* ALL CLIENTS TAB */}
        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredAll.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No clients found</TableCell></TableRow>
                    ) : filteredAll.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contact_name}</TableCell>
                        <TableCell>{c.company_name || "—"}</TableCell>
                        <TableCell className="text-xs">{c.email}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{statusBadge(c.client_status)}</TableCell>
                        <TableCell className="text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/clients/${c.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/clients/${c.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELETED CLIENTS TAB */}
        <TabsContent value="deleted">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Deleted Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredDeleted.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No deleted clients</TableCell></TableRow>
                    ) : filteredDeleted.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contact_name}</TableCell>
                        <TableCell>{c.company_name || "—"}</TableCell>
                        <TableCell className="text-xs">{c.email}</TableCell>
                        <TableCell className="text-xs">{c.deleted_at ? format(new Date(c.deleted_at), "dd MMM yyyy HH:mm") : "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setRestoreTarget(c)}>
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setPermDeleteTarget(c)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Permanent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MERGE CLIENTS TAB */}
        <TabsContent value="merge">
          <Card>
            <CardContent className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Search and select two clients to merge. All records from the secondary client will be moved to the primary client.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client A */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Client A</Label>
                  {mergeClientA ? (
                    <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{mergeClientA.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{mergeClientA.email}</p>
                          <p className="text-xs text-muted-foreground">{mergeClientA.company_name || "No company"}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setMergeClientA(null); setMergeSearchA(""); }}>✕</Button>
                      </div>
                      <Badge variant={mergePrimary === "A" ? "default" : "outline"}
                        className="cursor-pointer" onClick={() => setMergePrimary("A")}>
                        {mergePrimary === "A" ? "✓ Primary (Master)" : "Set as Primary"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input placeholder="Search Client A..." value={mergeSearchA} onChange={e => setMergeSearchA(e.target.value)} />
                      {mergeResultsA.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 border rounded-md bg-popover shadow-md max-h-48 overflow-auto">
                          {mergeResultsA.map(c => (
                            <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                              onClick={() => { setMergeClientA(c); setMergeSearchA(""); }}>
                              <span className="font-medium">{c.contact_name}</span>
                              <span className="text-muted-foreground ml-2">{c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Client B */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Client B</Label>
                  {mergeClientB ? (
                    <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{mergeClientB.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{mergeClientB.email}</p>
                          <p className="text-xs text-muted-foreground">{mergeClientB.company_name || "No company"}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setMergeClientB(null); setMergeSearchB(""); }}>✕</Button>
                      </div>
                      <Badge variant={mergePrimary === "B" ? "default" : "outline"}
                        className="cursor-pointer" onClick={() => setMergePrimary("B")}>
                        {mergePrimary === "B" ? "✓ Primary (Master)" : "Set as Primary"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input placeholder="Search Client B..." value={mergeSearchB} onChange={e => setMergeSearchB(e.target.value)} />
                      {mergeResultsB.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 border rounded-md bg-popover shadow-md max-h-48 overflow-auto">
                          {mergeResultsB.map(c => (
                            <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                              onClick={() => { setMergeClientB(c); setMergeSearchB(""); }}>
                              <span className="font-medium">{c.contact_name}</span>
                              <span className="text-muted-foreground ml-2">{c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {mergeClientA && mergeClientB && (
                <div className="flex justify-center pt-4">
                  <Button onClick={() => setShowMergeDialog(true)} className="gap-2">
                    <Merge className="h-4 w-4" /> Merge Clients
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SOFT DELETE DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) { setDeleteTarget(null); setDeleteConfirm(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Delete Client</DialogTitle>
            <DialogDescription>
              You are about to delete <strong>{deleteTarget?.contact_name}</strong>. This will hide the client from CRM and disable all activity.
              Associated data includes SEO projects, keywords, reports, tickets, notes, and activity logs.
              This action can be reversed by restoring the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Type <strong>DELETE</strong> to confirm</Label>
            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={handleSoftDelete}>Delete Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PERMANENT DELETE DIALOG */}
      <Dialog open={!!permDeleteTarget} onOpenChange={o => { if (!o) { setPermDeleteTarget(null); setPermDeleteConfirm(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Permanent Delete</DialogTitle>
            <DialogDescription>
              You are about to permanently delete <strong>{permDeleteTarget?.contact_name}</strong>.
              This will permanently remove the client profile, projects, keywords, reports, tickets, notes, and activity history.
              <strong className="block mt-2 text-destructive">This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Type <strong>PERMANENT DELETE</strong> to continue</Label>
            <Input value={permDeleteConfirm} onChange={e => setPermDeleteConfirm(e.target.value)} placeholder="PERMANENT DELETE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPermDeleteTarget(null); setPermDeleteConfirm(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={permDeleteConfirm !== "PERMANENT DELETE"} onClick={handlePermanentDelete}>Permanently Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESTORE DIALOG */}
      <Dialog open={!!restoreTarget} onOpenChange={o => { if (!o) setRestoreTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Client</DialogTitle>
            <DialogDescription>
              Restore <strong>{restoreTarget?.contact_name}</strong> back to active status? The client will reappear in CRM with all data intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>Cancel</Button>
            <Button onClick={handleRestore}>Restore Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MERGE DIALOG */}
      <Dialog open={showMergeDialog} onOpenChange={o => { if (!o) { setShowMergeDialog(false); setMergeConfirm(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Merge className="h-5 w-5" /> Merge Clients</DialogTitle>
            <DialogDescription>
              <strong>{mergePrimary === "A" ? mergeClientA?.contact_name : mergeClientB?.contact_name}</strong> will remain active (Primary).
              <br />
              <strong>{mergePrimary === "A" ? mergeClientB?.contact_name : mergeClientA?.contact_name}</strong> will be archived (Secondary).
              <br /><br />
              All projects, keywords, tickets and records will move to the primary client.
              <strong className="block mt-2 text-destructive">This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Type <strong>MERGE</strong> to continue</Label>
            <Input value={mergeConfirm} onChange={e => setMergeConfirm(e.target.value)} placeholder="MERGE" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMergeDialog(false); setMergeConfirm(""); }}>Cancel</Button>
            <Button disabled={mergeConfirm !== "MERGE"} onClick={handleMerge}>Merge Clients</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminClientManagementPage;
