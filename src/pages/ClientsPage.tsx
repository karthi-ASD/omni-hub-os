import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClients, Client, ClientStatus } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesTeam } from "@/hooks/useSalesTeam";
import { useCanCreateClient } from "@/hooks/useCanCreateClient";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { useLeadConversions } from "@/hooks/useLeadConversions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Plus, Mail, Phone, Building2, Search, Upload, RefreshCw, ChevronDown, UserCheck, Clock, CheckCircle, XCircle, Filter, MoreVertical, Undo2 } from "lucide-react";
import CSVImportDialog from "@/components/clients/CSVImportDialog";
import UnifiedClientForm from "@/components/clients/UnifiedClientForm";
import RevertToLeadDialog from "@/components/clients/RevertToLeadDialog";
import { toast } from "sonner";
import { notifySalesDataChanged, forceRefreshSalesData } from "@/lib/salesDataSync";

const statusColors: Record<string, string> = {
  active: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-warning/10 text-warning",
  prospect: "bg-primary/10 text-primary",
  suspended: "bg-muted text-muted-foreground",
};

const ClientsPage = () => {
  const navigate = useNavigate();
  const { profile, roles } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salesFilter, setSalesFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSalesId, setBulkSalesId] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { members: salesTeam, loading: salesLoading } = useSalesTeam();
  const { canCreate } = useCanCreateClient();
  const { departmentName } = useEmployeeDepartment();

  // Determine if user is a salesperson (in Sales department AND not admin)
  const isSalesOnly = useMemo(() => {
    const adminRoles = ["super_admin", "business_admin", "hr_manager", "manager"];
    const isAdmin = roles.some(r => adminRoles.includes(r));
    if (isAdmin) return false;
    // Only restrict to own clients if user is in the Sales department
    const salesDeptNames = ["sales", "sales department", "business development"];
    return departmentName ? salesDeptNames.some(s => departmentName.toLowerCase().includes(s)) : false;
  }, [roles, departmentName]);

  // For salespeople, force filter to their own user_id
  const effectiveSalesFilter = isSalesOnly ? (profile?.user_id || "all") : salesFilter;

  const {
    clients, loading, totalCount, statusCounts, hasMore,
    createClient, updateClientStatus, loadMore, setSearchTerm, refetch,
    bulkAssignSalesperson,
  } = useClients({
    salesOwnerId: effectiveSalesFilter !== "all" ? effectiveSalesFilter : null,
    statusFilter: statusFilter !== "all" ? statusFilter : null,
  });

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchTerm(value); }, 300);
  };

  const handleSyncClients = async () => {
    if (!profile?.business_id) { toast.error("No business linked"); return; }
    setSyncing(true);
    try {
      toast.info("Syncing contacts...");
      const { data, error } = await supabase.functions.invoke("xero-sync", {
        body: { action: "sync", business_id: profile.business_id, stage: "contacts" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Synced ${data.recordsSynced || 0} contacts`);
      refetch();
      notifySalesDataChanged(["clients", "dashboard"], "client:sync");
    } catch (e: any) { toast.error(e.message || "Sync failed"); }
    finally { setSyncing(false); }
  };

  // statusCounts now come from server-side via useClients hook

  const handleSalesOwnerChange = async (clientId: string, userId: string) => {
    const member = salesTeam.find(m => m.user_id === userId);
    await supabase.from("clients").update({
      sales_owner_id: userId || null,
      salesperson_owner: member?.full_name || null,
    } as any).eq("id", clientId);
    toast.success("Sales owner updated");
    refetch();
    notifySalesDataChanged(["clients", "dashboard"], "client:update-owner");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkSalesId || selectedIds.size === 0) return;
    const member = salesTeam.find(m => m.user_id === bulkSalesId);
    if (!member) return;
    await bulkAssignSalesperson(Array.from(selectedIds), bulkSalesId, member.full_name);
    setSelectedIds(new Set());
    setBulkSalesId("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={isSalesOnly ? "My Clients" : "Clients"} subtitle={`${totalCount} total records`} icon={Users}>
        {!isSalesOnly && (
          <Button size="sm" variant="outline" onClick={handleSyncClients} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync"}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={forceRefreshSalesData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh Data
        </Button>
        {canCreate && (
          <>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </>
        )}
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={totalCount} icon={Users} gradient="from-primary to-accent" />
        <StatCard label="Active" value={statusCounts.active || 0} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="Cancelled" value={statusCounts.cancelled || 0} icon={XCircle} gradient="from-destructive to-neon-orange" />
        <StatCard label="Pending" value={statusCounts.pending || 0} icon={Clock} gradient="from-warning to-neon-orange" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={searchInput} onChange={e => handleSearchChange(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-36 h-10 rounded-xl">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {!isSalesOnly && (
          <Select value={salesFilter} onValueChange={v => { setSalesFilter(v); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-44 h-10 rounded-xl">
              <UserCheck className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="All Salespeople" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Salespeople</SelectItem>
              {salesTeam.length === 0 && !salesLoading && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No sales team members available</div>
              )}
              {salesTeam.map(m => (
                <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk assignment bar */}
      {!isSalesOnly && selectedIds.size > 0 && (
        <Card className="rounded-xl border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">{selectedIds.size} client{selectedIds.size > 1 ? "s" : ""} selected</span>
            <Select value={bulkSalesId} onValueChange={setBulkSalesId}>
              <SelectTrigger className="w-48 h-8 text-xs rounded-lg">
                <SelectValue placeholder="Assign salesperson..." />
              </SelectTrigger>
              <SelectContent>
                {salesTeam.length === 0 && !salesLoading && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No sales team members available</div>
                )}
                {salesTeam.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="default" onClick={handleBulkAssign} disabled={!bulkSalesId} className="h-8 text-xs">
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 text-xs ml-auto">
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Client cards */}
      {loading && clients.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : clients.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-16 text-center text-muted-foreground">No clients found</CardContent></Card>
      ) : (
        <>
          {/* Select all toggle */}
          {!isSalesOnly && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selectedIds.size === clients.length && clients.length > 0}
                onCheckedChange={toggleSelectAll}
                className="h-4 w-4"
              />
              <span className="text-xs text-muted-foreground">Select all on this page</span>
            </div>
          )}

          <div className="space-y-2">
            {clients.map(c => (
              <Card key={c.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden hover-lift transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox for bulk select */}
                    {!isSalesOnly && (
                      <div className="pt-1" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{c.contact_name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusColors[c.client_status] || statusColors.pending}`}>
                          {c.client_status}
                        </Badge>
                      </div>
                      {c.company_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {c.company_name}
                        </p>
                      )}
                      {c.salesperson_owner && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <UserCheck className="h-3 w-3" /> {c.salesperson_owner}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Select value={c.client_status} onValueChange={v => { v && updateClientStatus(c.id, v as ClientStatus); }}>
                        <SelectTrigger className="w-28 h-7 text-[10px] rounded-lg" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      {!isSalesOnly && (
                        <Select value={c.sales_owner_id || "none"} onValueChange={v => { if (v !== "none") handleSalesOwnerChange(c.id, v); }}>
                          <SelectTrigger className="w-28 h-7 text-[10px] rounded-lg" onClick={e => e.stopPropagation()}>
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Assign</SelectItem>
                            {salesTeam.map(m => (
                              <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline" onClick={e => e.stopPropagation()}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                    {c.client_start_date && (
                      <span className="text-xs text-muted-foreground ml-auto">Since {c.client_start_date}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMore} disabled={loading} className="rounded-xl">
                <ChevronDown className="h-4 w-4 mr-1" />
                {loading ? "Loading..." : `Load more (${clients.length} of ${totalCount})`}
              </Button>
            </div>
          )}

          {!hasMore && clients.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing all {clients.length} of {totalCount} clients
            </p>
          )}
        </>
      )}

      <UnifiedClientForm open={createOpen} onOpenChange={setCreateOpen} onSubmit={createClient} />
      <CSVImportDialog open={importOpen} onOpenChange={setImportOpen} onComplete={refetch} />
    </div>
  );
};

export default ClientsPage;
