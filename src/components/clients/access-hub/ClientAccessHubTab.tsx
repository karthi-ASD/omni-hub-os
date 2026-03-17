import { useState, useMemo } from "react";
import { useClientAccessHub, AccessCredential, ProjectIntegration } from "@/hooks/useClientAccessHub";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { CredentialCard } from "./CredentialCard";
import { IntegrationCard } from "./IntegrationCard";
import { CredentialFormDialog } from "./CredentialFormDialog";
import { IntegrationFormDialog } from "./IntegrationFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Plus, Server, Globe, Layout, BarChart3, Shield, Clock,
  AlertTriangle, Key, Plug,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  clientId: string;
  isClientView?: boolean;
}

type FilterType = "all" | "credentials" | "integrations" | "expiring" | "expired" | "active" | "client_visible";

/**
 * Determine permissions based on user role:
 * - super_admin / business_admin: Full access
 * - accounts: View renewals/billing, add renewal notes, no edit sensitive
 * - seo_team / seo_manager: Manage integrations, view credentials
 * - developer: View technical credentials/hosting API
 * - client: View-only, client-visible items only, no secrets
 */
function useAccessPermissions(isClientView?: boolean) {
  const { hasRole, isSuperAdmin, isBusinessAdmin } = useAuth();

  const isAdmin = isSuperAdmin || isBusinessAdmin;
  const isAccounts = hasRole("accounts");
  const isSeo = hasRole("seo_manager") || hasRole("seo_team");
  const isDev = hasRole("developer");
  const isManager = hasRole("manager");

  return {
    canAddCredential: isAdmin || isSeo || isDev || isManager,
    canAddIntegration: isAdmin || isSeo || isManager,
    canEditCredential: isAdmin || isSeo || isDev || isManager,
    canEditIntegration: isAdmin || isSeo || isManager,
    canArchive: isAdmin,
    canRevealPassword: isAdmin || isSeo || isDev || isManager,
    canViewAuditLog: isAdmin,
    canViewCredentials: !isClientView, // all staff can view
    canViewIntegrations: !isClientView,
    canViewRenewals: isAdmin || isAccounts || isSeo || isManager,
    isClientView: !!isClientView,
  };
}

