import { useState } from "react";
import { useAutonomousAgents } from "@/hooks/useAutonomousAgents";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Play, Shield, CheckCircle, XCircle, Cpu, AlertTriangle, Plus, Workflow, Wrench, BookOpen } from "lucide-react";

const agentTypes = ["SALES", "MARKETING", "SUPPORT", "FINANCE"];
const modes = ["SUGGEST", "EXECUTE", "HYBRID"];
const riskLevels = ["LOW", "MEDIUM", "HIGH"];
const enforcements = ["BLOCK", "REQUIRE_APPROVAL", "WARN"];

const AutonomousAgentsPage = () => {
  usePageTitle("Autonomous AI Agents");
  const {
    agents, playbooks, runs, approvals, guardrails, toolConnections,
    pendingApprovals, todayRuns, failedRuns, loading,
    createAgent, toggleAgent, updateAgentMode, triggerRun, approveAction, createGuardrail,
  } = useAutonomousAgents();

  const [newAgent, setNewAgent] = useState({ name: "", agent_type: "SALES", mode: "SUGGEST" });
  const [newGuardrail, setNewGuardrail] = useState({ agent_type: "SALES", risk_level: "MEDIUM", rule_name: "", enforcement: "REQUIRE_APPROVAL" });
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [guardrailDialogOpen, setGuardrailDialogOpen] = useState(false);

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim()) return;
    await createAgent(newAgent);
    setNewAgent({ name: "", agent_type: "SALES", mode: "SUGGEST" });
    setAgentDialogOpen(false);
  };

  const handleCreateGuardrail = async () => {
    if (!newGuardrail.rule_name.trim()) return;
    await createGuardrail(newGuardrail);
    setNewGuardrail({ agent_type: "SALES", risk_level: "MEDIUM", rule_name: "", enforcement: "REQUIRE_APPROVAL" });
    setGuardrailDialogOpen(false);
  };

  const statusColor = (s: string) => {
    if (s === "COMPLETED" || s === "APPROVED") return "default";
    if (s === "FAILED" || s === "REJECTED") return "destructive";
    if (s === "RUNNING" || s === "QUEUED") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Autonomous AI Agents</h1>
            <p className="text-sm text-muted-foreground">Execute tasks across Sales, Marketing, Support & Finance</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-border"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{agents.filter((a) => a.is_enabled).length}</p>
          <p className="text-xs text-muted-foreground">Active Agents</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{todayRuns.length}</p>
          <p className="text-xs text-muted-foreground">Runs Today</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendingApprovals.length}</p>
          <p className="text-xs text-muted-foreground">Pending Approvals</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{runs.filter((r) => r.status === "COMPLETED").length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </CardContent></Card>
        <Card className="border-border"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-destructive">{failedRuns.length}</p>
          <p className="text-xs text-muted-foreground">Errors (24h)</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
        </TabsList>

        {/* AGENTS TAB */}
        <TabsContent value="agents" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Agent</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Agent</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Agent name" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
                  <Select value={newAgent.agent_type} onValueChange={(v) => setNewAgent({ ...newAgent, agent_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{agentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newAgent.mode} onValueChange={(v) => setNewAgent({ ...newAgent, mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={handleCreateAgent} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {agents.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No agents created yet.</p>}
          {agents.map((a) => (
            <Card key={a.id} className="border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={a.is_enabled} onCheckedChange={(v) => toggleAgent(a.id, v)} />
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{a.agent_type}</Badge>
                      <Select value={a.mode} onValueChange={(v) => updateAgentMode(a.id, v)}>
                        <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => triggerRun(a.id)} disabled={!a.is_enabled}>
                  <Play className="h-3 w-3 mr-1" />Run
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* PLAYBOOKS TAB */}
        <TabsContent value="playbooks" className="space-y-3 mt-4">
          {playbooks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No playbooks yet.</p>}
          {playbooks.map((p) => (
            <Card key={p.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.agent_type}</Badge>
                      <Badge variant="secondary" className="text-xs">{p.trigger_type}</Badge>
                      <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">{p.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{Array.isArray(p.steps_json) ? p.steps_json.length : 0} steps</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RUNS TAB */}
        <TabsContent value="runs" className="space-y-3 mt-4">
          {runs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No runs yet.</p>}
          {runs.slice(0, 30).map((r) => (
            <Card key={r.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColor(r.status) as any} className="text-xs">{r.status}</Badge>
                      <span className="text-xs text-muted-foreground">{r.trigger_source}</span>
                    </div>
                    {r.error_message && <p className="text-xs text-destructive mt-1">{r.error_message}</p>}
                  </div>
                  <div className="text-right">
                    {r.confidence_score != null && <p className="text-sm font-medium">{r.confidence_score}%</p>}
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* APPROVALS TAB */}
        <TabsContent value="approvals" className="space-y-3 mt-4">
          {approvals.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No approvals yet.</p>}
          {approvals.map((a) => (
            <Card key={a.id} className="border-border">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <Badge variant={statusColor(a.status) as any} className="text-xs">{a.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">By: {a.requested_by} · Role: {a.approver_role}</p>
                  {a.reason && <p className="text-xs mt-1">{a.reason}</p>}
                </div>
                {a.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => approveAction(a.id, true)}>
                      <CheckCircle className="h-3 w-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => approveAction(a.id, false, "Rejected by admin")}>
                      <XCircle className="h-3 w-3 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* GUARDRAILS TAB */}
        <TabsContent value="guardrails" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Dialog open={guardrailDialogOpen} onOpenChange={setGuardrailDialogOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Shield className="h-4 w-4 mr-1" />Add Guardrail</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Guardrail</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Rule name" value={newGuardrail.rule_name} onChange={(e) => setNewGuardrail({ ...newGuardrail, rule_name: e.target.value })} />
                  <Select value={newGuardrail.agent_type} onValueChange={(v) => setNewGuardrail({ ...newGuardrail, agent_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{agentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newGuardrail.risk_level} onValueChange={(v) => setNewGuardrail({ ...newGuardrail, risk_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{riskLevels.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newGuardrail.enforcement} onValueChange={(v) => setNewGuardrail({ ...newGuardrail, enforcement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{enforcements.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={handleCreateGuardrail} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {guardrails.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No guardrails configured.</p>}
          {guardrails.map((g) => (
            <Card key={g.id} className="border-border">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{g.rule_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{g.agent_type}</Badge>
                      <Badge variant={g.risk_level === "HIGH" ? "destructive" : "secondary"} className="text-xs">{g.risk_level}</Badge>
                      <Badge variant="secondary" className="text-xs">{g.enforcement}</Badge>
                    </div>
                  </div>
                  <Badge variant={g.is_active ? "default" : "secondary"}>{g.is_active ? "Active" : "Off"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutonomousAgentsPage;
