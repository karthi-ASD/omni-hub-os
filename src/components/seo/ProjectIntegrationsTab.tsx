import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { encryptField } from "@/lib/vault-crypto";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Plug, Upload,
  Shield, Clock, Trash2, Save, Eye, EyeOff,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  projectId: string;
  businessId: string;
}

interface GAConnection {
  id: string;
  project_id: string | null;
  business_id: string;
  provider: string;
  status: string;
  account_name: string | null;
  property_id: string | null;
  measurement_id: string | null;
  credentials_encrypted: string | null;
  is_active: boolean;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

interface SyncStatus {
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: string;
  error_message: string | null;
}

export function ProjectIntegrationsTab({ projectId, businessId }: Props) {
  const { user } = useAuth();
  const [connection, setConnection] = useState<GAConnection | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Form state
  const [form, setForm] = useState({
    account_name: "",
    property_id: "",
    measurement_id: "",
    service_account_json: "",
    api_key: "",
  });

  const fetchConnection = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("analytics_connections")
      .select("*")
      .eq("project_id", projectId)
      .eq("provider", "GA4")
      .maybeSingle();

    const conn = data as any as GAConnection | null;
    setConnection(conn);
    if (conn) {
      setForm({
        account_name: conn.account_name || "",
        property_id: conn.property_id || "",
        measurement_id: conn.measurement_id || "",
        service_account_json: "",
        api_key: "",
      });
    }

    // Fetch sync status
    const { data: sync } = await supabase
      .from("analytics_sync_status" as any)
      .select("last_sync_at, next_sync_at, sync_status, error_message")
      .eq("project_id", projectId)
      .maybeSingle();
    setSyncStatus(sync as any);

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchConnection(); }, [fetchConnection]);

  const handleConnect = async () => {
    if (!form.property_id.trim()) {
      toast.error("Property ID is required");
      return;
    }
    setSaving(true);

    try {
      // Encrypt credentials
      let encryptedCreds: string | null = null;
      const credPayload: Record<string, string> = {};
      if (form.service_account_json.trim()) {
        // Validate JSON
        try { JSON.parse(form.service_account_json); } catch {
          toast.error("Invalid JSON format for Service Account");
          setSaving(false);
          return;
        }
        credPayload.service_account_json = form.service_account_json.trim();
      }
      if (form.api_key.trim()) {
        credPayload.api_key = form.api_key.trim();
      }

      if (Object.keys(credPayload).length > 0) {
        encryptedCreds = await encryptField(JSON.stringify(credPayload));
      }

      if (connection) {
        // Update existing
        const updates: any = {
          account_name: form.account_name.trim() || null,
          property_id: form.property_id.trim(),
          measurement_id: form.measurement_id.trim() || null,
          status: "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        };
        if (encryptedCreds) updates.credentials_encrypted = encryptedCreds;

        const { error } = await supabase
          .from("analytics_connections")
          .update(updates)
          .eq("id", connection.id);
        if (error) throw error;
        toast.success("Google Analytics credentials updated");
      } else {
        // Create new
        const { error } = await supabase
          .from("analytics_connections")
          .insert({
            business_id: businessId,
            project_id: projectId,
            provider: "GA4",
            auth_type: form.service_account_json.trim() ? "SERVICE_ACCOUNT" : "API_KEY",
            account_name: form.account_name.trim() || null,
            property_id: form.property_id.trim(),
            measurement_id: form.measurement_id.trim() || null,
            credentials_encrypted: encryptedCreds,
            status: "active",
            is_active: true,
            external_account_id: form.property_id.trim(),
          } as any);
        if (error) throw error;
        toast.success("Google Analytics connected successfully");
      }

      setDialogOpen(false);
      fetchConnection();
    } catch (e: any) {
      toast.error(e.message || "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    const { error } = await supabase
      .from("analytics_connections")
      .update({ status: "disconnected", is_active: false, updated_at: new Date().toISOString() } as any)
      .eq("id", connection.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Google Analytics disconnected");
    fetchConnection();
  };

  const handleTriggerSync = async () => {
    toast.info("Sync triggered — data will refresh within minutes");
    await supabase.functions.invoke("scheduled-analytics-sync", {
      body: { projectId },
    });
    setTimeout(fetchConnection, 5000);
  };

  // Status helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "error": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default: return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-primary/10 text-primary border-primary/20">Connected</Badge>;
      case "error": return <Badge variant="destructive">Error</Badge>;
      case "disconnected": return <Badge variant="secondary">Disconnected</Badge>;
      default: return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  const timeSince = (date: string) => {
    const hrs = Math.round((Date.now() - new Date(date).getTime()) / 3600000);
    if (hrs < 1) return "Less than 1 hour ago";
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    return `${Math.round(hrs / 24)} day${hrs >= 48 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isConnected = connection?.status === "active" && connection?.is_active;

  return (
    <div className="space-y-6">
      {/* Google Analytics Card */}
      <Card className="border-2 border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.84 2.998v18.004c0 .554-.212 1.083-.592 1.474a1.988 1.988 0 01-1.43.608c-1.126 0-2.023-.93-2.023-2.082V2.998c0-1.152.897-2.082 2.023-2.082 1.125 0 2.022.93 2.022 2.082zM14.03 11.998v9.004c0 .554-.213 1.083-.593 1.474a1.988 1.988 0 01-1.43.608c-1.125 0-2.022-.93-2.022-2.082v-9.004c0-1.152.897-2.082 2.023-2.082 1.125 0 2.022.93 2.022 2.082zM5.2 19.92a2.08 2.08 0 11.001-4.161A2.08 2.08 0 015.2 19.92z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Google Analytics 4</CardTitle>
                <CardDescription>Connect GA4 to track website performance metrics</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(connection?.status || "none")}
              {getStatusBadge(connection?.status || "none")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Details */}
          {isConnected && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {connection?.account_name && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium text-sm">{connection.account_name}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Property ID</p>
                <p className="font-medium text-sm font-mono">{connection?.property_id}</p>
              </div>
              {connection?.measurement_id && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Measurement ID</p>
                  <p className="font-medium text-sm font-mono">{connection.measurement_id}</p>
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Credentials</p>
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <p className="font-medium text-sm text-primary">Encrypted & Stored</p>
                </div>
              </div>
            </div>
          )}

          {/* Sync Status */}
          {isConnected && (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 grid sm:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Sync: </span>
                  <span className="font-medium">
                    {syncStatus?.last_sync_at ? timeSince(syncStatus.last_sync_at) : "Never"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Next Sync: </span>
                  <span className="font-medium">
                    {syncStatus?.next_sync_at
                      ? new Date(syncStatus.next_sync_at).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge variant={syncStatus?.sync_status === "synced" ? "default" : "secondary"} className="text-xs">
                    {syncStatus?.sync_status || "pending"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {connection?.last_error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-destructive">Sync Error</p>
                <p className="text-muted-foreground">{connection.last_error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!connection && (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Plug className="h-7 w-7 text-primary/40" />
              </div>
              <div>
                <p className="font-medium">No Google Analytics Connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your GA4 property to start tracking performance metrics for this project.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant={isConnected ? "outline" : "default"}>
                  {isConnected ? <><Save className="h-3.5 w-3.5 mr-1.5" /> Update Credentials</> : <><Plug className="h-3.5 w-3.5 mr-1.5" /> Connect Google Analytics</>}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isConnected ? "Update" : "Connect"} Google Analytics</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Account Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      placeholder="e.g. My Client Website"
                      value={form.account_name}
                      onChange={e => setForm({ ...form, account_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Property ID <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="e.g. 123456789"
                      value={form.property_id}
                      onChange={e => setForm({ ...form, property_id: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Found in GA4 → Admin → Property Settings</p>
                  </div>
                  <div>
                    <Label>Measurement ID <span className="text-muted-foreground text-xs">(G-XXXX)</span></Label>
                    <Input
                      placeholder="e.g. G-ABC123DEF4"
                      value={form.measurement_id}
                      onChange={e => setForm({ ...form, measurement_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Service Account JSON <span className="text-xs text-primary">(recommended)</span></Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setShowJson(!showJson)}
                      >
                        {showJson ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {showJson ? "Hide" : "Show"}
                      </Button>
                    </div>
                    <Textarea
                      placeholder='Paste your service account JSON key here...'
                      value={form.service_account_json}
                      onChange={e => setForm({ ...form, service_account_json: e.target.value })}
                      rows={showJson ? 6 : 2}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create in Google Cloud Console → IAM → Service Accounts → Keys
                    </p>
                  </div>
                  <div>
                    <Label>API Key <span className="text-muted-foreground text-xs">(optional fallback)</span></Label>
                    <Input
                      type="password"
                      placeholder="Enter API key..."
                      value={form.api_key}
                      onChange={e => setForm({ ...form, api_key: e.target.value })}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <p>Credentials are encrypted before storage. Only backend sync functions can access them — they are never exposed in the frontend.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleConnect} disabled={saving}>
                    {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plug className="h-3.5 w-3.5 mr-1.5" />}
                    {saving ? "Saving..." : isConnected ? "Update" : "Connect"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {isConnected && (
              <>
                <Button size="sm" variant="outline" onClick={handleTriggerSync}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Trigger Sync
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDisconnect}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium mb-1">More Integrations Coming Soon</p>
          <p>Google Search Console · Google Ads · Facebook Ads · CRM Leads</p>
        </CardContent>
      </Card>
    </div>
  );
}
