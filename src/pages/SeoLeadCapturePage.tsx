import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Phone, Mail, MessageSquare, Globe, Settings, Users,
  Plus, Trash2, GripVertical, Copy, Check, ArrowLeft, Zap, TrendingUp,
  PhoneCall, FileText, Eye, ArrowUpRight, ArrowDownRight, Rocket, Send,
  Link2, Wifi, WifiOff, ShieldCheck
} from "lucide-react";

// ─── Types ───
interface SeoProject {
  id: string;
  project_name: string;
  website_domain: string;
  client_id: string;
  api_key?: string;
  clients?: { contact_name: string; phone: string; email: string; whatsapp_number?: string } | null;
}

interface LeadForm {
  id: string;
  form_name: string;
  is_active: boolean;
  seo_project_id: string;
}

interface AutomationSettings {
  id?: string;
  seo_project_id: string;
  whatsapp_number: string;
  whatsapp_connected: boolean;
  enable_email: boolean;
  enable_whatsapp: boolean;
  enable_call: boolean;
  enable_acknowledgment: boolean;
}

interface CapturedLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  status: string;
  page_url: string;
  created_at: string;
}

// ─── Main Page ───
export default function SeoLeadCapturePage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SeoProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.business_id) fetchProjects();
  }, [profile?.business_id]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("seo_projects")
      .select("id, project_name, website_domain, client_id, api_key, clients(contact_name, phone, email, whatsapp_number)")
      .eq("business_id", profile!.business_id!)
      .eq("project_status", "active")
      .order("project_name");
    setProjects((data as any) || []);
    setLoading(false);
  };

  if (selectedProject) {
    return (
      <ClientDashboard
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        businessId={profile!.business_id!}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lead Capture & Automation</h1>
        <p className="text-muted-foreground">Manage forms, call tracking, and automations per SEO client</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6 space-y-2">
              <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" />
            </CardContent></Card>
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Rocket className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold">No Active SEO Projects</h3>
            <p className="text-sm text-muted-foreground mt-1">Create an SEO project first to start capturing leads.</p>
          </div>
        ) : (
          projects.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedProject(p)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.project_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{p.website_domain || "No domain"}</div>
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{(p.clients as any)?.contact_name || "No client"}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Client Dashboard ───
function ClientDashboard({ project, onBack, businessId }: { project: SeoProject; onBack: () => void; businessId: string }) {
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [tab, setTab] = useState("overview");
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel(`seo-leads-${project.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "seo_captured_leads", filter: `seo_project_id=eq.${project.id}` }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id]);

  const fetchAll = () => { fetchLeads(); fetchForms(); fetchSettings(); };

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("seo_captured_leads")
      .select("*")
      .eq("seo_project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setLeads((data as any) || []);
    setLoadingLeads(false);
  };

  const fetchForms = async () => {
    const { data } = await supabase.from("seo_lead_forms").select("*").eq("seo_project_id", project.id);
    setForms((data as any) || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("seo_automation_settings").select("*").eq("seo_project_id", project.id).maybeSingle();
    if (data) {
      setSettings(data as any);
    } else {
      const { data: created } = await supabase.from("seo_automation_settings").insert({
        business_id: businessId,
        seo_project_id: project.id,
        client_id: project.client_id,
        enable_email: false,
        enable_whatsapp: false,
        enable_call: false,
        enable_acknowledgment: false,
      } as any).select().single();
      setSettings(created as any || { seo_project_id: project.id, whatsapp_number: "", whatsapp_connected: false, enable_email: false, enable_whatsapp: false, enable_call: false, enable_acknowledgment: false });
    }
  };

  const client = project.clients as any;
  const formLeads = leads.filter(l => l.source === "form").length;
  const callLeads = leads.filter(l => l.source === "call_click").length;
  const apiLeads = leads.filter(l => l.source === "api").length;
  const lastLead = leads[0]?.created_at;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-bold">{project.project_name}</h1>
          <p className="text-sm text-muted-foreground">{client?.contact_name} • {project.website_domain}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><Eye className="h-3.5 w-3.5 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="forms"><FileText className="h-3.5 w-3.5 mr-1" />Form Builder</TabsTrigger>
          <TabsTrigger value="api"><Globe className="h-3.5 w-3.5 mr-1" />API & Tracking</TabsTrigger>
          <TabsTrigger value="automation"><Zap className="h-3.5 w-3.5 mr-1" />Automation</TabsTrigger>
          <TabsTrigger value="leads"><Users className="h-3.5 w-3.5 mr-1" />Leads</TabsTrigger>
          <TabsTrigger value="reports"><BarChart3 className="h-3.5 w-3.5 mr-1" />Reports</TabsTrigger>
          <TabsTrigger value="integrations"><Link2 className="h-3.5 w-3.5 mr-1" />Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab project={project} client={client} settings={settings} leads={leads} formLeads={formLeads} callLeads={callLeads} lastLead={lastLead} loading={loadingLeads} />
        </TabsContent>
        <TabsContent value="forms">
          <FormBuilderTab project={project} businessId={businessId} forms={forms} onRefresh={fetchForms} />
        </TabsContent>
        <TabsContent value="api">
          <ApiTrackingTab project={project} />
        </TabsContent>
        <TabsContent value="automation">
          <AutomationTab project={project} businessId={businessId} settings={settings} onRefresh={fetchSettings} />
        </TabsContent>
        <TabsContent value="leads">
          <LeadsTab leads={leads} loading={loadingLeads} />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab leads={leads} formLeads={formLeads} callLeads={callLeads} apiLeads={apiLeads} />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab({ project, client, settings, leads, formLeads, callLeads, lastLead, loading }: any) {
  if (loading) return <div className="grid gap-4 md:grid-cols-4 mt-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
      <Card><CardContent className="pt-6 text-center">
        <div className="text-3xl font-bold text-primary">{leads.length}</div>
        <p className="text-sm text-muted-foreground">Total Leads</p>
      </CardContent></Card>
      <Card><CardContent className="pt-6 text-center">
        <div className="text-3xl font-bold text-chart-1">{formLeads}</div>
        <p className="text-sm text-muted-foreground">Form Leads</p>
      </CardContent></Card>
      <Card><CardContent className="pt-6 text-center">
        <div className="text-3xl font-bold text-chart-2">{callLeads}</div>
        <p className="text-sm text-muted-foreground">Call Clicks</p>
      </CardContent></Card>
      <Card><CardContent className="pt-6 text-center">
        <div className="text-sm font-medium">{lastLead ? new Date(lastLead).toLocaleDateString() : "—"}</div>
        <p className="text-sm text-muted-foreground">Last Lead</p>
      </CardContent></Card>

      <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">Client Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Website:</span> {project.website_domain}</div>
          <div><span className="text-muted-foreground">Phone:</span> {client?.phone || "—"}</div>
          <div><span className="text-muted-foreground">Email:</span> {client?.email || "—"}</div>
          <div><span className="text-muted-foreground">WhatsApp:</span> {settings?.whatsapp_number || "—"}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">Automation Status</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Email</span><Badge variant={settings?.enable_email ? "default" : "secondary"}>{settings?.enable_email ? "ON" : "OFF"}</Badge></div>
          <div className="flex justify-between"><span>WhatsApp</span><Badge variant={settings?.enable_whatsapp && settings?.whatsapp_connected ? "default" : "secondary"}>{settings?.enable_whatsapp && settings?.whatsapp_connected ? "ON" : "OFF"}</Badge></div>
          <div className="flex justify-between"><span>Call</span><Badge variant={settings?.enable_call ? "default" : "secondary"}>{settings?.enable_call ? "ON" : "OFF"}</Badge></div>
          <div className="flex justify-between"><span>Acknowledgment</span><Badge variant={settings?.enable_acknowledgment ? "default" : "secondary"}>{settings?.enable_acknowledgment ? "ON" : "OFF"}</Badge></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Form Builder Tab ───
function FormBuilderTab({ project, businessId, forms, onRefresh }: { project: SeoProject; businessId: string; forms: LeadForm[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("Contact Form");
  const [copied, setCopied] = useState<string | null>(null);
  const [fields, setFields] = useState<Array<{ label: string; type: string; required: boolean }>>([
    { label: "Name", type: "text", required: true },
    { label: "Email", type: "email", required: true },
    { label: "Phone", type: "phone", required: false },
    { label: "Message", type: "textarea", required: false },
  ]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const formEndpoint = `${supabaseUrl}/functions/v1/seo-lead-capture`;

  const addField = () => setFields([...fields, { label: "", type: "text", required: false }]);
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const saveForm = async () => {
    setCreating(true);
    const { data: form, error } = await supabase.from("seo_lead_forms").insert({
      business_id: businessId,
      seo_project_id: project.id,
      client_id: project.client_id,
      form_name: formName,
    } as any).select().single();

    if (error || !form) { toast({ title: "Error", description: error?.message, variant: "destructive" }); setCreating(false); return; }

    const fieldRows = fields.map((f, i) => ({
      form_id: (form as any).id,
      field_label: f.label,
      field_type: f.type,
      is_required: f.required,
      sort_order: i,
    }));

    await supabase.from("seo_lead_form_fields").insert(fieldRows as any);
    toast({ title: "Form saved successfully" });
    setCreating(false);
    onRefresh();
  };

  const getFormPayload = (formId: string) => JSON.stringify({
    form_id: formId,
    project_id: project.id,
    name: "",
    email: "",
    phone: "",
    message: ""
  }, null, 2);

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Create New Form</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Form Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Fields</Label>
            {fields.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input value={f.label} onChange={e => { const n = [...fields]; n[i].label = e.target.value; setFields(n); }} placeholder="Field label" className="flex-1" />
                <Select value={f.type} onValueChange={v => { const n = [...fields]; n[i].type = v; setFields(n); }}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.required} onChange={e => { const n = [...fields]; n[i].required = e.target.checked; setFields(n); }} />Req</label>
                <Button variant="ghost" size="icon" onClick={() => removeField(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addField}><Plus className="h-3.5 w-3.5 mr-1" />Add Field</Button>
          </div>
          <Button onClick={saveForm} disabled={creating}>{creating ? "Saving…" : "Save Form"}</Button>
        </CardContent>
      </Card>

      {forms.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Existing Forms — API Integration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {forms.map(f => (
              <div key={f.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{f.form_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">Form ID: {f.id}</p>
                  </div>
                  <Badge variant={f.is_active ? "default" : "secondary"}>{f.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <div>
                  <Label className="text-xs">API Endpoint</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{formEndpoint}</code>
                    <Button variant="outline" size="sm" onClick={() => copyText(formEndpoint, `api-${f.id}`)}>
                      {copied === `api-${f.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Payload</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">{getFormPayload(f.id)}</pre>
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => copyText(getFormPayload(f.id), `payload-${f.id}`)}>
                    {copied === `payload-${f.id}` ? <><Check className="h-3.5 w-3.5 mr-1" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" />Copy Payload</>}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── API & Tracking Tab ───
function ApiTrackingTab({ project }: { project: SeoProject }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";

  const formEndpoint = `${supabaseUrl}/functions/v1/seo-lead-capture`;
  const callEndpoint = `${supabaseUrl}/functions/v1/seo-call-click`;

  const formPayload = JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    phone: "0412345678",
    message: "I need SEO help",
    project_id: project.id,
    source: "form"
  }, null, 2);

  const callTrackingSnippet = `<script>
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    fetch('${callEndpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: '${project.id}',
        source: 'call_click',
        page_url: window.location.href
      })
    });
  });
});
</script>`;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendTestLead = async () => {
    setTesting(true);
    try {
      const res = await fetch(formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Lead",
          email: `test-${Date.now()}@example.com`,
          phone: "0400000000",
          message: "This is a test lead from the dashboard",
          project_id: project.id,
          source: "form",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ Test lead created", description: `Lead ID: ${data.lead_id}` });
      } else {
        toast({ title: "Test failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Test failed", description: String(e), variant: "destructive" });
    }
    setTesting(false);
  };

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" />Form API Endpoint</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded">{formEndpoint}</code>
            <Button variant="outline" size="sm" onClick={() => copyText(formEndpoint, "form-url")}>
              {copied === "form-url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div>
            <Label className="text-xs">Payload Format</Label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">{formPayload}</pre>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => copyText(formPayload, "form-payload")}>
                {copied === "form-payload" ? <><Check className="h-3.5 w-3.5 mr-1" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" />Copy Payload</>}
              </Button>
              <Button size="sm" onClick={sendTestLead} disabled={testing}>
                <Send className="h-3.5 w-3.5 mr-1" />{testing ? "Sending…" : "Send Test Lead"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PhoneCall className="h-4 w-4" />Call Click Tracking</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded">{callEndpoint}</code>
            <Button variant="outline" size="sm" onClick={() => copyText(callEndpoint, "call-url")}>
              {copied === "call-url" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div>
            <Label className="text-xs">Embed This Script On Client Website</Label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-48">{callTrackingSnippet}</pre>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => copyText(callTrackingSnippet, "call-snippet")}>
              {copied === "call-snippet" ? <><Check className="h-3.5 w-3.5 mr-1" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" />Copy Snippet</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Automation Tab (Admin-level WhatsApp control) ───
function AutomationTab({ project, businessId, settings, onRefresh }: { project: SeoProject; businessId: string; settings: AutomationSettings | null; onRefresh: () => void }) {
  const { toast } = useToast();
  const [local, setLocal] = useState<AutomationSettings>(settings || {
    seo_project_id: project.id, whatsapp_number: "", whatsapp_connected: false,
    enable_email: false, enable_whatsapp: false, enable_call: false, enable_acknowledgment: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocal(settings);
  }, [settings]);

  const save = async () => {
    if (local.whatsapp_number && !local.whatsapp_number.startsWith("+")) {
      toast({ title: "Invalid WhatsApp number", description: "Number must start with + (e.g., +61412345678)", variant: "destructive" });
      return;
    }

    // WhatsApp automation requires connection
    if (local.enable_whatsapp && !local.whatsapp_connected) {
      toast({ title: "WhatsApp not connected", description: "Connect WhatsApp first before enabling automation", variant: "destructive" });
      return;
    }

    if (local.enable_whatsapp && !local.whatsapp_number) {
      toast({ title: "WhatsApp number required", description: "Enter a WhatsApp number before enabling automation", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      business_id: businessId,
      seo_project_id: project.id,
      client_id: project.client_id,
      whatsapp_number: local.whatsapp_number,
      whatsapp_connected: local.whatsapp_connected,
      enable_email: local.enable_email,
      enable_whatsapp: local.enable_whatsapp,
      enable_call: local.enable_call,
      enable_acknowledgment: local.enable_acknowledgment,
    };

    if (local.id) {
      await supabase.from("seo_automation_settings").update(payload as any).eq("id", local.id);
    } else {
      await supabase.from("seo_automation_settings").insert(payload as any);
    }
    toast({ title: "Settings saved" });
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />WhatsApp Integration
            <Badge variant="outline" className="ml-auto text-xs">Admin Control</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>WhatsApp Number</Label>
            <Input value={local.whatsapp_number} onChange={e => setLocal({ ...local, whatsapp_number: e.target.value })} placeholder="+61412345678" />
            <p className="text-xs text-muted-foreground mt-1">Must include country code (e.g., +61). Only admin/SEO staff can edit this.</p>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Switch checked={local.whatsapp_connected} onCheckedChange={v => setLocal({ ...local, whatsapp_connected: v, enable_whatsapp: v ? local.enable_whatsapp : false })} />
            <div className="flex-1">
              <p className="text-sm font-medium">Connection Status</p>
              <p className="text-xs text-muted-foreground">Mark as connected when WhatsApp Business API is configured</p>
            </div>
            <Badge variant={local.whatsapp_connected ? "default" : "secondary"} className="gap-1">
              {local.whatsapp_connected ? <><Wifi className="h-3 w-3" />Connected</> : <><WifiOff className="h-3 w-3" />Not Connected</>}
            </Badge>
          </div>
          {!local.whatsapp_connected && local.enable_whatsapp && (
            <p className="text-xs text-destructive">⚠️ WhatsApp automation is enabled but not connected. Messages will not be sent.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />Automation Toggles</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            { key: "enable_email", label: "Automated Email", icon: Mail, desc: "Send email on new lead" },
            { key: "enable_whatsapp", label: "WhatsApp Automation", icon: MessageSquare, desc: "Send WhatsApp on new lead (requires connection)", disabled: !local.whatsapp_connected },
            { key: "enable_call", label: "Automated Call", icon: Phone, desc: "Trigger call flow on new lead" },
            { key: "enable_acknowledgment", label: "Lead Acknowledgment", icon: Check, desc: "Send acknowledgment to lead" },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={(local as any)[item.key]}
                onCheckedChange={v => setLocal({ ...local, [item.key]: v })}
                disabled={'disabled' in item && item.disabled}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
    </div>
  );
}

// ─── Leads Tab ───
function LeadsTab({ leads, loading }: { leads: CapturedLead[]; loading: boolean }) {
  const sourceConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
    form: { label: "📝 Form", variant: "default", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
    call_click: { label: "📞 Call Click", variant: "outline", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
    api: { label: "🔗 API", variant: "secondary", className: "bg-chart-2/10 text-chart-2 border-chart-2/20" },
  };

  if (loading) return <div className="mt-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="mt-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Captured Leads ({leads.length})</CardTitle></CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold">Your campaign is getting started</h3>
              <p className="text-sm text-muted-foreground mt-1">Leads will appear here once users interact with your website.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {leads.map(lead => {
                const src = sourceConfig[lead.source] || sourceConfig.form;
                return (
                  <div key={lead.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{lead.name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{lead.email} • {lead.phone}</p>
                      {lead.message && <p className="text-xs text-muted-foreground truncate max-w-md">{lead.message}</p>}
                      {lead.page_url && <p className="text-xs text-muted-foreground">{lead.page_url}</p>}
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={src.variant} className={`text-xs ${src.className}`}>{src.label}</Badge>
                      <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reports Tab ───
function ReportsTab({ leads, formLeads, callLeads, apiLeads }: { leads: CapturedLead[]; formLeads: number; callLeads: number; apiLeads: number }) {
  const now = Date.now();
  const todayLeads = leads.filter(l => new Date(l.created_at) > new Date(now - 86400000)).length;
  const last7 = leads.filter(l => new Date(l.created_at) > new Date(now - 7 * 86400000)).length;
  const last30 = leads.filter(l => new Date(l.created_at) > new Date(now - 30 * 86400000)).length;
  const prev30 = leads.filter(l => {
    const d = new Date(l.created_at).getTime();
    return d > now - 60 * 86400000 && d <= now - 30 * 86400000;
  }).length;
  const growth = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : last30 > 0 ? 100 : 0;

  const lastApiHit = leads[0]?.created_at;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{todayLeads}</div>
          <p className="text-xs text-muted-foreground">Today</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{last7}</div>
          <p className="text-xs text-muted-foreground">Last 7 Days</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{last30}</div>
          <p className="text-xs text-muted-foreground">Last 30 Days</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{leads.length}</div>
          <p className="text-xs text-muted-foreground">All Time</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${growth >= 0 ? "text-chart-2" : "text-destructive"}`}>
            {growth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {Math.abs(growth)}%
          </div>
          <p className="text-xs text-muted-foreground">Monthly Growth</p>
        </CardContent></Card>
      </div>

      {lastApiHit && (
        <div className="text-xs text-muted-foreground">Last API hit: {new Date(lastApiHit).toLocaleString()}</div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Lead Sources Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Form Submissions", count: formLeads, color: "bg-chart-1" },
              { label: "Call Clicks", count: callLeads, color: "bg-chart-2" },
              { label: "API / External", count: apiLeads, color: "bg-chart-4" },
            ].map(src => (
              <div key={src.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{src.label}</span>
                  <span className="font-bold text-sm">{src.count} ({leads.length ? Math.round((src.count / leads.length) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`${src.color} h-2 rounded-full transition-all`} style={{ width: `${leads.length ? (src.count / leads.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Integrations Tab (GA4 + GBP status per client) ───
function IntegrationsTab({ project }: { project: SeoProject }) {
  const [connections, setConnections] = useState<any[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, [project.id]);

  const fetchIntegrations = async () => {
    setLoading(true);
    const [connRes, syncRes] = await Promise.all([
      supabase
        .from("analytics_connections")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("analytics_sync_status")
        .select("*")
        .eq("project_id", project.id)
        .order("last_sync_at", { ascending: false }),
    ]);
    setConnections((connRes.data as any) || []);
    setSyncStatuses((syncRes.data as any) || []);
    setLoading(false);
  };

  const ga4Conn = connections.find((c: any) => c.provider === "GA4");
  const gbpConn = connections.find((c: any) => c.provider === "GBP");
  const ga4Sync = syncStatuses.find((s: any) => s.source === "google_analytics");
  const gbpSync = syncStatuses.find((s: any) => s.source === "google_maps");

  if (loading) return <div className="mt-4 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      {/* GA4 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Google Analytics (GA4)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={ga4Conn?.is_active ? "default" : "secondary"} className="gap-1">
              {ga4Conn?.is_active ? <><Wifi className="h-3 w-3" />Connected</> : <><WifiOff className="h-3 w-3" />Not Connected</>}
            </Badge>
          </div>
          {ga4Conn && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Property / Account</span>
                <span className="text-sm font-mono">{ga4Conn.external_account_id || "—"}</span>
              </div>
              {ga4Conn.location_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Property ID</span>
                  <span className="text-sm font-mono">{ga4Conn.location_id}</span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Sync</span>
            <span className="text-sm">{ga4Sync?.last_sync_at ? new Date(ga4Sync.last_sync_at).toLocaleString() : "Never"}</span>
          </div>
          {ga4Sync?.sync_status === "error" && (
            <p className="text-xs text-destructive">⚠️ {ga4Sync.error_message || "Sync error"}</p>
          )}
          {!ga4Conn && (
            <p className="text-xs text-muted-foreground mt-2">GA4 has not been connected for this project. Configure it from the Integrations Overview.</p>
          )}
        </CardContent>
      </Card>

      {/* GBP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Google Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={gbpConn?.is_active ? "default" : "secondary"} className="gap-1">
              {gbpConn?.is_active ? <><Wifi className="h-3 w-3" />Connected</> : <><WifiOff className="h-3 w-3" />Not Connected</>}
            </Badge>
          </div>
          {gbpConn && (
            <>
              {gbpConn.location_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-mono text-right max-w-[200px] truncate">{gbpConn.location_id}</span>
                </div>
              )}
              {gbpConn.external_account_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account ID</span>
                  <span className="text-sm font-mono">{gbpConn.external_account_id}</span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Sync</span>
            <span className="text-sm">{gbpSync?.last_sync_at ? new Date(gbpSync.last_sync_at).toLocaleString() : "Never"}</span>
          </div>
          {gbpSync?.sync_status === "error" && (
            <p className="text-xs text-destructive">⚠️ {gbpSync.error_message || "Sync error"}</p>
          )}
          {!gbpConn && (
            <p className="text-xs text-muted-foreground mt-2">Google Business Profile has not been connected for this project. Configure it from the Integrations Overview.</p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Integration Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{connections.filter((c: any) => c.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Active Connections</p>
            </div>
            <div>
              <div className="text-lg font-bold">{connections.length}</div>
              <p className="text-xs text-muted-foreground">Total Connections</p>
            </div>
            <div>
              <div className="text-lg font-bold">{syncStatuses.filter((s: any) => s.sync_status === "synced").length}</div>
              <p className="text-xs text-muted-foreground">Synced</p>
            </div>
            <div>
              <div className="text-lg font-bold text-destructive">{syncStatuses.filter((s: any) => s.sync_status === "error").length}</div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
