import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface AssignmentRule {
  id: string;
  business_id: string;
  website_id: string | null;
  rule_name: string;
  mode: string;
  is_active: boolean;
  config_json: any;
  created_at: string;
}

interface AssignmentLog {
  id: string;
  lead_id: string;
  to_employee_id: string;
  assigned_by: string;
  reason: string | null;
  created_at: string;
}

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
    const { data } = await supabase
      .from("lead_assignment_rules")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRules((data as AssignmentRule[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchLogs = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("lead_assignment_logs")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data as AssignmentLog[]) || []);
  }, [profile?.business_id]);

  useEffect(() => { fetchRules(); fetchLogs(); }, [fetchRules, fetchLogs]);

  const handleCreate = async () => {
    if (!profile?.business_id || !form.name) return;
    let configJson: any;
    try { configJson = JSON.parse(form.config); } catch { toast.error("Invalid JSON config"); return; }
    const { error } = await supabase.from("lead_assignment_rules").insert({
      business_id: profile.business_id,
      rule_name: form.name,
      mode: form.mode as any,
      config_json: configJson,
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
    round_robin: "bg-blue-500/10 text-blue-400",
    territory: "bg-emerald-500/10 text-emerald-400",
    priority: "bg-orange-500/10 text-orange-400",
    ai_score: "bg-purple-500/10 text-purple-400",
    manual: "bg-gray-500/10 text-gray-400",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Route className="h-6 w-6 text-[#d4a853]" /> Lead Routing
        </h1>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="bg-[#0a0e1a] border border-[#1e2a4a]">
          <TabsTrigger value="rules"><Settings2 className="h-4 w-4 mr-1" /> Rules</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-4 w-4 mr-1" /> Assignment Log</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-3 mt-3">
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : rules.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No routing rules configured.</p>
          ) : rules.map(r => (
            <Card key={r.id} className="bg-[#111832] border-[#1e2a4a]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{r.rule_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={modeColors[r.mode] || ""}>{r.mode.replace("_", " ")}</Badge>
                    <Badge variant={r.is_active ? "default" : "outline"} className={r.is_active ? "bg-emerald-500/10 text-emerald-400" : "text-gray-500"}>
                      {r.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleRule(r.id, r.is_active)}
                  className="border-[#1e2a4a] text-gray-400">{r.is_active ? "Disable" : "Enable"}</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="space-y-2 mt-3">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No assignment logs yet.</p>
          ) : logs.map(l => (
            <div key={l.id} className="flex items-center gap-3 py-2 px-3 bg-[#111832] rounded-lg border border-[#1e2a4a]">
              <Users className="h-4 w-4 text-[#d4a853] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{l.reason || "Assigned"}</p>
                <p className="text-[10px] text-gray-500">via {l.assigned_by} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111832] border-[#1e2a4a] text-white">
          <DialogHeader><DialogTitle>New Routing Rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-gray-400">Rule Name</Label><Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="bg-[#0a0e1a] border-[#1e2a4a] text-white" /></div>
            <div>
              <Label className="text-gray-400">Mode</Label>
              <Select value={form.mode} onValueChange={v => setForm(p => ({...p, mode: v}))}>
                <SelectTrigger className="bg-[#0a0e1a] border-[#1e2a4a] text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="territory">Territory</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="ai_score">AI Score</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Config (JSON)</Label>
              <Textarea value={form.config} onChange={e => setForm(p => ({...p, config: e.target.value}))}
                className="bg-[#0a0e1a] border-[#1e2a4a] text-white font-mono text-xs" rows={6} />
            </div>
            <Button onClick={handleCreate} className="w-full bg-[#d4a853] hover:bg-[#b8902e] text-[#0a0e1a]">Create Rule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadRoutingPage;
