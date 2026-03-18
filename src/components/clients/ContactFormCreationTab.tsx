import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Code, Settings, FormInput, Trash2, GripVertical, Copy, Check, Send,
  AlertTriangle, CheckCircle2, Shield
} from "lucide-react";
import { toast } from "sonner";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface LeadForm {
  id: string;
  form_name: string;
  is_active: boolean;
  fields_json: FormField[];
  success_message: string;
  redirect_url: string | null;
  seo_project_id: string;
  created_at: string;
}

interface ContactFormCreationTabProps {
  clientId: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true },
  { name: "email", label: "Email", type: "email", required: false },
  { name: "message", label: "Message", type: "textarea", required: false },
];

export const ContactFormCreationTab = ({ clientId }: ContactFormCreationTabProps) => {
  const { profile, roles } = useAuth();
  const { departmentName } = useEmployeeDepartment();

  const deptLower = (departmentName || "").toLowerCase();
  const isSeoDept = deptLower.includes("seo") || deptLower.includes("marketing") || deptLower.includes("digital");
  const isAdmin = roles.some(r => ["super_admin", "business_admin"].includes(r));
  const canEdit = isAdmin || isSeoDept;

  const [forms, setForms] = useState<LeadForm[]>([]);
  const [projects, setProjects] = useState<{ id: string; project_name: string; api_key: string; website_domain: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState<LeadForm | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // New form state
  const [newFormName, setNewFormName] = useState("Contact Form");
  const [newFields, setNewFields] = useState<FormField[]>([...DEFAULT_FIELDS]);
  const [newSuccessMsg, setNewSuccessMsg] = useState("Thank you! We will get back to you shortly.");
  const [newRedirect, setNewRedirect] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const [formsRes, projRes] = await Promise.all([
      supabase
        .from("seo_lead_forms")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("seo_projects")
        .select("id, project_name, api_key, website_domain")
        .eq("client_id", clientId),
    ]);

    setForms((formsRes.data as any) || []);
    setProjects((projRes.data as any) || []);
    if (projRes.data && projRes.data.length > 0 && !selectedProjectId) {
      setSelectedProjectId((projRes.data as any)[0].id);
    }
    setLoading(false);
  }, [clientId, profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!profile?.business_id || !selectedProjectId) {
      toast.error("Please select an SEO project first");
      return;
    }

    const phoneField = newFields.find(f => f.name === "phone");
    if (!phoneField || !phoneField.required) {
      toast.error("Phone field must be required");
      return;
    }

    const { error } = await supabase.from("seo_lead_forms").insert({
      business_id: profile.business_id,
      client_id: clientId,
      seo_project_id: selectedProjectId,
      form_name: newFormName,
      fields_json: newFields,
      success_message: newSuccessMsg,
      redirect_url: newRedirect || null,
      is_active: true,
      created_by: profile.user_id,
    } as any);

    if (error) {
      toast.error("Failed to create form");
      console.error(error);
      return;
    }

    toast.success("Contact form created");
    setCreateOpen(false);
    setNewFormName("Contact Form");
    setNewFields([...DEFAULT_FIELDS]);
    setNewSuccessMsg("Thank you! We will get back to you shortly.");
    setNewRedirect("");
    fetchData();
  };

  const toggleFormActive = async (formId: string, isActive: boolean) => {
    await supabase.from("seo_lead_forms").update({ is_active: !isActive } as any).eq("id", formId);
    fetchData();
  };

  const toggleFieldRequired = (index: number) => {
    if (newFields[index].name === "phone") return; // Phone always required
    const updated = [...newFields];
    updated[index].required = !updated[index].required;
    setNewFields(updated);
  };

  const removeField = (index: number) => {
    if (["name", "phone"].includes(newFields[index].name)) return;
    setNewFields(newFields.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    setNewFields([...newFields, {
      name: `custom_${Date.now()}`,
      label: "Custom Field",
      type: "text",
      required: false,
    }]);
  };

  const getProjectForForm = (form: LeadForm) => {
    return projects.find(p => p.id === form.seo_project_id);
  };

  const generateScript = (form: LeadForm) => {
    const project = getProjectForForm(form);
    if (!project) return "// No SEO project found for this form";

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg";
    const endpoint = `https://${projectId}.supabase.co/functions/v1/seo-lead-capture`;

    return `<!-- NextWeb OS Contact Form Script -->
<script>
(function() {
  var ENDPOINT = "${endpoint}";
  var PROJECT_ID = "${project.id}";
  var API_KEY = "${project.api_key}";
  var FORM_ID = "${form.id}";
  var SUCCESS_MSG = "${form.success_message || "Thank you!"}";
  var REDIRECT_URL = "${form.redirect_url || ""}";

  function init() {
    var forms = document.querySelectorAll('[data-nw-form=\\' + FORM_ID + '\\"]');
    if (!forms.length) forms = document.querySelectorAll('form[data-nextweb]');
    forms.forEach(function(form) { form.addEventListener('submit', handleSubmit); });
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('[type="submit"]');
    var fd = new FormData(form);

    var name = (fd.get('name') || '').toString().trim();
    var phone = (fd.get('phone') || '').toString().trim();
    var email = (fd.get('email') || '').toString().trim();
    var message = (fd.get('message') || '').toString().trim();

    if (!name) { alert('Name is required'); return; }
    if (!phone) { alert('Phone is required'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    var payload = {
      project_id: PROJECT_ID,
      api_key: API_KEY,
      form_id: FORM_ID,
      name: name,
      phone: phone,
      email: email,
      message: message,
      source: 'form',
      page_url: window.location.href,
      extra_data: {}
    };

    // Collect UTM params
    var params = new URLSearchParams(window.location.search);
    if (params.get('utm_source')) payload.utm_source = params.get('utm_source');
    if (params.get('utm_medium')) payload.utm_medium = params.get('utm_medium');
    if (params.get('utm_campaign')) payload.utm_campaign = params.get('utm_campaign');

    sendRequest(payload, form, btn, 0);
  }

  function sendRequest(payload, form, btn, attempt) {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
      if (res.ok) {
        form.reset();
        if (REDIRECT_URL) { window.location.href = REDIRECT_URL; }
        else {
          var msg = document.createElement('div');
          msg.style.cssText = 'padding:12px;background:#22c55e;color:#fff;border-radius:6px;margin-top:8px;text-align:center';
          msg.textContent = SUCCESS_MSG;
          form.appendChild(msg);
          setTimeout(function() { msg.remove(); }, 5000);
        }
      } else {
        if (attempt < 1) { sendRequest(payload, form, btn, attempt + 1); }
        else { alert(res.data.error || 'Failed to submit. Please try again.'); }
      }
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
      if (attempt < 1) { sendRequest(payload, form, btn, attempt + 1); }
      else { alert('Network error. Please try again.'); }
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
</script>`;
  };

  const generateHtmlForm = (form: LeadForm) => {
    const fields = (form.fields_json || DEFAULT_FIELDS) as FormField[];
    const lines = [`<form data-nw-form="${form.id}" data-nextweb>`];
    fields.forEach(f => {
      const req = f.required ? ' required' : '';
      if (f.type === "textarea") {
        lines.push(`  <label>${f.label}</label>`);
        lines.push(`  <textarea name="${f.name}" placeholder="${f.label}"${req}></textarea>`);
      } else {
        lines.push(`  <label>${f.label}</label>`);
        lines.push(`  <input type="${f.type}" name="${f.name}" placeholder="${f.label}"${req} />`);
      }
    });
    lines.push(`  <button type="submit">Submit</button>`);
    lines.push(`</form>`);
    return lines.join('\n');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestSubmission = async (form: LeadForm) => {
    const project = getProjectForForm(form);
    if (!project) {
      setTestResult({ status: "error", message: "No SEO project found" });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg";
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/seo-lead-capture`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: project.id,
            api_key: project.api_key,
            form_id: form.id,
            name: "Test Lead (NextWeb OS)",
            phone: "+61400000000",
            email: "test@nextweb.test",
            message: "This is a test submission from NextWeb OS",
            source: "form",
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setTestResult({ status: "success", message: `Test lead created (ID: ${data.lead_id})` });
      } else {
        setTestResult({ status: "error", message: data.error || "Test failed" });
      }
    } catch (e) {
      setTestResult({ status: "error", message: "Network error during test" });
    }
    setTestLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (projects.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-3" />
          <p className="font-medium">No SEO Project Found</p>
          <p className="text-sm text-muted-foreground mt-1">Create an SEO project for this client first to enable contact form creation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Contact Form Management</h3>
          <p className="text-xs text-muted-foreground">Create and manage lead capture forms for this client's website</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create Form
          </Button>
        )}
      </div>

      {/* Existing Forms */}
      {forms.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <FormInput className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No contact forms created yet</p>
            {canEdit && (
              <Button size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create First Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const project = getProjectForForm(form);
            return (
              <Card key={form.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FormInput className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{form.form_name}</span>
                      <Badge variant={form.is_active ? "default" : "secondary"} className="text-[10px]">
                        {form.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Switch
                          checked={form.is_active ?? false}
                          onCheckedChange={() => toggleFormActive(form.id, form.is_active ?? false)}
                        />
                      )}
                      <Button size="sm" variant="outline" onClick={() => setScriptOpen(form)}>
                        <Code className="h-3.5 w-3.5 mr-1" /> Get Script
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestSubmission(form)}
                        disabled={testLoading}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Test
                      </Button>
                    </div>
                  </div>

                  {/* Form details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Project:</span>
                      <p className="font-medium truncate">{project?.project_name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fields:</span>
                      <p className="font-medium">{((form.fields_json as any) || []).length} fields</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Message:</span>
                      <p className="font-medium truncate">{form.success_message || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Redirect:</span>
                      <p className="font-medium truncate">{form.redirect_url || "None"}</p>
                    </div>
                  </div>

                  {/* Test result */}
                  {testResult && (
                    <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${testResult.status === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      {testResult.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {testResult.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Contact Form</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="fields" className="space-y-4">
            <TabsList>
              <TabsTrigger value="fields"><FormInput className="h-3.5 w-3.5 mr-1" /> Fields</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="h-3.5 w-3.5 mr-1" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newFields.map((field, i) => (
                    <TableRow key={i}>
                      <TableCell><GripVertical className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                      <TableCell>
                        <Input
                          value={field.label}
                          onChange={e => {
                            const updated = [...newFields];
                            updated[i].label = e.target.value;
                            setNewFields(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{field.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={field.required}
                          disabled={field.name === "phone"}
                          onCheckedChange={() => toggleFieldRequired(i)}
                        />
                        {field.name === "phone" && (
                          <span className="text-[10px] text-muted-foreground ml-1 flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> Always
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!["name", "phone"].includes(field.name) && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeField(i)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Field
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Form Name</Label>
                  <Input value={newFormName} onChange={e => setNewFormName(e.target.value)} placeholder="Contact Form" />
                </div>
                <div>
                  <Label>SEO Project</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name} ({p.website_domain})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Success Message</Label>
                  <Textarea value={newSuccessMsg} onChange={e => setNewSuccessMsg(e.target.value)} />
                </div>
                <div>
                  <Label>Redirect URL (optional)</Label>
                  <Input value={newRedirect} onChange={e => setNewRedirect(e.target.value)} placeholder="https://example.com/thank-you" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newFormName || !selectedProjectId}>Create Form</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Script Dialog */}
      <Dialog open={!!scriptOpen} onOpenChange={() => setScriptOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed Script — {scriptOpen?.form_name}</DialogTitle>
          </DialogHeader>

          {scriptOpen && (
            <Tabs defaultValue="script" className="space-y-4">
              <TabsList>
                <TabsTrigger value="script">JavaScript</TabsTrigger>
                <TabsTrigger value="html">HTML Form</TabsTrigger>
                <TabsTrigger value="api">API Endpoint</TabsTrigger>
              </TabsList>

              <TabsContent value="script">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => handleCopy(generateScript(scriptOpen))}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-96 whitespace-pre-wrap">
                    {generateScript(scriptOpen)}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Paste this script before the closing <code>&lt;/body&gt;</code> tag on the client's website.
                </p>
              </TabsContent>

              <TabsContent value="html">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => handleCopy(generateHtmlForm(scriptOpen))}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-96 whitespace-pre-wrap">
                    {generateHtmlForm(scriptOpen)}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this HTML structure. The JavaScript will auto-attach to forms with the <code>data-nw-form</code> or <code>data-nextweb</code> attribute.
                </p>
              </TabsContent>

              <TabsContent value="api">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Endpoint</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg"}.supabase.co/functions/v1/seo-lead-capture`}
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg"}.supabase.co/functions/v1/seo-lead-capture`)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sample JSON Payload</Label>
                    <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
{JSON.stringify({
  project_id: getProjectForForm(scriptOpen)?.id || "PROJECT_ID",
  api_key: getProjectForForm(scriptOpen)?.api_key || "API_KEY",
  form_id: scriptOpen.id,
  name: "John Doe",
  phone: "+61400000000",
  email: "john@example.com",
  message: "I'd like a quote",
  source: "form",
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
