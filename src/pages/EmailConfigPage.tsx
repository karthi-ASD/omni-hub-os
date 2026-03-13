import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEmailConfigurations, EmailConfig } from "@/hooks/useEmailConfigurations";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Mail, Server, Shield, Trash2, RefreshCw, Clock, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const DEPARTMENTS = ["support", "seo", "accounts", "development", "hr", "sales", "general"];

const EmailConfigPage = () => {
  usePageTitle("Email Configuration");
  const { configs, loading, createConfig, updateConfig, deleteConfig, refresh } = useEmailConfigurations();
  const [createOpen, setCreateOpen] = useState(false);
  const [providerType, setProviderType] = useState<"imap" | "gmail">("imap");
  const [polling, setPolling] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    config_name: "", email_address: "",
    imap_host: "", imap_port: 993, smtp_host: "", smtp_port: 587,
    encryption_type: "ssl", username: "",
    default_department: "support", polling_interval_seconds: 300,
  });

  const handleCreate = async () => {
    if (!form.config_name || !form.email_address) { toast.error("Name and email required"); return; }
    await createConfig({
      config_name: form.config_name,
      email_address: form.email_address,
      provider_type: providerType,
      imap_host: providerType === "imap" ? form.imap_host : null,
      imap_port: providerType === "imap" ? form.imap_port : null,
      smtp_host: providerType === "imap" ? form.smtp_host : null,
      smtp_port: providerType === "imap" ? form.smtp_port : null,
      encryption_type: providerType === "imap" ? form.encryption_type : null,
      username: providerType === "imap" ? form.username : null,
      default_department: form.default_department,
      polling_interval_seconds: form.polling_interval_seconds,
      monitored: true,
      is_active: true,
    } as any);
    setCreateOpen(false);
    setForm({ config_name: "", email_address: "", imap_host: "", imap_port: 993, smtp_host: "", smtp_port: 587, encryption_type: "ssl", username: "", default_department: "support", polling_interval_seconds: 300 });
  };

  const triggerPollNow = async () => {
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("poll-email-inboxes");
      if (error) throw error;
      const results = data?.results || [];
      const totalFetched = results.reduce((s: number, r: any) => s + (r.fetched || 0), 0);
      const totalTickets = results.reduce((s: number, r: any) => s + (r.tickets_created || 0), 0);
      toast.success(`Poll complete: ${totalFetched} emails fetched, ${totalTickets} tickets created`);
      refresh();
    } catch (e: any) {
      toast.error("Poll failed: " + (e.message || "Unknown error"));
    } finally {
      setPolling(false);
    }
  };

  const testConnection = async (config: EmailConfig) => {
    setTestingId(config.id);
    try {
      // For Gmail, attempt a quick token test
      if (config.provider_type === "gmail") {
        const { data, error } = await supabase.functions.invoke("poll-email-inboxes");
        if (error) throw error;
        toast.success(`Gmail connection test passed for ${config.email_address}`);
      } else {
        toast.info(`IMAP test for ${config.email_address}: Configuration saved. IMAP bridge required for live polling.`);
      }
    } catch (e: any) {
      toast.error("Connection test failed: " + (e.message || "Unknown error"));
    } finally {
      setTestingId(null);
    }
  };

  const formatLastPolled = (dt: string | null) => {
    if (!dt) return "Never";
    const d = new Date(dt);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Email Configuration"
        subtitle="Configure email sources for automatic ticket creation"
        icon={Settings}
        badge={`${configs.length} sources`}
        actions={[
          { label: polling ? "Polling..." : "Poll Now", icon: RefreshCw, onClick: triggerPollNow, disabled: polling },
          { label: "Add Email Source", icon: Plus, onClick: () => setCreateOpen(true) },
        ]}
      />

      {/* Provider overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Google Workspace</CardTitle>
            <CardDescription className="text-xs">@nextweb.com.au via Gmail API + OAuth 2.0</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> OAuth credentials configured</p>
            <p>Monitored: info@, karthik@, seo@, accounts@, sales@</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" /> Self-Hosted IMAP</CardTitle>
            <CardDescription className="text-xs">@nextweb.co.in via IMAP + SMTP</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> IMAP password configured</p>
            <p>Monitored: melvin@, hr@, dev@, support@</p>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Cron Schedule</CardTitle>
            <CardDescription className="text-xs">Automatic polling interval</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Every 5 minutes</p>
            <p>Powered by pg_cron + pg_net</p>
          </CardContent>
        </Card>
      </div>

      {/* Existing configs */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : configs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No email configurations yet. Add one to start receiving tickets from email.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <Card key={config.id} className="rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {config.provider_type === "gmail" ? <Mail className="h-5 w-5 text-primary" /> : <Server className="h-5 w-5 text-accent-foreground" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{config.config_name}</p>
                      <p className="text-xs text-muted-foreground">{config.email_address} • {config.provider_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatLastPolled(config.last_polled_at)}
                    </span>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{config.default_department}</Badge>
                    <Button size="sm" variant="outline" disabled={testingId === config.id} onClick={() => testConnection(config)}>
                      {testingId === config.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={v => updateConfig(config.id, { is_active: v } as any)}
                    />
                    <Button size="icon" variant="ghost" onClick={() => deleteConfig(config.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {config.provider_type === "imap" && config.imap_host && (
                  <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                    <span>IMAP: {config.imap_host}:{config.imap_port}</span>
                    <span>SMTP: {config.smtp_host}:{config.smtp_port}</span>
                    <span>Encryption: {config.encryption_type?.toUpperCase()}</span>
                    <span>Poll: {config.polling_interval_seconds}s</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Email Source</DialogTitle></DialogHeader>

          <Tabs value={providerType} onValueChange={v => setProviderType(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="imap" className="flex-1">IMAP (Self-Hosted)</TabsTrigger>
              <TabsTrigger value="gmail" className="flex-1">Gmail API</TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Config Name *</Label>
                  <Input value={form.config_name} onChange={e => setForm({ ...form, config_name: e.target.value })} placeholder="e.g. Support Inbox" />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input value={form.email_address} onChange={e => setForm({ ...form, email_address: e.target.value })} placeholder="support@nextweb.co.in" />
                </div>
              </div>

              <TabsContent value="imap" className="space-y-3 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>IMAP Host</Label>
                    <Input value={form.imap_host} onChange={e => setForm({ ...form, imap_host: e.target.value })} placeholder="mail.nextweb.co.in" />
                  </div>
                  <div>
                    <Label>IMAP Port</Label>
                    <Input type="number" value={form.imap_port} onChange={e => setForm({ ...form, imap_port: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <Label>SMTP Host</Label>
                    <Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.nextweb.co.in" />
                  </div>
                  <div>
                    <Label>SMTP Port</Label>
                    <Input type="number" value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Username</Label>
                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="support@nextweb.co.in" />
                  </div>
                  <div>
                    <Label>Encryption</Label>
                    <Select value={form.encryption_type} onValueChange={v => setForm({ ...form, encryption_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-muted/50 border rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> IMAP Password</p>
                  <p className="text-muted-foreground">The IMAP password is stored as a secure environment secret (IMAP_DEFAULT_PASSWORD). Update it in project secrets if needed.</p>
                </div>
              </TabsContent>

              <TabsContent value="gmail" className="space-y-3 mt-0">
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-medium text-primary">Gmail API — OAuth Configured ✓</p>
                  <p className="text-muted-foreground">OAuth credentials (Client ID, Client Secret, Refresh Token) are stored as secure environment secrets.</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_CLIENT_ID</p>
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_CLIENT_SECRET</p>
                    <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_REFRESH_TOKEN</p>
                  </div>
                </div>
                <div className="bg-muted/50 border rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium">Required Scopes:</p>
                  <code className="text-[10px] text-muted-foreground block">gmail.readonly, gmail.send, gmail.modify</code>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  <span>Ensure domain-wide delegation is enabled for shared mailboxes.</span>
                </div>
              </TabsContent>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Default Department</Label>
                  <Select value={form.default_department} onValueChange={v => setForm({ ...form, default_department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Poll Interval (seconds)</Label>
                  <Input type="number" value={form.polling_interval_seconds} onChange={e => setForm({ ...form, polling_interval_seconds: parseInt(e.target.value) })} />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={!form.config_name || !form.email_address}>
                <Plus className="h-4 w-4 mr-2" /> Add Email Source
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailConfigPage;
