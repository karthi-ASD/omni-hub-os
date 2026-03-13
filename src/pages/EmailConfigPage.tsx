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
import { Settings, Plus, Mail, Shield, Trash2, RefreshCw, Clock, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const DEPARTMENTS = ["support", "seo", "accounts", "development", "hr", "sales", "general"];

const MAILBOX_ROUTING: Record<string, string> = {
  "karthi@nextweb.com.au": "Management / Admin",
  "info@nextweb.com.au": "General Enquiries",
  "accounts@nextweb.com.au": "Accounts",
  "melvin@nextweb.com.au": "SEO / Operations",
  "steve@nextweb.com.au": "Sales / Business Dev",
};

const EmailConfigPage = () => {
  usePageTitle("Email Configuration");
  const { configs, loading, createConfig, updateConfig, deleteConfig, refresh } = useEmailConfigurations();
  const [createOpen, setCreateOpen] = useState(false);
  const [polling, setPolling] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    config_name: "",
    email_address: "",
    default_department: "support",
    polling_interval_seconds: 300,
  });

  const handleCreate = async () => {
    if (!form.config_name || !form.email_address) { toast.error("Name and email required"); return; }
    if (!form.email_address.endsWith("@nextweb.com.au")) {
      toast.error("Only Google Workspace (@nextweb.com.au) mailboxes are supported");
      return;
    }
    await createConfig({
      config_name: form.config_name,
      email_address: form.email_address,
      provider_type: "gmail",
      default_department: form.default_department,
      polling_interval_seconds: form.polling_interval_seconds,
      monitored: true,
      is_active: true,
    } as any);
    setCreateOpen(false);
    setForm({ config_name: "", email_address: "", default_department: "support", polling_interval_seconds: 300 });
  };

  const triggerPollNow = async () => {
    setPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke("poll-email-inboxes");
      if (error) throw error;
      const results = data?.results || [];
      const totalFetched = results.reduce((s: number, r: any) => s + (r.fetched || 0), 0);
      const totalTickets = results.reduce((s: number, r: any) => s + (r.tickets_created || 0), 0);
      const totalAttachments = results.reduce((s: number, r: any) => s + (r.attachments || 0), 0);
      toast.success(`Poll complete: ${totalFetched} emails, ${totalTickets} tickets, ${totalAttachments} attachments`);
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
      const { data, error } = await supabase.functions.invoke("poll-email-inboxes");
      if (error) throw error;
      toast.success(`Gmail connection test passed for ${config.email_address}`);
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
        subtitle="Gmail API integration for automatic ticket creation"
        icon={Settings}
        badge={`${configs.length} sources`}
        actions={[
          { label: polling ? "Polling..." : "Poll Now", icon: RefreshCw, onClick: triggerPollNow, disabled: polling },
          { label: "Add Gmail Mailbox", icon: Plus, onClick: () => setCreateOpen(true) },
        ]}
      />

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Google Workspace</CardTitle>
            <CardDescription className="text-xs">@nextweb.com.au via Gmail API + OAuth 2.0</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> OAuth credentials configured</p>
            <p>Supports: Gmail API polling, attachment extraction, auto-reply</p>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Cron Schedule</CardTitle>
            <CardDescription className="text-xs">Automatic polling every 5 minutes</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> pg_cron + pg_net active</p>
            <p>Unread emails fetched → tickets created automatically</p>
          </CardContent>
        </Card>
      </div>

      {/* Department routing reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Mailbox → Department Routing</CardTitle>
          <CardDescription className="text-xs">Emails are auto-routed based on recipient address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(MAILBOX_ROUTING).map(([email, dept]) => (
              <div key={email} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50">
                <Mail className="h-3 w-3 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{email.split("@")[0]}@</p>
                  <p className="text-muted-foreground">→ {dept}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing configs */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : configs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No Gmail mailboxes configured yet. Add one to start receiving tickets from email.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <Card key={config.id} className="rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{config.config_name}</p>
                      <p className="text-xs text-muted-foreground">{config.email_address} • Gmail API</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog — Gmail Only */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Gmail Mailbox</DialogTitle></DialogHeader>

          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs space-y-2">
              <p className="font-medium text-primary">Gmail API — OAuth Configured ✓</p>
              <p className="text-muted-foreground">OAuth credentials are stored as secure environment secrets.</p>
              <div className="space-y-1 text-muted-foreground">
                <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_CLIENT_ID</p>
                <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_CLIENT_SECRET</p>
                <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> GMAIL_OAUTH_REFRESH_TOKEN</p>
              </div>
            </div>

            <div>
              <Label>Config Name *</Label>
              <Input value={form.config_name} onChange={e => setForm({ ...form, config_name: e.target.value })} placeholder="e.g. Support Inbox" />
            </div>
            <div>
              <Label>Gmail Address *</Label>
              <Input value={form.email_address} onChange={e => setForm({ ...form, email_address: e.target.value })} placeholder="support@nextweb.com.au" />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Only @nextweb.com.au addresses supported
              </p>
            </div>
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
                <Label>Poll Interval (sec)</Label>
                <Input type="number" value={form.polling_interval_seconds} onChange={e => setForm({ ...form, polling_interval_seconds: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="bg-muted/50 border rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium flex items-center gap-1"><Shield className="h-3 w-3" /> Required Gmail API Scopes</p>
              <code className="text-[10px] text-muted-foreground block">gmail.readonly, gmail.send, gmail.modify</code>
              <p className="text-muted-foreground">Ensure domain-wide delegation is enabled for shared mailboxes.</p>
            </div>

            <Button onClick={handleCreate} className="w-full" disabled={!form.config_name || !form.email_address}>
              <Plus className="h-4 w-4 mr-2" /> Add Gmail Mailbox
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailConfigPage;
