import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Trash2, RotateCcw, AlertTriangle, Merge, Eye, Pencil, Users, UserX, GitMerge, KeyRound, UserPlus, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";

const SuperAdminClientManagementPage = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    allClients, deletedClients, loading,
    softDeleteClient, restoreClient, permanentDeleteClient, mergeClients,
    refetch,
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

  // Reset password state
  const [resetTarget, setResetTarget] = useState<SuperAdminClient | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Create login state
  const [createLoginTarget, setCreateLoginTarget] = useState<SuperAdminClient | null>(null);
  const [createLoginLoading, setCreateLoginLoading] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFixLoading, setBulkFixLoading] = useState(false);
  const [showBulkFixConfirm, setShowBulkFixConfirm] = useState(false);
  const [bulkFixResult, setBulkFixResult] = useState<{ total: number; fixed: number; skipped: number; errors: number } | null>(null);

  const handleBulkFixIsolation = async () => {
    setShowBulkFixConfirm(false);
    setBulkFixLoading(true);
    setBulkFixResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-fix-client-isolation");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = { total: data.total, fixed: data.fixed, skipped: data.skipped || 0, errors: data.errors || 0 };
      setBulkFixResult(result);
      toast.success(`Isolation fix complete: ${result.fixed} fixed, ${result.skipped} skipped, ${result.errors} errors.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Bulk fix failed");
    } finally {
      setBulkFixLoading(false);
    }
  };

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

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword || newPassword !== confirmPassword) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setResetLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-client-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ client_id: resetTarget.id, new_password: newPassword }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to reset password");
      } else {
        toast.success("Password updated successfully.");
        setResetTarget(null);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCreateLogin = async (client: SuperAdminClient) => {
    setCreateLoginLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client-auth", {
        body: {
          client_id: client.id,
          email: client.email,
          full_name: client.contact_name,
          business_id: client.business_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.already_exists) {
        toast.info("Client login already exists.");
      } else {
        toast.success(`Login created for ${client.contact_name}. ${data?.password_info || ""}`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create client login");
    } finally {
      setCreateLoginLoading(false);
      setCreateLoginTarget(null);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const bulkPayload = Array.from(selectedIds).map(id => {
        const client = allClients.find(c => c.id === id);
        return {
          client_id: id,
          email: client?.email || "",
          full_name: client?.contact_name || "",
          business_id: client?.business_id || "",
        };
      });

      const { data, error } = await supabase.functions.invoke("create-client-auth", {
        body: { bulk: bulkPayload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const results = data?.results || [];
      const created = results.filter((r: any) => r.success && !r.already_exists).length;
      const existing = results.filter((r: any) => r.already_exists).length;
      const failed = results.filter((r: any) => r.error).length;

      toast.success(`Bulk activation complete: ${created} created, ${existing} already existed, ${failed} failed.`);
      setSelectedIds(new Set());
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Bulk activation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAll.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAll.map(c => c.id)));
    }
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
      <PageHeader title="Client Management" subtitle="Super Admin client control — delete, restore, merge, activate portals" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={allClients.filter(c => c.client_status === "active").length} icon={Users} gradient="from-primary to-accent" />
        <StatCard label="Total Clients" value={allClients.length} icon={Users} gradient="from-neon-green to-success" />
        <StatCard label="Deleted Clients" value={deletedClients.length} icon={UserX} gradient="from-destructive to-red-400" />
        <StatCard label="Merged Clients" value={allClients.filter(c => c.client_status === "merged").length} icon={GitMerge} gradient="from-neon-purple to-primary" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" onClick={() => setShowBulkFixConfirm(true)} disabled={bulkFixLoading} className="gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
          {bulkFixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          {bulkFixLoading ? "Processing..." : "Bulk Fix Client Isolation"}
        </Button>
        {bulkFixResult && (
          <div className="text-xs flex gap-3 text-muted-foreground">
            <span>Total: <strong>{bulkFixResult.total}</strong></span>
            <span className="text-green-600">Fixed: <strong>{bulkFixResult.fixed}</strong></span>
            <span>Skipped: <strong>{bulkFixResult.skipped}</strong></span>
            {bulkFixResult.errors > 0 && <span className="text-destructive">Errors: <strong>{bulkFixResult.errors}</strong></span>}
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Clients</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Clients</TabsTrigger>
          <TabsTrigger value="merge">Merge Clients</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {tab !== "merge" && (
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {tab === "all" && selectedIds.size > 0 && (
            <Button onClick={handleBulkActivate} disabled={bulkLoading} className="gap-2">
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Activate Client Portal ({selectedIds.size})
            </Button>
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
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredAll.length > 0 && selectedIds.size === filteredAll.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
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
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : filteredAll.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No clients match your filters. Try adjusting your search.</TableCell></TableRow>
                    ) : filteredAll.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{c.contact_name}</TableCell>
                        <TableCell>{c.company_name || "—"}</TableCell>
                        <TableCell className="text-xs">{c.email}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{statusBadge(c.client_status)}</TableCell>
                        <TableCell className="text-xs">{format(new Date(c.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/clients/${c.id}`)} title="View">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/clients/${c.id}`)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Create Login" onClick={() => setCreateLoginTarget(c)}>
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Reset Password" onClick={() => { setResetTarget(c); setNewPassword(""); setConfirmPassword(""); }}>
                              <KeyRound className="h-3.5 w-3.5" />
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

      {/* RESET CLIENT PASSWORD DIALOG */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) { setResetTarget(null); setNewPassword(""); setConfirmPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Client Password</DialogTitle>
            <DialogDescription>
              Reset the login password for <strong>{resetTarget?.contact_name}</strong> ({resetTarget?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
            <Button
              disabled={!newPassword || newPassword.length < 8 || newPassword !== confirmPassword || resetLoading}
              onClick={handleResetPassword}
            >
              {resetLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE CLIENT LOGIN DIALOG */}
      <Dialog open={!!createLoginTarget} onOpenChange={open => { if (!open) setCreateLoginTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create Client Login
            </DialogTitle>
            <DialogDescription>
              Create a portal login account for this client so they can access the CRM portal and mobile app.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4 space-y-2">
            <p className="font-semibold">{createLoginTarget?.contact_name}</p>
            <p className="text-sm text-muted-foreground">{createLoginTarget?.email}</p>
            <p className="text-sm text-muted-foreground">{createLoginTarget?.company_name || "No company"}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p><strong>Testing Mode:</strong> Password will be set to <code>nextweb123</code></p>
            <p><strong>Production Mode:</strong> A random password will be generated</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateLoginTarget(null)}>Cancel</Button>
            <Button onClick={() => createLoginTarget && handleCreateLogin(createLoginTarget)} disabled={createLoginLoading} className="gap-2">
              {createLoginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {createLoginLoading ? "Creating..." : "Create Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Fix Confirmation Dialog */}
      <Dialog open={showBulkFixConfirm} onOpenChange={setShowBulkFixConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" /> Bulk Fix Client Isolation
            </DialogTitle>
            <DialogDescription>
              This will migrate all clients to isolated tenant environments. Each client without a dedicated business will have one created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p>• Creates a dedicated business for each client</p>
            <p>• Fixes profile and role mappings</p>
            <p>• Safe to re-run — already-isolated clients are skipped</p>
            <p>• Processes all clients (no limit)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkFixConfirm(false)}>Cancel</Button>
            <Button onClick={handleBulkFixIsolation} className="gap-2 bg-orange-600 hover:bg-orange-700">
              <ShieldAlert className="h-4 w-4" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminClientManagementPage;
