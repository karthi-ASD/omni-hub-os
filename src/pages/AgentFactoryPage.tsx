import { useState } from "react";
import { useAgentFactory } from "@/hooks/useAgentFactory";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bot, Plus, Cpu, Zap, Shield, GitBranch, Settings2,
} from "lucide-react";
import { format } from "date-fns";

const agentTypes = ["TEXT", "WHATSAPP", "SMS", "EMAIL", "VOICE", "MULTI"];
const scopeTypes = ["LEADS", "CLIENTS", "JOBS", "TICKETS", "ALL"];
const statusOptions = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  PAUSED: "bg-amber-500/20 text-amber-400",
  ARCHIVED: "bg-red-500/20 text-red-400",
};

const AgentFactoryPage = () => {
  usePageTitle("Agent Factory");
  const { agents, versions, assignments, loading, createAgent, createVersion, assignAgent, fetchVersions } = useAgentFactory();
  const [tab, setTab] = useState("agents");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [versionDialog, setVersionDialog] = useState<string | null>(null);
  const [assignDialog, setAssignDialog] = useState<string | null>(null);

  // Agent form
  const [agentName, setAgentName] = useState("");
  const [agentScope, setAgentScope] = useState("lead_qualification");
  const [agentEnabled, setAgentEnabled] = useState(true);

  // Version form
  const [systemPrompt, setSystemPrompt] = useState("");
  const [safetyRules, setSafetyRules] = useState("");

  // Assign form
  const [assignScope, setAssignScope] = useState("ALL");

  const handleCreateAgent = async () => {
    if (!agentName.trim()) return;
    await createAgent({ agent_name: agentName, scope: agentScope, enabled: agentEnabled });
    setDialogOpen(false);
    setAgentName("");
  };

  const handleCreateVersion = async () => {
    if (!versionDialog || !systemPrompt.trim()) return;
    await createVersion(versionDialog, { system_prompt: systemPrompt, safety_rules: safetyRules });
    setVersionDialog(null);
    setSystemPrompt("");
    setSafetyRules("");
  };

  const handleAssign = async () => {
    if (!assignDialog) return;
    await assignAgent(assignDialog, assignScope);
    setAssignDialog(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Factory</h1>
          <p className="text-sm text-muted-foreground">Create and manage AI agents with versioned prompts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b48]">
              <Plus className="h-4 w-4 mr-2" /> New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create AI Agent</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Agent Name" value={agentName} onChange={e => setAgentName(e.target.value)} />
              <Select value={agentScope} onValueChange={setAgentScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["lead_qualification","support","billing","seo","followup","other"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateAgent} className="w-full bg-[#d4a853] text-[#0a0e1a]">Create Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: agents.length, icon: Bot, color: "text-[#d4a853]" },
          { label: "Active", value: agents.filter(a => a.enabled).length, icon: Zap, color: "text-emerald-400" },
          { label: "Versions", value: versions.length, icon: GitBranch, color: "text-blue-400" },
          { label: "Assignments", value: assignments.length, icon: Settings2, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No agents yet</TableCell></TableRow>
                  ) : (
                    agents.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-[#d4a853]" />
                            <span className="font-medium">{a.agent_name}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{a.scope}</Badge></TableCell>
                        <TableCell>
                          <Badge className={a.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                            {a.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(a.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setVersionDialog(a.id); fetchVersions(a.id); }}>
                              <GitBranch className="h-3 w-3 mr-1" /> Version
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAssignDialog(a.id)}>
                              <Cpu className="h-3 w-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Triggers</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No assignments</TableCell></TableRow>
                  ) : (
                    assignments.map(a => {
                      const agent = agents.find(ag => ag.id === a.agent_id);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{agent?.agent_name || "Unknown"}</TableCell>
                          <TableCell><Badge variant="outline">{a.scope_type}</Badge></TableCell>
                          <TableCell>
                            <Badge className={a.triggers_enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}>
                              {a.triggers_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(a.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Version Dialog */}
      <Dialog open={!!versionDialog} onOpenChange={v => !v && setVersionDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Agent Version</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea placeholder="System prompt..." rows={6} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
            <Textarea placeholder="Safety rules..." rows={3} value={safetyRules} onChange={e => setSafetyRules(e.target.value)} />
            <Button onClick={handleCreateVersion} className="w-full bg-[#d4a853] text-[#0a0e1a]">Activate Version</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={v => !v && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Agent</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={assignScope} onValueChange={setAssignScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {scopeTypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleAssign} className="w-full bg-[#d4a853] text-[#0a0e1a]">Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentFactoryPage;
