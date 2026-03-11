import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClients, Client, OnboardingStatus } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Users, Plus, Mail, Phone, Building2, Search, Upload, RefreshCw, ChevronDown, UserCheck, Clock, CheckCircle } from "lucide-react";
import CSVImportDialog from "@/components/clients/CSVImportDialog";
import UnifiedClientForm from "@/components/clients/UnifiedClientForm";
import { toast } from "sonner";

const onboardingColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

const ClientsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    clients, loading, totalCount, hasMore,
    createClient, updateOnboardingStatus, loadMore, setSearchTerm, refetch,
  } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
    } catch (e: any) { toast.error(e.message || "Sync failed"); }
    finally { setSyncing(false); }
  };

  const statusCounts = {
    pending: clients.filter(c => c.onboarding_status === "pending").length,
    in_progress: clients.filter(c => c.onboarding_status === "in_progress").length,
    completed: clients.filter(c => c.onboarding_status === "completed").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Clients" subtitle={`${totalCount} total records`} icon={Users}>
        <Button size="sm" variant="outline" onClick={handleSyncClients} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1" /> Import
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending" value={statusCounts.pending} icon={Clock} gradient="from-warning to-neon-orange" />
        <StatCard label="In Progress" value={statusCounts.in_progress} icon={UserCheck} gradient="from-primary to-accent" />
        <StatCard label="Completed" value={statusCounts.completed} icon={CheckCircle} gradient="from-neon-green to-success" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={searchInput} onChange={e => handleSearchChange(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {/* Client cards */}
      {loading && clients.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : clients.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated"><CardContent className="py-16 text-center text-muted-foreground">No clients found</CardContent></Card>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map(c => (
              <Card key={c.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden cursor-pointer hover-lift transition-all" onClick={() => navigate(`/clients/${c.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{c.contact_name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${onboardingColors[c.onboarding_status]}`}>
                          {c.onboarding_status.replace("_", " ")}
                        </Badge>
                      </div>
                      {c.company_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {c.company_name}
                        </p>
                      )}
                    </div>
                    <Select value={c.onboarding_status} onValueChange={v => { v && updateOnboardingStatus(c.id, v as OnboardingStatus); }}>
                      <SelectTrigger className="w-28 h-7 text-[10px] rounded-lg" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
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
