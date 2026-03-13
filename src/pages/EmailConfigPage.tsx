import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEmailConfigurations, EmailConfig } from "@/hooks/useEmailConfigurations";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Mail, Server, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["support", "seo", "accounts", "development", "hr", "sales", "general"];

const EmailConfigPage = () => {
  usePageTitle("Email Configuration");
  const { configs, loading, createConfig, updateConfig, deleteConfig } = useEmailConfigurations();
  const [createOpen, setCreateOpen] = useState(false);
  const [providerType, setProviderType] = useState<"imap" | "gmail">("imap");

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Email Configuration"
        subtitle="Configure email sources for automatic ticket creation"
        icon={Settings}
        badge={`${configs.length}`}
        actions={[{ label: "Add Email Source", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Google Workspace</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>For @nextweb.com.au accounts using Gmail API with OAuth 2.0.</p>
            <p>Requires: Google Cloud Project, Gmail API enabled, OAuth credentials.</p>
            <p className="text-primary font-medium">Monitored: info@, karthik@, seo@, accounts@, sales@</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" /> Self-Hosted IMAP</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>For @nextweb.co.in accounts using IMAP + SMTP.</p>
            <p>Requires: IMAP host, port, credentials, SMTP details.</p>
            <p className="text-accent-foreground font-medium">Monitored: melvin@, hr@, dev@, support@</p>
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
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {config.provider_type === "gmail" ? <Mail className="h-5 w-5 text-primary" /> : <Server className="h-5 w-5 text-accent-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{config.config_name}</p>
                    <p className="text-xs text-muted-foreground">{config.email_address} • {config.provider_type.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{config.default_department}</Badge>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={v => updateConfig(config.id, { is_active: v } as any)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => deleteConfig(config.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Password will be stored securely as a secret.
                </p>
              </TabsContent>

              <TabsContent value="gmail" className="space-y-3 mt-0">
                <p className="text-xs text-muted-foreground">
                  Gmail API integration requires a Google Cloud Project with Gmail API enabled.
                  OAuth credentials will be configured separately.
                </p>
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-primary">Required Setup:</p>
                  <p>1. Create a Google Cloud Project</p>
                  <p>2. Enable Gmail API</p>
                  <p>3. Create OAuth 2.0 credentials</p>
                  <p>4. Set redirect URI to your app URL</p>
                  <p>5. Add scopes: gmail.readonly, gmail.send, gmail.modify</p>
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
