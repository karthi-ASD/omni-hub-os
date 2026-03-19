import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Save, GripVertical, Eye, EyeOff, Layers, GitBranch, Building2, Users, Palette, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { CRMCustomizationPanel } from "./CRMCustomizationPanel";
import { FollowupSettingsPanel } from "./FollowupSettingsPanel";

interface ConfigItem {
  id: string; config_type: string; module: string; key: string; label: string;
  sort_order: number; is_visible: boolean; is_required: boolean; field_type: string | null; options_json: any;
}

export function BusinessSettingsModule() {
  const { profile } = useAuth();
  const { refetchTabs, businessId } = useBusinessCRM();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageModule, setNewStageModule] = useState("leads");

  const { data: allConfig = [], refetch } = useQuery({
    queryKey: ["crm-config-all", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase.from("business_crm_config").select("*").eq("business_id", businessId).order("sort_order");
      return (data || []) as ConfigItem[];
    }, enabled: !!businessId,
  });

  const tabs = allConfig.filter(c => c.config_type === "tab");
  const leadStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "leads");
  const investorStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "investors");
  const dealStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "deal_pipeline");

  const toggleVisibility = async (item: ConfigItem) => {
    await supabase.from("business_crm_config").update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() } as any).eq("id", item.id);
    refetch(); refetchTabs();
    toast.success(`${item.label} ${item.is_visible ? "hidden" : "shown"}`);
  };

  const reorder = async (items: ConfigItem[], index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const a = items[index], b = items[newIndex];
    await Promise.all([
      supabase.from("business_crm_config").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("business_crm_config").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    refetch(); refetchTabs();
  };

  const saveRename = async () => {
    if (!editItem || !editLabel.trim()) return;
    await supabase.from("business_crm_config").update({ label: editLabel.trim(), updated_at: new Date().toISOString() } as any).eq("id", editItem.id);
    setEditItem(null); refetch(); refetchTabs();
    toast.success("Renamed");
  };

  const addStage = async () => {
    if (!newStageLabel.trim() || !businessId) return;
    const existing = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === newStageModule);
    const key = newStageLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("business_crm_config").insert({ business_id: businessId, config_type: "pipeline_stage", module: newStageModule, key, label: newStageLabel.trim(), sort_order: existing.length + 1, is_visible: true, options_json: { color: "#D4A574" } } as any);
    if (error) { toast.error("Failed"); return; }
    setNewStageLabel(""); refetch();
    qc.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Stage added");
  };

  const deleteStage = async (item: ConfigItem) => {
    if (!confirm(`Delete stage "${item.label}"?`)) return;
    await supabase.from("business_crm_config").delete().eq("id", item.id);
    refetch(); qc.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Deleted");
  };

  const renderList = (items: ConfigItem[], title: string, allowDelete = false) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`text-sm flex-1 ${!item.is_visible ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
            {item.options_json?.color && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.options_json.color }} />}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorder(items, idx, "up")} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorder(items, idx, "down")} disabled={idx === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditItem(item); setEditLabel(item.label); }}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleVisibility(item)}>{item.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</Button>
              {allowDelete && <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteStage(item)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderStageSection = (stages: ConfigItem[], module: string, title: string) => (
    <div className="space-y-4">
      {renderList(stages, title, true)}
      <Card className="bg-card border-border"><CardContent className="p-4 flex gap-2">
        <Input placeholder="New stage name..." value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} className="flex-1" onKeyDown={e => { if (e.key === "Enter") { setNewStageModule(module); addStage(); } }} />
        <Button onClick={() => { setNewStageModule(module); addStage(); }} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h2 className="text-lg font-semibold text-foreground">Business Settings</h2><p className="text-sm text-muted-foreground">Manage your CRM workspace configuration</p></div>

      <Tabs defaultValue="crm_customization">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="crm_customization" className="gap-1.5 text-xs"><Settings2 className="h-3.5 w-3.5" />CRM Customization</TabsTrigger>
          <TabsTrigger value="tabs" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Quick Tabs</TabsTrigger>
          <TabsTrigger value="lead_stages" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" />Lead Stages</TabsTrigger>
          <TabsTrigger value="investor_stages" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Investor Stages</TabsTrigger>
          <TabsTrigger value="deal_stages" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" />Deal Stages</TabsTrigger>
        </TabsList>
        <TabsContent value="crm_customization" className="mt-4"><CRMCustomizationPanel /></TabsContent>
        <TabsContent value="tabs" className="mt-4">{renderList(tabs, "CRM Tabs")}</TabsContent>
        <TabsContent value="lead_stages" className="mt-4">{renderStageSection(leadStages, "leads", "Lead Pipeline Stages")}</TabsContent>
        <TabsContent value="investor_stages" className="mt-4">{renderStageSection(investorStages, "investors", "Investor Pipeline Stages")}</TabsContent>
        <TabsContent value="deal_stages" className="mt-4">{renderStageSection(dealStages, "deal_pipeline", "Deal Pipeline Stages")}</TabsContent>
      </Tabs>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Rename</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveRename(); }} /></div>
            <Button onClick={saveRename} className="w-full gap-1.5"><Save className="h-4 w-4" />Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
