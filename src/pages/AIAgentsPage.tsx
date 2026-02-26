import { useAIAgents } from "@/hooks/useAIAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot, CheckCircle, XCircle, Plus, Inbox } from "lucide-react";
import { useState } from "react";

const AIAgentsPage = () => {
  const { agents, tasks, loading, createAgent, toggleAgent, approveTask, rejectTask } = useAIAgents();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ agent_name: "", scope: "sales", autonomy_level: "suggest_only" });

  const pendingTasks = tasks.filter(t => t.status === "needs_approval");

  const handleCreate = async () => {
    const ok = await createAgent(form);
    if (ok) { setOpen(false); setForm({ agent_name: "", scope: "sales", autonomy_level: "suggest_only" }); }
  };

  const scopeColors: Record<string, string> = {
    sales: "text-blue-500", seo: "text-green-500", collections: "text-amber-500",
    support: "text-purple-500", reporting: "text-cyan-500", ads: "text-pink-500",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Autonomous agents with human-in-the-loop safety</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Agent</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create AI Agent</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Agent Name</Label><Input value={form.agent_name} onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))} placeholder="Sales Autopilot" /></div>
              <div><Label>Scope</Label>
                <Select value={form.scope} onValueChange={v => setForm(f => ({ ...f, scope: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="collections">Collections</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="ads">Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Autonomy Level</Label>
                <Select value={form.autonomy_level} onValueChange={v => setForm(f => ({ ...f, autonomy_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggest_only">Suggest Only</SelectItem>
                    <SelectItem value="auto_draft">Auto Draft</SelectItem>
                    <SelectItem value="auto_execute_approved">Auto Execute (Approved)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="inbox">
              <Inbox className="mr-1 h-4 w-4" />Approval Inbox ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="history">Task History</TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => (
                <Card key={agent.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className={`h-5 w-5 ${scopeColors[agent.scope] || "text-muted-foreground"}`} />
                        <CardTitle className="text-base">{agent.agent_name}</CardTitle>
                      </div>
                      <Switch checked={agent.enabled} onCheckedChange={v => toggleAgent(agent.id, v)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">{agent.scope}</Badge>
                      <Badge variant="secondary" className="text-xs">{agent.autonomy_level.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tasks.filter(t => t.agent_id === agent.id).length} tasks generated</p>
                  </CardContent>
                </Card>
              ))}
              {agents.length === 0 && (
                <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No agents configured yet. Create one to get started.</CardContent></Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Agent</TableHead><TableHead>Entity</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pendingTasks.map(task => {
                    const agent = agents.find(a => a.id === task.agent_id);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.task_title}</TableCell>
                        <TableCell>{agent?.agent_name || "Unknown"}</TableCell>
                        <TableCell>{task.related_entity_type || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => approveTask(task.id)}><CheckCircle className="h-4 w-4 text-green-500" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectTask(task.id)}><XCircle className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pendingTasks.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tasks awaiting approval</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Agent</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tasks.map(task => {
                    const agent = agents.find(a => a.id === task.agent_id);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.task_title}</TableCell>
                        <TableCell>{agent?.agent_name || "Unknown"}</TableCell>
                        <TableCell><Badge variant={task.status === "executed" ? "default" : task.status === "failed" ? "destructive" : "outline"}>{task.status}</Badge></TableCell>
                        <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  {tasks.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No task history</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AIAgentsPage;
