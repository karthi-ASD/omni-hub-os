import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Route, Plus, Users, History, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AssignmentRule { id: string; business_id: string; website_id: string | null; rule_name: string; mode: string; is_active: boolean; config_json: any; created_at: string; }
interface AssignmentLog { id: string; lead_id: string; to_employee_id: string; assigned_by: string; reason: string | null; created_at: string; }

const LeadRoutingPage = () => {
  const { profile } = useAuth();
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [logs, setLogs] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mode: "round_robin", config: "{}" });

  const fetchRules = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase.from("lead_assignment_rules").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false });
    setRules((data as AssignmentRule[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchLogs = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase.from("lead_assignment_logs").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false }).limit(50);
    setLogs((data as AssignmentLog[]) || []);
  }, [profile?.business_id]);

  useEffect(() => { fetchRules(); fetchLogs(); }, [fetchRules, fetchLogs]);

  const handleCreate = async () => {
    if (!profile?.business_id || !form.name) return;
    let configJson: any;
    try { configJson = JSON.parse(form.config); } catch { toast.error("Invalid JSON config"); return; }
    const { error } = await supabase.from("lead_assignment_rules").insert({
      business_id: profile.business_id, rule_name: form.name, mode: form.mode as any, config_json: configJson,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Rule created");
    setCreateOpen(false);
    setForm({ name: "", mode: "round_robin", config: "{}" });
    fetchRules();
  };

  const toggleRule = async (id: string, active: boolean) => {
    await supabase.from("lead_assignment_rules").update({ is_active: !active }).eq("id", id);
    fetchRules();
  };

  const modeColors: Record<string, string> = {
    round_robin: "bg-primary/10 text-primary",
    territory: "bg-success/10 text-success",
    priority: "bg-warning/10 text-warning",
    ai_score: "bg-violet-500/10 text-violet-500",
    manual: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Lead Routing"
        icon={Route}
        actions={[{ label: "Add Rule", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Rules</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-4 w-4 mr-1" /> Assignment Log</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-3 mt-3">
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No routing rules configured.</p>
          ) : rules.map(r => (
            <Card key={r.id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.rule_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={modeColors[r.mode] || ""}>{r.mode.replace("_", " ")}</Badge>
                    <Badge variant={r.is_active ? "default" : "outline"} className={r.is_active ? "bg-success/10 text-success" : "text-muted-foreground"}>
                      {r.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleRule(r.id, r.is_active)}>
                  {r.is_active ? "Disable" : "Enable"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="space-y-2 mt-3">
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No assignment logs yet.</p>
          ) : logs.map(l => (
            <div key={l.id} className="flex items-center gap-3 py-2 px-3 bg-card rounded-lg border border-border">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{l.reason || "Assigned"}</p>
                <p className="text-[10px] text-muted-foreground">via {l.assigned_by} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Routing Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Rule Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
            <div><Label>Mode</Label>
              <Select value={form.mode} onValueChange={v => setForm(p => ({...p, mode: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="territory">Territory</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="ai_score">AI Score</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Config (JSON)</Label>
              <Textarea value={form.config} onChange={e => setForm(p => ({...p, config: e.target.value}))} className="font-mono text-xs" rows={6} />
            </div>
            <Button onClick={handleCreate} className="w-full">Create Rule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadRoutingPage;
