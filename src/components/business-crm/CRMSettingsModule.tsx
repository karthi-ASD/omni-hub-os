import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowUp, ArrowDown, Pencil, Trash2, Plus, Save, GripVertical,
  Eye, EyeOff, Settings, Layers, GitBranch,
} from "lucide-react";
import { toast } from "sonner";

interface ConfigItem {
  id: string;
  config_type: string;
  module: string;
  key: string;
  label: string;
  sort_order: number;
  is_visible: boolean;
  is_required: boolean;
  field_type: string | null;
  options_json: any;
}

export function CRMSettingsModule() {
  const { profile } = useAuth();
  const { refetchTabs, businessId } = useBusinessCRM();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [newStageLabel, setNewStageLabel] = useState("");
  const [newStageModule, setNewStageModule] = useState("investor_pipeline");

  const { data: allConfig = [], refetch } = useQuery({
    queryKey: ["crm-config-all", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase
        .from("business_crm_config")
        .select("*")
        .eq("business_id", businessId)
        .order("sort_order");
      return (data || []) as ConfigItem[];
    },
    enabled: !!businessId,
  });

  const tabs = allConfig.filter(c => c.config_type === "tab");
  const investorStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "investor_pipeline");
  const dealStages = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === "deals");

  const toggleVisibility = async (item: ConfigItem) => {
    await supabase.from("business_crm_config")
      .update({ is_visible: !item.is_visible, updated_at: new Date().toISOString() } as any)
      .eq("id", item.id);
    refetch();
    refetchTabs();
    toast.success(`${item.label} ${item.is_visible ? "hidden" : "shown"}`);
  };

  const reorder = async (items: ConfigItem[], index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const updates = items.map((item, i) => {
      if (i === index) return { ...item, sort_order: items[newIndex].sort_order };
      if (i === newIndex) return { ...item, sort_order: items[index].sort_order };
      return item;
    });
    for (const u of updates) {
      await supabase.from("business_crm_config")
        .update({ sort_order: u.sort_order, updated_at: new Date().toISOString() } as any)
        .eq("id", u.id);
    }
    refetch();
    refetchTabs();
  };

  const saveRename = async () => {
    if (!editItem || !editLabel.trim()) return;
    await supabase.from("business_crm_config")
      .update({ label: editLabel.trim(), updated_at: new Date().toISOString() } as any)
      .eq("id", editItem.id);
    setEditItem(null);
    refetch();
    refetchTabs();
    toast.success("Renamed successfully");
  };

  const addStage = async () => {
    if (!newStageLabel.trim() || !businessId) return;
    const existing = allConfig.filter(c => c.config_type === "pipeline_stage" && c.module === newStageModule);
    const key = newStageLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("business_crm_config").insert({
      business_id: businessId,
      config_type: "pipeline_stage",
      module: newStageModule,
      key,
      label: newStageLabel.trim(),
      sort_order: existing.length + 1,
      is_visible: true,
      options_json: { color: "#D4A574" },
    } as any);
    if (error) { toast.error("Failed to add stage"); return; }
    setNewStageLabel("");
    refetch();
    queryClient.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Stage added");
  };

  const deleteStage = async (item: ConfigItem) => {
    if (!confirm(`Delete stage "${item.label}"? This cannot be undone.`)) return;
    await supabase.from("business_crm_config").delete().eq("id", item.id);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["crm-pipeline-stages"] });
    toast.success("Stage deleted");
  };

  const renderConfigList = (items: ConfigItem[], title: string) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${!item.is_visible ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.label}</span>
            </div>
            {item.options_json?.color && (
              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.options_json.color }} />
            )}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorder(items, index, "up")} disabled={index === 0}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => reorder(items, index, "down")} disabled={index === items.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditItem(item); setEditLabel(item.label); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleVisibility(item)}>
                {item.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              {item.config_type === "pipeline_stage" && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteStage(item)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">CRM Configuration</h2>
        <p className="text-sm text-muted-foreground">Customize your workspace tabs, pipeline stages, and fields</p>
      </div>

      <Tabs defaultValue="tabs">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="tabs" className="gap-1.5 text-xs"><Layers className="h-3.5 w-3.5" />Tabs</TabsTrigger>
          <TabsTrigger value="investor_stages" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" />Investor Stages</TabsTrigger>
          <TabsTrigger value="deal_stages" className="gap-1.5 text-xs"><GitBranch className="h-3.5 w-3.5" />Deal Stages</TabsTrigger>
        </TabsList>

        <TabsContent value="tabs" className="mt-4">
          {renderConfigList(tabs, "CRM Tabs")}
        </TabsContent>

        <TabsContent value="investor_stages" className="mt-4 space-y-4">
          {renderConfigList(investorStages, "Investor Pipeline Stages")}
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex gap-2">
              <Input placeholder="New stage name..." value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} className="flex-1" onKeyDown={e => { if (e.key === "Enter") { setNewStageModule("investor_pipeline"); addStage(); } }} />
              <Button onClick={() => { setNewStageModule("investor_pipeline"); addStage(); }} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deal_stages" className="mt-4 space-y-4">
          {renderConfigList(dealStages, "Deal Pipeline Stages")}
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex gap-2">
              <Input placeholder="New stage name..." value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} className="flex-1" onKeyDown={e => { if (e.key === "Enter") { setNewStageModule("deals"); addStage(); } }} />
              <Button onClick={() => { setNewStageModule("deals"); addStage(); }} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rename Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveRename(); }} /></div>
            <Button onClick={saveRename} className="w-full gap-1.5"><Save className="h-4 w-4" />Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
