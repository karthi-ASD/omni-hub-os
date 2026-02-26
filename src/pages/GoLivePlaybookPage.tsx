import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ChecklistItem {
  id: string;
  category: string;
  item_key: string;
  label: string;
  is_required: boolean;
  is_checked: boolean;
  notes: string | null;
}

const GoLivePlaybookPage = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase.from("go_live_checklist").select("*").order("category");
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const toggle = async (id: string, checked: boolean) => {
    await supabase.from("go_live_checklist").update({ is_checked: checked, updated_at: new Date().toISOString() } as any).eq("id", id);
    setItems(items.map(i => i.id === id ? { ...i, is_checked: checked } : i));
  };

  const byCategory = (cat: string) => items.filter(i => i.category === cat);
  const progress = (cat: string) => {
    const catItems = byCategory(cat);
    if (!catItems.length) return 0;
    return Math.round((catItems.filter(i => i.is_checked).length / catItems.length) * 100);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const renderList = (cat: string) => (
    <div className="space-y-3">
      {byCategory(cat).map(item => (
        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
          <Checkbox checked={item.is_checked} onCheckedChange={(v) => toggle(item.id, !!v)} />
          <span className={`text-sm flex-1 ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
          {item.is_required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Go-Live Playbook</h1>
        <p className="text-muted-foreground">Pre-launch checklists for Web, Mobile, and Tenant onboarding</p>
      </div>

      <Tabs defaultValue="web">
        <TabsList>
          <TabsTrigger value="web"><Monitor className="h-4 w-4 mr-1" /> Web ({progress("web")}%)</TabsTrigger>
          <TabsTrigger value="mobile"><Smartphone className="h-4 w-4 mr-1" /> Mobile ({progress("mobile")}%)</TabsTrigger>
          <TabsTrigger value="tenant"><Users className="h-4 w-4 mr-1" /> Tenant ({progress("tenant")}%)</TabsTrigger>
        </TabsList>
        <TabsContent value="web"><Card><CardHeader><CardTitle className="text-base">Web Go-Live Checklist</CardTitle></CardHeader><CardContent>{renderList("web")}</CardContent></Card></TabsContent>
        <TabsContent value="mobile"><Card><CardHeader><CardTitle className="text-base">Mobile Go-Live Checklist</CardTitle></CardHeader><CardContent>{renderList("mobile")}</CardContent></Card></TabsContent>
        <TabsContent value="tenant"><Card><CardHeader><CardTitle className="text-base">Tenant Onboarding Checklist</CardTitle></CardHeader><CardContent>{renderList("tenant")}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default GoLivePlaybookPage;
