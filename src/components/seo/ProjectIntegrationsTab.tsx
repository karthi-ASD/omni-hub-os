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
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Plug,
  Shield, Clock, Trash2, Save, Eye, EyeOff, MapPin,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  projectId: string;
  businessId: string;
}

interface AnalyticsConnection {
  id: string;
  project_id: string | null;
  business_id: string;
  provider: string;
  status: string;
  account_name: string | null;
  property_id: string | null;
  measurement_id: string | null;
  location_id: string | null;
  business_name: string | null;
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
  source: string;
}

// ---------- Shared helpers ----------
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

// ─── Reusable integration card ───
function IntegrationCard({
  provider,
  providerLabel,
  icon,
  description,
  connection,
  syncStatus,
  idLabel,
  idValue,
  extraFields,
  onConnect,
  onDisconnect,
  onTriggerSync,
  connectDialogContent,
  saving,
  dialogOpen,
  setDialogOpen,
}: {
  provider: string;
  providerLabel: string;
  icon: React.ReactNode;
  description: string;
  connection: AnalyticsConnection | null;
  syncStatus: SyncStatus | null;
  idLabel: string;
  idValue: string | null;
  extraFields?: { label: string; value: string }[];
  onConnect: () => void;
  onDisconnect: () => void;
  onTriggerSync: () => void;
  connectDialogContent: React.ReactNode;
  saving: boolean;
  dialogOpen: boolean;
  setDialogOpen: (v: boolean) => void;
}) {
  const isConnected = connection?.status === "active" && connection?.is_active;

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">{icon}</div>
            <div>
              <CardTitle className="text-lg">{providerLabel}</CardTitle>
              <CardDescription>{description}</CardDescription>
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
              <p className="text-xs text-muted-foreground">{idLabel}</p>
              <p className="font-medium text-sm font-mono">{idValue}</p>
            </div>
            {extraFields?.map(f => (
              <div key={f.label} className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="font-medium text-sm font-mono">{f.value}</p>
              </div>
            ))}
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

        {/* Error */}
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
              <p className="font-medium">No {providerLabel} Connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your {providerLabel} to start tracking metrics for this project.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant={isConnected ? "outline" : "default"}>
                {isConnected ? <><Save className="h-3.5 w-3.5 mr-1.5" /> Update Credentials</> : <><Plug className="h-3.5 w-3.5 mr-1.5" /> Connect {providerLabel}</>}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{isConnected ? "Update" : "Connect"} {providerLabel}</DialogTitle>
              </DialogHeader>
              {connectDialogContent}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={onConnect} disabled={saving}>
                  {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plug className="h-3.5 w-3.5 mr-1.5" />}
                  {saving ? "Saving..." : isConnected ? "Update" : "Connect"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isConnected && (
            <>
              <Button size="sm" variant="outline" onClick={onTriggerSync}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Trigger Sync
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDisconnect}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════ MAIN COMPONENT ═══════════════════
export function ProjectIntegrationsTab({ projectId, businessId }: Props) {
  const { user } = useAuth();

  // GA state
  const [gaConn, setGaConn] = useState<AnalyticsConnection | null>(null);
  const [gaSync, setGaSync] = useState<SyncStatus | null>(null);
  const [gaDialog, setGaDialog] = useState(false);
  const [gaSaving, setGaSaving] = useState(false);
  const [gaShowJson, setGaShowJson] = useState(false);
  const [gaForm, setGaForm] = useState({ account_name: "", property_id: "", measurement_id: "", service_account_json: "", api_key: "" });

  // GBP state
  const [gbpConn, setGbpConn] = useState<AnalyticsConnection | null>(null);
  const [gbpSync, setGbpSync] = useState<SyncStatus | null>(null);
  const [gbpDialog, setGbpDialog] = useState(false);
  const [gbpSaving, setGbpSaving] = useState(false);
  const [gbpShowJson, setGbpShowJson] = useState(false);
  const [gbpForm, setGbpForm] = useState({ account_name: "", location_id: "", business_name: "", service_account_json: "", oauth_token: "" });

  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [gaRes, gbpRes, syncRes] = await Promise.all([
      (supabase as any).from("analytics_connections").select("*").eq("project_id", projectId).eq("provider", "GA4").maybeSingle(),
      (supabase as any).from("analytics_connections").select("*").eq("project_id", projectId).eq("provider", "GBP").maybeSingle(),
      (supabase as any).from("analytics_sync_status").select("last_sync_at, next_sync_at, sync_status, error_message, source").eq("project_id", projectId),
    ]);

    const ga = gaRes.data as AnalyticsConnection | null;
    const gbp = gbpRes.data as AnalyticsConnection | null;
    const syncs = (syncRes.data as SyncStatus[]) || [];

    setGaConn(ga);
    setGbpConn(gbp);
    setGaSync(syncs.find(s => s.source === "google_analytics") || null);
    setGbpSync(syncs.find(s => s.source === "google_maps") || null);

    if (ga) setGaForm({ account_name: ga.account_name || "", property_id: ga.property_id || "", measurement_id: ga.measurement_id || "", service_account_json: "", api_key: "" });
    if (gbp) setGbpForm({ account_name: gbp.account_name || "", location_id: gbp.location_id || "", business_name: gbp.business_name || "", service_account_json: "", oauth_token: "" });

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ---------- Generic save handler ----------
  const handleSave = async (
    provider: string,
    conn: AnalyticsConnection | null,
    requiredField: string,
    requiredLabel: string,
    formData: Record<string, string>,
    jsonField: string,
    fallbackField: string,
    setSaving: (v: boolean) => void,
    setDialog: (v: boolean) => void,
  ) => {
    if (!formData[requiredField]?.trim()) {
      toast.error(`${requiredLabel} is required`);
      return;
    }
    setSaving(true);
    try {
      let encryptedCreds: string | null = null;
      const credPayload: Record<string, string> = {};
      if (formData[jsonField]?.trim()) {
        try { JSON.parse(formData[jsonField]); } catch { toast.error("Invalid JSON format"); setSaving(false); return; }
        credPayload.service_account_json = formData[jsonField].trim();
      }
      if (formData[fallbackField]?.trim()) {
        credPayload[fallbackField] = formData[fallbackField].trim();
      }
      if (Object.keys(credPayload).length > 0) {
        encryptedCreds = await encryptField(JSON.stringify(credPayload));
      }

      const baseFields: any = {
        account_name: formData.account_name?.trim() || null,
        status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (provider === "GA4") {
        baseFields.property_id = formData.property_id?.trim();
        baseFields.measurement_id = formData.measurement_id?.trim() || null;
      } else {
        baseFields.location_id = formData.location_id?.trim();
        baseFields.business_name = formData.business_name?.trim() || null;
      }

      if (encryptedCreds) baseFields.credentials_encrypted = encryptedCreds;

      if (conn) {
        const { error } = await supabase.from("analytics_connections").update(baseFields).eq("id", conn.id);
        if (error) throw error;
        toast.success(`${provider === "GA4" ? "Google Analytics" : "Google Business Profile"} updated`);
      } else {
        const { error } = await supabase.from("analytics_connections").insert({
          ...baseFields,
          business_id: businessId,
          project_id: projectId,
          provider,
          auth_type: formData[jsonField]?.trim() ? "SERVICE_ACCOUNT" : "API_KEY",
          external_account_id: formData[requiredField]?.trim(),
        } as any);
        if (error) throw error;
        toast.success(`${provider === "GA4" ? "Google Analytics" : "Google Business Profile"} connected`);
      }

      setDialog(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (conn: AnalyticsConnection | null, label: string) => {
    if (!conn) return;
    await supabase.from("analytics_connections").update({ status: "disconnected", is_active: false, updated_at: new Date().toISOString() } as any).eq("id", conn.id);
    toast.success(`${label} disconnected`);
    fetchAll();
  };

  const handleTriggerSync = async (source: string) => {
    toast.info("Sync triggered — data will refresh within minutes");
    const fnName = source === "google_maps" ? "sync-google-maps" : "scheduled-analytics-sync";
    await supabase.functions.invoke(fnName, { body: { projectId } });
    setTimeout(fetchAll, 5000);
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  // ---------- GA dialog content ----------
  const gaDialogContent = (
    <div className="space-y-4">
      <div><Label>Account Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input placeholder="e.g. My Client Website" value={gaForm.account_name} onChange={e => setGaForm({ ...gaForm, account_name: e.target.value })} /></div>
      <div><Label>Property ID <span className="text-destructive">*</span></Label>
        <Input placeholder="e.g. 123456789" value={gaForm.property_id} onChange={e => setGaForm({ ...gaForm, property_id: e.target.value })} />
        <p className="text-xs text-muted-foreground mt-1">Found in GA4 → Admin → Property Settings</p></div>
      <div><Label>Measurement ID <span className="text-muted-foreground text-xs">(G-XXXX)</span></Label>
        <Input placeholder="e.g. G-ABC123DEF4" value={gaForm.measurement_id} onChange={e => setGaForm({ ...gaForm, measurement_id: e.target.value })} /></div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Service Account JSON <span className="text-xs text-primary">(recommended)</span></Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setGaShowJson(!gaShowJson)}>
            {gaShowJson ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}{gaShowJson ? "Hide" : "Show"}
          </Button>
        </div>
        <Textarea placeholder="Paste your service account JSON key here..." value={gaForm.service_account_json} onChange={e => setGaForm({ ...gaForm, service_account_json: e.target.value })} rows={gaShowJson ? 6 : 2} className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground mt-1">Create in Google Cloud Console → IAM → Service Accounts → Keys</p>
      </div>
      <div><Label>API Key <span className="text-muted-foreground text-xs">(optional fallback)</span></Label>
        <Input type="password" placeholder="Enter API key..." value={gaForm.api_key} onChange={e => setGaForm({ ...gaForm, api_key: e.target.value })} /></div>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>Credentials are encrypted before storage. Only backend sync functions can access them.</p>
      </div>
    </div>
  );

  // ---------- GBP dialog content ----------
  const gbpDialogContent = (
    <div className="space-y-4">
      <div><Label>Account Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input placeholder="e.g. My Business" value={gbpForm.account_name} onChange={e => setGbpForm({ ...gbpForm, account_name: e.target.value })} /></div>
      <div><Label>Location ID <span className="text-destructive">*</span></Label>
        <Input placeholder="e.g. accounts/123/locations/456" value={gbpForm.location_id} onChange={e => setGbpForm({ ...gbpForm, location_id: e.target.value })} />
        <p className="text-xs text-muted-foreground mt-1">Found in Google Business Profile Manager → Settings</p></div>
      <div><Label>Business Name <span className="text-muted-foreground text-xs">(auto or manual)</span></Label>
        <Input placeholder="e.g. Joe's Plumbing" value={gbpForm.business_name} onChange={e => setGbpForm({ ...gbpForm, business_name: e.target.value })} /></div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Service Account JSON <span className="text-xs text-primary">(recommended)</span></Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setGbpShowJson(!gbpShowJson)}>
            {gbpShowJson ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}{gbpShowJson ? "Hide" : "Show"}
          </Button>
        </div>
        <Textarea placeholder="Paste your service account JSON key here..." value={gbpForm.service_account_json} onChange={e => setGbpForm({ ...gbpForm, service_account_json: e.target.value })} rows={gbpShowJson ? 6 : 2} className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground mt-1">Must have Google Business Profile API enabled</p>
      </div>
      <div><Label>OAuth Token <span className="text-muted-foreground text-xs">(future-ready)</span></Label>
        <Input type="password" placeholder="Enter OAuth token..." value={gbpForm.oauth_token} onChange={e => setGbpForm({ ...gbpForm, oauth_token: e.target.value })} /></div>
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>Credentials are encrypted before storage. Only backend sync functions can access them.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Google Analytics */}
      <IntegrationCard
        provider="GA4"
        providerLabel="Google Analytics 4"
        description="Connect GA4 to track website performance metrics"
        icon={<svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M22.84 2.998v18.004c0 .554-.212 1.083-.592 1.474a1.988 1.988 0 01-1.43.608c-1.126 0-2.023-.93-2.023-2.082V2.998c0-1.152.897-2.082 2.023-2.082 1.125 0 2.022.93 2.022 2.082zM14.03 11.998v9.004c0 .554-.213 1.083-.593 1.474a1.988 1.988 0 01-1.43.608c-1.125 0-2.022-.93-2.022-2.082v-9.004c0-1.152.897-2.082 2.023-2.082 1.125 0 2.022.93 2.022 2.082zM5.2 19.92a2.08 2.08 0 11.001-4.161A2.08 2.08 0 015.2 19.92z" /></svg>}
        connection={gaConn}
        syncStatus={gaSync}
        idLabel="Property ID"
        idValue={gaConn?.property_id || null}
        extraFields={gaConn?.measurement_id ? [{ label: "Measurement ID", value: gaConn.measurement_id }] : undefined}
        onConnect={() => handleSave("GA4", gaConn, "property_id", "Property ID", gaForm, "service_account_json", "api_key", setGaSaving, setGaDialog)}
        onDisconnect={() => handleDisconnect(gaConn, "Google Analytics")}
        onTriggerSync={() => handleTriggerSync("google_analytics")}
        connectDialogContent={gaDialogContent}
        saving={gaSaving}
        dialogOpen={gaDialog}
        setDialogOpen={setGaDialog}
      />

      {/* Google Business Profile */}
      <IntegrationCard
        provider="GBP"
        providerLabel="Google Business Profile"
        description="Connect GBP to track local presence and customer actions"
        icon={<MapPin className="h-6 w-6 text-primary" />}
        connection={gbpConn}
        syncStatus={gbpSync}
        idLabel="Location ID"
        idValue={gbpConn?.location_id || null}
        extraFields={gbpConn?.business_name ? [{ label: "Business Name", value: gbpConn.business_name }] : undefined}
        onConnect={() => handleSave("GBP", gbpConn, "location_id", "Location ID", gbpForm, "service_account_json", "oauth_token", setGbpSaving, setGbpDialog)}
        onDisconnect={() => handleDisconnect(gbpConn, "Google Business Profile")}
        onTriggerSync={() => handleTriggerSync("google_maps")}
        connectDialogContent={gbpDialogContent}
        saving={gbpSaving}
        dialogOpen={gbpDialog}
        setDialogOpen={setGbpDialog}
      />

      {/* Future Integrations */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium mb-1">More Integrations Coming Soon</p>
          <p>Google Search Console · Google Ads · Facebook Ads · CRM Leads</p>
        </CardContent>
      </Card>
    </div>
  );
}