export function ClientAccessHubTab({ clientId, isClientView }: Props) {
  const {
    credentials, integrations, auditLogs, loading,
    addCredential, updateCredential, archiveCredential,
    addIntegration, updateIntegration,
    logRevealPassword, logCopyAction,
  } = useClientAccessHub(clientId);

  const perms = useAccessPermissions(isClientView);

  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [intDialogOpen, setIntDialogOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<AccessCredential | null>(null);
  const [editingInt, setEditingInt] = useState<ProjectIntegration | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  // For client view, only show client-visible items
  const visibleCredentials = isClientView
    ? credentials.filter(c => c.is_client_visible)
    : credentials;
  const visibleIntegrations = isClientView
    ? integrations.filter(i => i.is_client_visible)
    : integrations;

  // Stats
  const expiringCreds = visibleCredentials.filter(c => c.status === "expiring_soon").length;
  const expiredCreds = visibleCredentials.filter(c => c.status === "expired").length;
  const activeIntegrations = visibleIntegrations.filter(i => i.is_enabled && i.status === "connected").length;

  // Filter
  const filteredCreds = useMemo(() => {
    switch (filter) {
      case "credentials": return visibleCredentials;
      case "expiring": return visibleCredentials.filter(c => c.status === "expiring_soon");
      case "expired": return visibleCredentials.filter(c => c.status === "expired");
      case "active": return visibleCredentials.filter(c => c.status === "active");
      case "client_visible": return visibleCredentials.filter(c => c.is_client_visible);
      case "integrations": return [];
      default: return visibleCredentials;
    }
  }, [visibleCredentials, filter]);

  const filteredInts = useMemo(() => {
    switch (filter) {
      case "integrations": return visibleIntegrations;
      case "client_visible": return visibleIntegrations.filter(i => i.is_client_visible);
      case "credentials": case "expiring": case "expired": return [];
      default: return visibleIntegrations;
    }
  }, [visibleIntegrations, filter]);

  const handleEditCred = (c: AccessCredential) => {
    if (!perms.canEditCredential) return;
    setEditingCred(c);
    setCredDialogOpen(true);
  };
  const handleEditInt = (i: ProjectIntegration) => {
    if (!perms.canEditIntegration) return;
    setEditingInt(i);
    setIntDialogOpen(true);
  };

  const handleSaveCred = async (data: Partial<AccessCredential>) => {
    if (editingCred) {
      await updateCredential(editingCred.id, data);
    } else {
      await addCredential(data);
    }
    setEditingCred(null);
  };

  const handleSaveInt = async (data: Partial<ProjectIntegration>) => {
    if (editingInt) {
      await updateIntegration(editingInt.id, data);
    } else {
      await addIntegration(data);
    }
    setEditingInt(null);
  };

  const handleToggleInt = async (id: string, enabled: boolean) => {
    if (!perms.canEditIntegration) return;
    await updateIntegration(id, { is_enabled: enabled, status: enabled ? "pending" : "disabled" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Credentials", value: visibleCredentials.length, icon: Key, color: "text-primary" },
            { label: "Integrations", value: activeIntegrations, icon: Plug, color: "text-info" },
            { label: "Expiring Soon", value: expiringCreds, icon: AlertTriangle, color: "text-warning" },
            { label: "Expired", value: expiredCreds, icon: AlertTriangle, color: "text-destructive" },
            { label: "Client Visible", value: visibleCredentials.filter(c => c.is_client_visible).length + visibleIntegrations.filter(i => i.is_client_visible).length, icon: Shield, color: "text-success" },
          ].map(s => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2.5">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {(["all", "credentials", "integrations", "expiring", "expired", "active", "client_visible"] as FilterType[]).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="text-xs h-7 rounded-full capitalize"
              onClick={() => setFilter(f)}
            >
              {f.replace("_", " ")}
            </Button>
          ))}
        </div>

        {/* Action Buttons - role-gated */}
        {!isClientView && (
          <div className="flex gap-2">
            {perms.canAddCredential && (
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingCred(null); setCredDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add Credential
              </Button>
            )}
            {perms.canAddIntegration && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setEditingInt(null); setIntDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add Integration
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hosting"><Server className="h-3.5 w-3.5 mr-1" />Hosting</TabsTrigger>
            <TabsTrigger value="domain"><Globe className="h-3.5 w-3.5 mr-1" />Domain</TabsTrigger>
            <TabsTrigger value="website"><Layout className="h-3.5 w-3.5 mr-1" />Website</TabsTrigger>
            <TabsTrigger value="marketing"><BarChart3 className="h-3.5 w-3.5 mr-1" />Marketing</TabsTrigger>
            <TabsTrigger value="renewals"><Clock className="h-3.5 w-3.5 mr-1" />Renewals</TabsTrigger>
            {perms.canViewAuditLog && <TabsTrigger value="audit"><Shield className="h-3.5 w-3.5 mr-1" />Audit</TabsTrigger>}
          </TabsList>

          {/* All tab */}
          <TabsContent value="all" className="space-y-4">
            {filteredCreds.length === 0 && filteredInts.length === 0 && (
              <EmptyState message={isClientView ? "No access information shared with you yet." : "No credentials or integrations added yet."} />
            )}
            {filteredCreds.map(c => (
              <CredentialCard
                key={c.id}
                credential={c}
                onEdit={handleEditCred}
                onArchive={archiveCredential}
                onRevealPassword={logRevealPassword}
                onCopy={logCopyAction}
                isClientView={isClientView}
                canEdit={perms.canEditCredential}
                canArchive={perms.canArchive}
                canRevealPassword={perms.canRevealPassword}
              />
            ))}
            {filteredInts.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInts.map(i => (
                    <IntegrationCard
                      key={i.id}
                      integration={i}
                      onEdit={handleEditInt}
                      onToggle={handleToggleInt}
                      isClientView={isClientView}
                      canEdit={perms.canEditIntegration}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Type-specific tabs */}
          {(["hosting", "domain", "website"] as const).map(type => (
            <TabsContent key={type} value={type} className="space-y-4">
              {visibleCredentials.filter(c => c.credential_type === type).length === 0 ? (
                <EmptyState message={`No ${type} credentials ${isClientView ? "shared with you" : "added"} yet.`} />
              ) : (
                visibleCredentials.filter(c => c.credential_type === type).map(c => (
                  <CredentialCard
                    key={c.id}
                    credential={c}
                    onEdit={handleEditCred}
                    onArchive={archiveCredential}
                    onRevealPassword={logRevealPassword}
                    onCopy={logCopyAction}
                    isClientView={isClientView}
                    canEdit={perms.canEditCredential}
                    canArchive={perms.canArchive}
                    canRevealPassword={perms.canRevealPassword}
                  />
                ))
              )}
            </TabsContent>
          ))}

          {/* Marketing Integrations */}
          <TabsContent value="marketing" className="space-y-4">
            {visibleIntegrations.length === 0 ? (
              <EmptyState message={isClientView ? "No integrations shared with you yet." : "No marketing integrations configured yet."} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleIntegrations.map(i => (
                  <IntegrationCard
                    key={i.id}
                    integration={i}
                    onEdit={handleEditInt}
                    onToggle={handleToggleInt}
                    isClientView={isClientView}
                    canEdit={perms.canEditIntegration}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Renewals Tab */}
          <TabsContent value="renewals" className="space-y-4">
            {(() => {
              const withExpiry = visibleCredentials.filter(c => c.expiry_date);
              if (withExpiry.length === 0) return <EmptyState message="No expiry dates tracked yet." />;
              const sorted = [...withExpiry].sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime());
              return sorted.map(c => (
                <CredentialCard
                  key={c.id}
                  credential={c}
                  onEdit={handleEditCred}
                  onArchive={archiveCredential}
                  onRevealPassword={logRevealPassword}
                  onCopy={logCopyAction}
                  isClientView={isClientView}
                  canEdit={perms.canEditCredential}
                  canArchive={perms.canArchive}
                  canRevealPassword={perms.canRevealPassword}
                />
              ));
            })()}
          </TabsContent>

          {/* Audit Log Tab - Admin only */}
          {perms.canViewAuditLog && (
            <TabsContent value="audit" className="space-y-3">
              {auditLogs.length === 0 ? (
                <EmptyState message="No audit activity recorded yet." />
              ) : (
                <Card className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {auditLogs.map(log => (
                        <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm">
                              <Badge variant="outline" className="text-[10px] mr-1.5">{log.action_type.replace("_", " ")}</Badge>
                              <span className="text-muted-foreground capitalize">{log.record_type}</span>
                            </p>
                            {log.action_note && <p className="text-xs text-muted-foreground mt-0.5">{log.action_note}</p>}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs */}
        <CredentialFormDialog
          open={credDialogOpen}
          onClose={() => { setCredDialogOpen(false); setEditingCred(null); }}
          onSave={handleSaveCred}
          initial={editingCred}
        />
        <IntegrationFormDialog
          open={intDialogOpen}
          onClose={() => { setIntDialogOpen(false); setEditingInt(null); }}
          onSave={handleSaveInt}
          initial={editingInt}
        />
      </div>
    </TooltipProvider>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Key className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
