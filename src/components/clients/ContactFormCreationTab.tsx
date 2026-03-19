import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Code, Settings, FormInput, Trash2, GripVertical, Copy, Check, Send,
  AlertTriangle, CheckCircle2, Shield, Paintbrush, ArrowUp, ArrowDown, Loader2,
  Mail, Pencil, X
} from "lucide-react";
import { toast } from "sonner";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface FormDesign {
  button_text: string;
  button_color: string;
  bg_color: string;
  text_color: string;
  border_radius: string;
  spacing: string;
}

const DEFAULT_DESIGN: FormDesign = {
  button_text: "Submit",
  button_color: "#2563eb",
  bg_color: "#ffffff",
  text_color: "#111827",
  border_radius: "8",
  spacing: "normal",
};

interface LeadForm {
  id: string;
  form_name: string;
  is_active: boolean;
  fields_json: FormField[];
  design_json: FormDesign | null;
  success_message: string;
  redirect_url: string | null;
  seo_project_id: string;
  created_at: string;
  to_emails?: string[];
  cc_emails?: string[];
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

// ── Email Tag Input Component ──
function EmailTagInput({ emails, onChange, placeholder }: { emails: string[]; onChange: (e: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const addEmail = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) { toast.error("Invalid email format"); return; }
    if (emails.includes(trimmed)) { toast.error("Email already added"); return; }
    onChange([...emails, trimmed]);
    setInput("");
  };

  const removeEmail = (idx: number) => onChange(emails.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {emails.map((email, i) => (
          <Badge key={email} variant="secondary" className="text-xs gap-1">
            {email}
            <button onClick={() => removeEmail(i)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
          placeholder={placeholder || "Add email and press Enter"}
          className="h-8 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addEmail} className="h-8">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<LeadForm | null>(null); // null = create mode
  const [scriptOpen, setScriptOpen] = useState<LeadForm | null>(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string; details?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form state (shared for create + edit)
  const [formName, setFormName] = useState("Contact Form");
  const [fields, setFields] = useState<FormField[]>([...DEFAULT_FIELDS]);
  const [design, setDesign] = useState<FormDesign>({ ...DEFAULT_DESIGN });
  const [successMsg, setSuccessMsg] = useState("Thank you! We will get back to you shortly.");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const [formsRes, projRes] = await Promise.all([
      supabase.from("seo_lead_forms").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("seo_projects").select("id, project_name, api_key, website_domain").eq("client_id", clientId),
    ]);
    setForms((formsRes.data as any) || []);
    setProjects((projRes.data as any) || []);
    if (projRes.data && projRes.data.length > 0 && !selectedProjectId) {
      setSelectedProjectId((projRes.data as any)[0].id);
    }
    setLoading(false);
  }, [clientId, profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset form state for creation
  const openCreateDialog = () => {
    setEditingForm(null);
    setFormName("Contact Form");
    setFields([...DEFAULT_FIELDS]);
    setDesign({ ...DEFAULT_DESIGN });
    setSuccessMsg("Thank you! We will get back to you shortly.");
    setRedirectUrl("");
    setToEmails([]);
    setCcEmails([]);
    setDialogOpen(true);
  };

  // Populate form state for editing
  const openEditDialog = (form: LeadForm) => {
    setEditingForm(form);
    setFormName(form.form_name);
    setFields((form.fields_json as FormField[]) || [...DEFAULT_FIELDS]);
    setDesign((form.design_json as FormDesign) || { ...DEFAULT_DESIGN });
    setSuccessMsg(form.success_message || "");
    setRedirectUrl(form.redirect_url || "");
    setSelectedProjectId(form.seo_project_id);
    setToEmails((form.to_emails as string[]) || []);
    setCcEmails((form.cc_emails as string[]) || []);
    setDialogOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...fields];
    const draggedItem = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItem);
    setFields(items);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const items = [...fields];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setFields(items);
  };

  const handleSave = async () => {
    if (!profile?.business_id || !selectedProjectId) {
      toast.error("Please select an SEO project first");
      return;
    }
    const phoneField = fields.find(f => f.name === "phone");
    if (!phoneField || !phoneField.required) {
      toast.error("Phone field must be required");
      return;
    }

    const payload = {
      form_name: formName,
      fields_json: fields,
      design_json: design,
      success_message: successMsg,
      redirect_url: redirectUrl || null,
      to_emails: toEmails,
      cc_emails: ccEmails,
    };

    if (editingForm) {
      // UPDATE existing form
      const { error } = await supabase.from("seo_lead_forms")
        .update(payload as any)
        .eq("id", editingForm.id);
      if (error) { toast.error("Failed to update form"); console.error(error); return; }
      toast.success("Form updated");
    } else {
      // CREATE new form
      const { error } = await supabase.from("seo_lead_forms").insert({
        ...payload,
        business_id: profile.business_id,
        client_id: clientId,
        seo_project_id: selectedProjectId,
        is_active: true,
        created_by: profile.user_id,
      } as any);
      if (error) { toast.error("Failed to create form"); console.error(error); return; }
      toast.success("Contact form created");
    }

    setDialogOpen(false);
    fetchData();
  };

  const toggleFormActive = async (formId: string, isActive: boolean) => {
    await supabase.from("seo_lead_forms").update({ is_active: !isActive } as any).eq("id", formId);
    fetchData();
  };

  const toggleFieldRequired = (index: number) => {
    if (fields[index].name === "phone") return;
    const updated = [...fields];
    updated[index].required = !updated[index].required;
    setFields(updated);
  };

  const removeField = (index: number) => {
    if (["name", "phone"].includes(fields[index].name)) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    setFields([...fields, { name: `custom_${Date.now()}`, label: "Custom Field", type: "text", required: false }]);
  };

  const getProjectForForm = (form: LeadForm) => projects.find(p => p.id === form.seo_project_id);

  const generateScript = (form: LeadForm) => {
    const project = getProjectForForm(form);
    if (!project) return "// No SEO project found for this form";

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg";
    const endpoint = `https://${projectId}.supabase.co/functions/v1/seo-lead-capture`;
    const formDesign = (form.design_json as FormDesign) || DEFAULT_DESIGN;

    return `<!-- NextWeb OS Contact Form Script -->
<script>
(function() {
  var ENDPOINT = "${endpoint}";
  var FORM_ID = "${form.id}";
  var SUCCESS_MSG = "${(form.success_message || "Thank you!").replace(/"/g, '\\"')}";
  var REDIRECT_URL = "${form.redirect_url || ""}";
  var DESIGN = ${JSON.stringify(formDesign)};
  var _submitted = {};
  var _loadTime = Date.now();

  function init() {
    console.log('[NW Form] Initializing — FORM_ID:', FORM_ID);
    var forms = document.querySelectorAll('[data-nw-form="' + FORM_ID + '"]');
    if (!forms.length) forms = document.querySelectorAll('form[data-nextweb]');
    if (!forms.length) {
      var allForms = document.querySelectorAll('form');
      if (allForms.length === 1) {
        console.warn('[NW Form] No tagged form found — auto-binding to single form on page');
        forms = allForms;
      } else {
        console.warn('[NW Form] No matching form found for FORM_ID:', FORM_ID, '— found', allForms.length, 'untagged forms, skipping');
        return;
      }
    }
    console.log('[NW Form] Bound to', forms.length, 'form(s)');
    forms.forEach(function(form) {
      form.addEventListener('submit', handleSubmit);
      applyDesign(form);
    });
  }

  function applyDesign(form) {
    if (DESIGN.bg_color) form.style.backgroundColor = DESIGN.bg_color;
    if (DESIGN.text_color) form.style.color = DESIGN.text_color;
    if (DESIGN.border_radius) form.style.borderRadius = DESIGN.border_radius + 'px';
    var spacing = DESIGN.spacing === 'compact' ? '8px' : DESIGN.spacing === 'spacious' ? '24px' : '16px';
    form.style.padding = spacing;
    var btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.style.backgroundColor = DESIGN.button_color || '#2563eb';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '10px 24px';
      btn.style.borderRadius = (DESIGN.border_radius || '8') + 'px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.fontWeight = '600';
      btn.textContent = DESIGN.button_text || 'Submit';
      btn.setAttribute('data-original-text', DESIGN.button_text || 'Submit');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = form.querySelector('[type="submit"]');
    var fd = new FormData(form);

    var name = (fd.get('name') || fd.get('fullname') || fd.get('full_name') || fd.get('your-name') || '').toString().trim();
    var phone = (fd.get('phone') || fd.get('mobile') || fd.get('tel') || fd.get('contact') || fd.get('your-phone') || '').toString().trim();
    var email = (fd.get('email') || fd.get('your-email') || fd.get('mail') || '').toString().trim();
    var message = (fd.get('message') || fd.get('comments') || fd.get('your-message') || fd.get('enquiry') || '').toString().trim();

    if (!name) { showMsg(form, 'Name is required', 'error'); return; }
    if (!phone) { showMsg(form, 'Phone is required', 'error'); return; }
    if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { showMsg(form, 'Invalid email format', 'error'); return; }

    var dedupKey = phone + '_' + FORM_ID;
    if (_submitted[dedupKey] && (Date.now() - _submitted[dedupKey]) < 60000) {
      showMsg(form, 'This submission was already received', 'error'); return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    clearMsg(form);

    var payload = {
      domain: window.location.hostname, form_id: FORM_ID,
      name: name, phone: phone, email: email, message: message,
      source: 'form', page_url: window.location.href, extra_data: {},
      _submission_ts: _loadTime
    };
    var params = new URLSearchParams(window.location.search);
    if (params.get('utm_source')) payload.utm_source = params.get('utm_source');
    if (params.get('utm_medium')) payload.utm_medium = params.get('utm_medium');
    if (params.get('utm_campaign')) payload.utm_campaign = params.get('utm_campaign');

    fd.forEach(function(v, k) {
      if (!['name','fullname','full_name','your-name','phone','mobile','tel','contact','your-phone','email','your-email','mail','message','comments','your-message','enquiry'].includes(k)) payload.extra_data[k] = v;
    });

    sendRequest(payload, form, btn, 0, dedupKey);
  }

  function sendRequest(payload, form, btn, attempt, dedupKey) {
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(async function(r) { var data = {}; try { data = await r.json(); } catch(e) {} return { ok: r.ok, status: r.status, data: data }; })
    .then(function(res) {
      var origText = (btn && btn.getAttribute('data-original-text')) || DESIGN.button_text || 'Submit';
      if (btn) { btn.disabled = false; btn.textContent = origText; }
      if (res.ok) {
        _submitted[dedupKey] = Date.now();
        form.reset();
        if (REDIRECT_URL) { window.location.href = REDIRECT_URL; }
        else { showMsg(form, SUCCESS_MSG, 'success'); }
      } else {
        if (attempt < 1 && res.status >= 500) { sendRequest(payload, form, btn, attempt + 1, dedupKey); }
        else { showMsg(form, (res.data && res.data.error) || 'Failed to submit. Please try again.', 'error'); }
      }
    })
    .catch(function(err) {
      var origText = (btn && btn.getAttribute('data-original-text')) || DESIGN.button_text || 'Submit';
      if (btn) { btn.disabled = false; btn.textContent = origText; }
      if (attempt < 1) { sendRequest(payload, form, btn, attempt + 1, dedupKey); }
      else { showMsg(form, 'Network error. Please try again.', 'error'); }
    });
  }

  function showMsg(form, text, type) {
    clearMsg(form);
    var msg = document.createElement('div');
    msg.className = 'nw-form-msg';
    msg.style.cssText = 'padding:12px;border-radius:6px;margin-top:8px;text-align:center;font-size:14px;' +
      (type === 'success' ? 'background:#dcfce7;color:#166534;' : 'background:#fee2e2;color:#991b1b;');
    msg.textContent = text;
    form.appendChild(msg);
    if (type === 'success') setTimeout(function() { msg.remove(); }, 6000);
    else setTimeout(function() { msg.remove(); }, 8000);
  }

  function clearMsg(form) {
    var old = form.querySelectorAll('.nw-form-msg');
    old.forEach(function(el) { el.remove(); });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else if (document.readyState === 'interactive') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
  window.addEventListener('load', function() { setTimeout(init, 500); });
})();
</script>`;
  };

  const generateHtmlForm = (form: LeadForm) => {
    const formFields = (form.fields_json || DEFAULT_FIELDS) as FormField[];
    const formDesign = (form.design_json as FormDesign) || DEFAULT_DESIGN;
    const lines = [`<form data-nw-form="${form.id}" data-nextweb>`];
    formFields.forEach(f => {
      const req = f.required ? ' required' : '';
      if (f.type === "textarea") {
        lines.push(`  <label>${f.label}</label>`);
        lines.push(`  <textarea name="${f.name}" placeholder="${f.label}"${req}></textarea>`);
      } else {
        lines.push(`  <label>${f.label}</label>`);
        lines.push(`  <input type="${f.type}" name="${f.name}" placeholder="${f.label}"${req} />`);
      }
    });
    lines.push(`  <button type="submit">${formDesign.button_text || "Submit"}</button>`);
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
    if (!project) { setTestResult({ status: "error", message: "No SEO project found" }); return; }
    setTestLoading(true);
    setTestResult(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg";
      const payload = {
        project_id: project.id, api_key: project.api_key, form_id: form.id,
        name: "Test Lead (NextWeb OS)", phone: "+61400000000",
        email: "test@nextweb.test", message: "Test submission from NextWeb OS", source: "form",
      };

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/seo-lead-capture`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();

      if (res.ok) {
        const emailStatus = data.emails?.map((e: any) => `${e.type}: ${e.status}`).join(", ") || "N/A";
        const spamInfo = data.spam ? ` | Spam: ${data.spam.score}/100` : "";
        setTestResult({
          status: "success",
          message: `✔ Lead created (ID: ${data.lead_id})`,
          details: `Email status: ${emailStatus}${spamInfo}`,
        });
      } else {
        setTestResult({ status: "error", message: data.error || "Test failed", details: JSON.stringify(data) });
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Contact Form Management</h3>
          <p className="text-xs text-muted-foreground">Create and manage lead capture forms for this client's website</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" /> Create Form
          </Button>
        )}
      </div>

      {forms.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center">
            <FormInput className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No contact forms created yet</p>
            {canEdit && (
              <Button size="sm" className="mt-3" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" /> Create First Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map(form => {
            const project = getProjectForForm(form);
            const formToEmails = (form.to_emails as string[]) || [];
            const formCcEmails = (form.cc_emails as string[]) || [];
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
                      {formToEmails.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Mail className="h-2.5 w-2.5" /> {formToEmails.length} recipient{formToEmails.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <>
                          <Switch checked={form.is_active ?? false} onCheckedChange={() => toggleFormActive(form.id, form.is_active ?? false)} />
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(form)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setScriptOpen(form)}>
                        <Code className="h-3.5 w-3.5 mr-1" /> Get Script
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleTestSubmission(form)} disabled={testLoading}>
                        {testLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                        Test
                      </Button>
                    </div>
                  </div>

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
                      <span className="text-muted-foreground">Email To:</span>
                      <p className="font-medium truncate">{formToEmails.length > 0 ? formToEmails.join(", ") : "Default"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CC:</span>
                      <p className="font-medium truncate">{formCcEmails.length > 0 ? formCcEmails.join(", ") : "reports@nextweb.com.au"}</p>
                    </div>
                  </div>

                  {testResult && (
                    <div className={`mt-3 p-3 rounded-lg text-xs space-y-1 ${testResult.status === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      <div className="flex items-center gap-2">
                        {testResult.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {testResult.message}
                      </div>
                      {testResult.details && <p className="text-[10px] opacity-80">{testResult.details}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? "Edit Form" : "Create Contact Form"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="fields" className="space-y-4">
            <TabsList>
              <TabsTrigger value="fields"><FormInput className="h-3.5 w-3.5 mr-1" /> Fields</TabsTrigger>
              <TabsTrigger value="design"><Paintbrush className="h-3.5 w-3.5 mr-1" /> Design</TabsTrigger>
              <TabsTrigger value="email"><Mail className="h-3.5 w-3.5 mr-1" /> Email Routing</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="h-3.5 w-3.5 mr-1" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, i) => (
                    <TableRow
                      key={field.name + i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex flex-col">
                            <button onClick={() => moveField(i, "up")} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button onClick={() => moveField(i, "down")} disabled={i === fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={field.label}
                          onChange={e => {
                            const updated = [...fields];
                            updated[i].label = e.target.value;
                            setFields(updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={field.type}
                          onValueChange={v => {
                            const updated = [...fields];
                            updated[i].type = v;
                            setFields(updated);
                          }}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch checked={field.required} disabled={field.name === "phone"} onCheckedChange={() => toggleFieldRequired(i)} />
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

            <TabsContent value="design" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button Text</Label>
                  <Input value={design.button_text} onChange={e => setDesign(d => ({ ...d, button_text: e.target.value }))} placeholder="Submit" />
                </div>
                <div>
                  <Label>Spacing</Label>
                  <Select value={design.spacing} onValueChange={v => setDesign(d => ({ ...d, spacing: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Button Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={design.button_color} onChange={e => setDesign(d => ({ ...d, button_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={design.button_color} onChange={e => setDesign(d => ({ ...d, button_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={design.bg_color} onChange={e => setDesign(d => ({ ...d, bg_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={design.bg_color} onChange={e => setDesign(d => ({ ...d, bg_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={design.text_color} onChange={e => setDesign(d => ({ ...d, text_color: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={design.text_color} onChange={e => setDesign(d => ({ ...d, text_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Border Radius (px)</Label>
                  <Input type="number" value={design.border_radius} onChange={e => setDesign(d => ({ ...d, border_radius: e.target.value }))} min="0" max="30" />
                </div>
              </div>

              {/* Live preview */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <div
                  className="border rounded-lg"
                  style={{
                    backgroundColor: design.bg_color,
                    color: design.text_color,
                    borderRadius: `${design.border_radius}px`,
                    padding: design.spacing === "compact" ? "8px" : design.spacing === "spacious" ? "24px" : "16px",
                  }}
                >
                  <div className="space-y-2">
                    <input placeholder="Name" className="w-full p-2 border rounded text-sm" style={{ borderRadius: `${design.border_radius}px` }} readOnly />
                    <input placeholder="Phone" className="w-full p-2 border rounded text-sm" style={{ borderRadius: `${design.border_radius}px` }} readOnly />
                    <button
                      className="w-full text-sm font-semibold py-2"
                      style={{
                        backgroundColor: design.button_color,
                        color: "#fff",
                        borderRadius: `${design.border_radius}px`,
                        border: "none",
                      }}
                    >
                      {design.button_text || "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* NEW: Email Routing Tab */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    <Mail className="h-3.5 w-3.5" /> To Recipients <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Internal notification emails will be sent to these addresses. If empty, defaults to client/business email.
                  </p>
                  <EmailTagInput emails={toEmails} onChange={setToEmails} placeholder="Add recipient email..." />
                </div>

                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    <Mail className="h-3.5 w-3.5" /> CC Recipients
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Additional CC recipients. <code className="text-[10px] bg-muted px-1 rounded">reports@nextweb.com.au</code> is always included.
                  </p>
                  <EmailTagInput emails={ccEmails} onChange={setCcEmails} placeholder="Add CC email..." />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Form Name</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contact Form" />
                </div>
                {!editingForm && (
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
                )}
                <div>
                  <Label>Success Message</Label>
                  <Textarea value={successMsg} onChange={e => setSuccessMsg(e.target.value)} />
                </div>
                <div>
                  <Label>Redirect URL (optional)</Label>
                  <Input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://example.com/thank-you" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || (!editingForm && !selectedProjectId)}>
              {editingForm ? "Save Changes" : "Create Form"}
            </Button>
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
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 z-10" onClick={() => handleCopy(generateScript(scriptOpen))}>
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
                  <Button size="sm" variant="outline" className="absolute top-2 right-2 z-10" onClick={() => handleCopy(generateHtmlForm(scriptOpen))}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto max-h-96 whitespace-pre-wrap">
                    {generateHtmlForm(scriptOpen)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="api">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Endpoint</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg"}.supabase.co/functions/v1/seo-lead-capture`} className="text-xs font-mono" />
                      <Button size="sm" variant="outline" onClick={() => handleCopy(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "equruhaugrbtqjixqgtg"}.supabase.co/functions/v1/seo-lead-capture`)}>
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
