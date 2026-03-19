import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { useCustomFields, FIELD_TYPES } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUp, ArrowDown, Pencil, Trash2, Plus, Save, GripVertical,
  Eye, EyeOff, Layers, GitBranch, Type, LayoutGrid, Shield,
  Copy, Settings2, Tag, AlertTriangle, CheckCircle, X,
} from "lucide-react";
import { toast } from "sonner";

interface ConfigItem {
  id: string; config_type: string; module: string; key: string; label: string;
  sort_order: number; is_visible: boolean; is_required: boolean; field_type: string | null; options_json: any;
}

const CRM_MODULES = [
  { value: "leads", label: "Leads" },
  { value: "investors", label: "Investors" },
  { value: "opportunities", label: "Opportunities" },
  { value: "deals", label: "Deals" },
  { value: "projects", label: "Projects" },
  { value: "partners", label: "Partners" },
  { value: "tasks", label: "Tasks" },
  { value: "communications", label: "Communications" },
  { value: "documents", label: "Documents" },
];

const DEFAULT_TERMS = [
  { key: "investors", default: "Investors", desc: "How you refer to your investors" },
  { key: "leads", default: "Leads", desc: "Pre-qualification contacts" },
  { key: "opportunities", default: "Opportunities", desc: "Property/investment listings" },
  { key: "deals", default: "Deals", desc: "Active transactions" },
  { key: "partners", default: "Partners", desc: "External professionals" },
  { key: "pipeline", default: "Pipeline", desc: "Deal progression stages" },
  { key: "settlement", default: "Settlement", desc: "Final deal closure" },
  { key: "advisor", default: "Advisor", desc: "Relationship manager title" },
];

const DEFAULT_WIDGETS = [
  { key: "kpi_cards", label: "KPI Cards" },
  { key: "leads_by_source", label: "Leads by Source Chart" },
  { key: "pipeline_distribution", label: "Pipeline Distribution" },
  { key: "urgent_actions", label: "Urgent Actions Panel" },
];

export function CRMCustomizationPanel() {
  const { profile } = useAuth();
  const { refetchTabs, businessId } = useBusinessCRM();
  const qc = useQueryClient();

  // ── All config ──
  const { data: allConfig = [], refetch: refetchConfig } = useQuery({
    queryKey: ["crm-config-all-custom", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase.from("business_crm_config").select("*").eq("business_id", businessId).order("sort_order");
      return (data || []) as ConfigItem[];
    }, enabled: !!businessId,
  });

  // ── Terminology ──
  const { data: terms = [], refetch: refetchTerms } = useQuery({
    queryKey: ["crm-terminology", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase.from("crm_terminology").select("*").eq("business_id", businessId);
      return data || [];
    }, enabled: !!businessId,
  });

  // ── Widget visibility ──
  const { data: widgets = [], refetch: refetchWidgets } = useQuery({
    queryKey: ["crm-widgets", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase.from("crm_dashboard_widgets").select("*").eq("business_id", businessId).order("sort_order");
      return data || [];
    }, enabled: !!businessId,
  });

  const tabs = allConfig.filter(c => c.config_type === "tab");
  const leadStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "leads");
  const investorStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "investors");
  const dealStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "deal_pipeline");

  // ── State ──
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deleteItem, setDeleteItem] = useState<ConfigItem | null>(null);
  const [newStageLabel, setNewStageLabel] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState("leads");

  // Field Manager state
  const [selectedModule, setSelectedModule] = useState("leads");
  const { fields, createField, updateField, deleteField, refetch: refetchFields } = useCustomFields(selectedModule);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [newField, setNewField] = useState({ field_label: "", field_type: "text", is_required: false, options: "" });

  // ── Helpers ──
  const refetchAll = () => { refetchConfig(); refetchTabs(); };

  const toggleVisibility = async (item: ConfigItem) => {
    await supabase.from("business_crm_config").update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() } as any).eq("id", item.id);
    refetchAll();
    toast.success(`${item.label} ${item.is_visible ? "hidden" : "shown"}`);
  };

  const reorder = async (items: ConfigItem[], index: number, direction: "up" | "down") => {
    const ni = direction === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= items.length) return;
    const a = items[index], b = items[ni];
    await Promise.all([
      supabase.from("business_crm_config").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("business_crm_config").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    refetchAll();
  };

  const saveRename = async () => {
    if (!editItem || !editLabel.trim()) return;
    await supabase.from("business_crm_config").update({ label: editLabel.trim(), updated_at: new Date().toISOString() } as any).eq("id", editItem.id);
    setEditItem(null);
    refetchAll();
    toast.success("Renamed successfully");
  };

  const duplicateTab = async (item: ConfigItem) => {
    const newKey = item.key + "_copy_" + Date.now();
    await supabase.from("business_crm_config").insert({
      business_id: businessId, config_type: "tab", module: "crm",
      key: newKey, label: item.label + " (Copy)", sort_order: tabs.length + 1,
      is_visible: true, options_json: item.options_json,
    } as any);
    refetchAll();
    toast.success("Tab duplicated");
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    await supabase.from("business_crm_config").delete().eq("id", deleteItem.id);
    setDeleteItem(null);
    refetchAll();
    qc.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Deleted");
  };

  const addStage = async () => {
    if (!newStageLabel.trim() || !businessId) return;
    const existing = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === selectedPipeline);
    const key = newStageLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    await supabase.from("business_crm_config").insert({
      business_id: businessId, config_type: "pipeline_stage", module: selectedPipeline,
      key, label: newStageLabel.trim(), sort_order: existing.length + 1,
      is_visible: true, options_json: { color: "#D4A574" },
    } as any);
    setNewStageLabel("");
    refetchAll();
    qc.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Stage added");
  };

  const handleAddField = async () => {
    if (!newField.field_label.trim()) { toast.error("Field label required"); return; }
    const opts = newField.field_type === "dropdown" && newField.options
      ? newField.options.split(",").map(o => o.trim()).filter(Boolean)
      : undefined;
    await createField({
      module_name: selectedModule,
      field_label: newField.field_label,
      field_type: newField.field_type,
      is_required: newField.is_required,
      options: opts,
    });
    setFieldDialogOpen(false);
    setNewField({ field_label: "", field_type: "text", is_required: false, options: "" });
  };

  // ── Terminology ──
  const getTermLabel = (key: string) => {
    const found = terms.find((t: any) => t.term_key === key);
    return found ? found.custom_label : DEFAULT_TERMS.find(d => d.key === key)?.default || key;
  };

  const saveTerm = async (key: string, label: string) => {
    if (!businessId || !label.trim()) return;
    const { error } = await supabase.from("crm_terminology").upsert(
      { business_id: businessId, term_key: key, custom_label: label.trim(), updated_at: new Date().toISOString() } as any,
      { onConflict: "business_id,term_key" }
    );
    if (error) { toast.error("Failed"); return; }
    refetchTerms();
    toast.success("Term updated");
  };

  // ── Widget visibility ──
  const seedWidgets = async () => {
    if (!businessId) return;
    const inserts = DEFAULT_WIDGETS.map((w, i) => ({
      business_id: businessId, widget_key: w.key, widget_label: w.label, is_visible: true, sort_order: i + 1,
    }));
    await supabase.from("crm_dashboard_widgets").insert(inserts as any);
    refetchWidgets();
  };

  const toggleWidget = async (id: string, current: boolean) => {
    await supabase.from("crm_dashboard_widgets").update({ is_visible: !current } as any).eq("id", id);
    refetchWidgets();
    toast.success("Widget updated");
  };

  // ── Pipeline selection ──
  const pipelineStages = selectedPipeline === "leads" ? leadStages
    : selectedPipeline === "investors" ? investorStages
    : dealStages;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/10"><Settings2 className="h-5 w-5 text-primary" /></div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">CRM Customization</h2>
          <p className="text-sm text-muted-foreground">Personalize your CRM workspace — tabs, fields, pipelines, and terminology</p>
        </div>
      </div>

      <Tabs defaultValue="tab_manager">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="tab_manager" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Tab Manager</TabsTrigger>
          <TabsTrigger value="field_manager" className="gap-1.5 text-xs"><Type className="h-3.5 w-3.5" />Field Manager</TabsTrigger>
          <TabsTrigger value="pipeline_manager" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" />Pipeline Manager</TabsTrigger>
          <TabsTrigger value="labels" className="gap-1.5 text-xs"><Tag className="h-3.5 w-3.5" />Labels & Terminology</TabsTrigger>
          <TabsTrigger value="visibility" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Visibility Controls</TabsTrigger>
        </TabsList>

        {/* ════════ TAB MANAGER ════════ */}
        <TabsContent value="tab_manager" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">CRM Tabs</CardTitle>
              <CardDescription className="text-xs">Rename, reorder, show/hide, duplicate, or delete tabs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {tabs.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                  <span className={`text-sm flex-1 font-medium ${!item.is_visible ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">{item.key}</Badge>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorder(tabs, idx, "up")} disabled={idx === 0} title="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorder(tabs, idx, "down")} disabled={idx === tabs.length - 1} title="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setEditLabel(item.label); }} title="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(item)} title={item.is_visible ? "Hide" : "Show"}>
                      {item.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateTab(item)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              {tabs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tabs configured</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ FIELD MANAGER ════════ */}
        <TabsContent value="field_manager" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px] bg-card"><SelectValue placeholder="Select module" /></SelectTrigger>
              <SelectContent>{CRM_MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => setFieldDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Field</Button>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Custom Fields — {CRM_MODULES.find(m => m.value === selectedModule)?.label}</CardTitle>
              <CardDescription className="text-xs">Add, rename, reorder, and configure fields for this module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${!field.is_active ? "text-muted-foreground line-through" : "text-foreground"}`}>{field.field_label}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[9px]">{field.field_type}</Badge>
                      {field.is_required && <Badge className="text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/30">Required</Badge>}
                      <span className="text-[9px] text-muted-foreground">{field.field_key}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateField(field.id, { display_order: Math.max(0, field.display_order - 1) })} disabled={idx === 0} title="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateField(field.id, { display_order: field.display_order + 1 })} disabled={idx === fields.length - 1} title="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <div className="flex items-center gap-1 mx-1">
                      <Switch checked={field.is_required} onCheckedChange={v => updateField(field.id, { is_required: v } as any)} className="scale-75" />
                      <span className="text-[9px] text-muted-foreground">Req</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateField(field.id, { is_active: !field.is_active } as any)} title={field.is_active ? "Deactivate" : "Activate"}>
                      {field.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteField(field.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-8">
                  <Type className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No custom fields for this module</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Field" to create your first custom field</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ PIPELINE MANAGER ════════ */}
        <TabsContent value="pipeline_manager" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-[200px] bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Lead Pipeline</SelectItem>
                <SelectItem value="investors">Investor Pipeline</SelectItem>
                <SelectItem value="deal_pipeline">Deal Pipeline</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">{pipelineStages.length} stages</Badge>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pipeline Stages</CardTitle>
              <CardDescription className="text-xs">Rename, reorder, add, or remove stages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {pipelineStages.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                  <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.options_json?.color || "#888" }} />
                  <span className={`text-sm flex-1 font-medium ${!item.is_visible ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">#{idx + 1}</Badge>
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorder(pipelineStages, idx, "up")} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorder(pipelineStages, idx, "down")} disabled={idx === pipelineStages.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setEditLabel(item.label); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(item)}>{item.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 flex gap-2">
              <Input placeholder="New stage name..." value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} className="flex-1" onKeyDown={e => { if (e.key === "Enter") addStage(); }} />
              <Button onClick={addStage} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Stage</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ LABELS & TERMINOLOGY ════════ */}
        <TabsContent value="labels" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Labels & Terminology</CardTitle>
              <CardDescription className="text-xs">Customize the language used across your CRM. Changes apply to your workspace only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEFAULT_TERMS.map(term => {
                const currentLabel = getTermLabel(term.key);
                return (
                  <TermRow key={term.key} termKey={term.key} defaultLabel={term.default} description={term.desc} currentLabel={currentLabel} onSave={saveTerm} />
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════ VISIBILITY CONTROLS ════════ */}
        <TabsContent value="visibility" className="mt-4 space-y-4">
          {/* Sidebar tab visibility */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sidebar Tab Visibility</CardTitle>
              <CardDescription className="text-xs">Control which tabs appear in your CRM navigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tabs.map(item => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-secondary/20">
                  <div className="flex items-center gap-2">
                    {item.is_visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className={`text-sm ${item.is_visible ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                  </div>
                  <Switch checked={item.is_visible} onCheckedChange={() => toggleVisibility(item)} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dashboard widget visibility */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Dashboard Widgets</CardTitle>
              <CardDescription className="text-xs">Choose which widgets appear on the Executive Dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {widgets.length > 0 ? widgets.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`text-sm ${w.is_visible ? "text-foreground" : "text-muted-foreground"}`}>{w.widget_label}</span>
                  </div>
                  <Switch checked={w.is_visible} onCheckedChange={() => toggleWidget(w.id, w.is_visible)} />
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">No widget settings configured</p>
                  <Button size="sm" variant="outline" onClick={seedWidgets} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Initialize Widget Settings</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Rename Dialog ── */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Rename</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">New Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveRename(); }} autoFocus /></div>
            <Button onClick={saveRename} className="w-full gap-1.5"><Save className="h-4 w-4" />Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>"{deleteItem?.label}"</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" onClick={() => setDeleteItem(null)} className="flex-1 gap-1.5"><X className="h-4 w-4" />Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="flex-1 gap-1.5"><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Field Dialog ── */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Custom Field</DialogTitle><DialogDescription>Add a new field to the {CRM_MODULES.find(m => m.value === selectedModule)?.label} module</DialogDescription></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Field Label *</Label><Input value={newField.field_label} onChange={e => setNewField(f => ({ ...f, field_label: e.target.value }))} placeholder="e.g. Referral Source" /></div>
            <div><Label className="text-xs">Field Type</Label>
              <Select value={newField.field_type} onValueChange={v => setNewField(f => ({ ...f, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {newField.field_type === "dropdown" && (
              <div><Label className="text-xs">Dropdown Options (comma-separated)</Label><Input value={newField.options} onChange={e => setNewField(f => ({ ...f, options: e.target.value }))} placeholder="Option 1, Option 2, Option 3" /></div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={newField.is_required} onCheckedChange={v => setNewField(f => ({ ...f, is_required: v }))} />
              <Label className="text-xs">Mark as required</Label>
            </div>
            <Button onClick={handleAddField} className="w-full gap-1.5"><Plus className="h-4 w-4" />Add Field</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Inline editable term row ── */
function TermRow({ termKey, defaultLabel, description, currentLabel, onSave }: {
  termKey: string; defaultLabel: string; description: string; currentLabel: string;
  onSave: (key: string, label: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentLabel);

  useEffect(() => { setValue(currentLabel); }, [currentLabel]);

  const handleSave = async () => {
    await onSave(termKey, value);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-secondary/20">
      <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{description}</p>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <Input value={value} onChange={e => setValue(e.target.value)} className="h-7 text-sm" autoFocus onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }} />
            <Button size="sm" className="h-7 gap-1" onClick={handleSave}><CheckCircle className="h-3 w-3" />Save</Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditing(false); setValue(currentLabel); }}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-medium text-foreground">{currentLabel}</span>
            {currentLabel !== defaultLabel && <Badge variant="secondary" className="text-[9px]">customized</Badge>}
          </div>
        )}
      </div>
      {!editing && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /></Button>}
    </div>
  );
}
