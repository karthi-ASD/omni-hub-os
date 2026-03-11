import React, { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useWorkflowAutomation,
  TRIGGER_TYPES,
  ACTION_TYPES,
  WORKFLOW_TEMPLATES,
} from "@/hooks/useWorkflowAutomation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Workflow, Plus, Trash2, Zap, ArrowRight, Clock,
  CheckCircle, FileText, Play, History, Copy, Sparkles,
} from "lucide-react";

const WorkflowAutomationPage = () => {
  usePageTitle("Workflow Automation", "Configure automated workflows for agency operations");
  const {
    rules, runs, loading, createRule, toggleRule, deleteRule, createFromTemplate,
  } = useWorkflowAutomation();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger_event_type: "",
    condition_field: "",
    condition_value: "",
    actions: [] as { type: string; config: Record<string, any> }[],
    task_list: "",
    department: "",
    notify_role: "",
    notify_message: "",
    sla_hours: "",
  });

  const addAction = (type: string) => {
    if (form.actions.find((a) => a.type === type)) return;
    setForm({ ...form, actions: [...form.actions, { type, config: {} }] });
  };

  const removeAction = (type: string) => {
    setForm({ ...form, actions: form.actions.filter((a) => a.type !== type) });
  };

  const handleCreate = async () => {
    if (!form.name || !form.trigger_event_type || form.actions.length === 0) {
      toast.error("Name, trigger, and at least one action required");
      return;
    }

    const actions = form.actions.map((a) => {
      if (a.type === "create_tasks" && form.task_list) {
        return { ...a, config: { tasks: form.task_list.split("\n").map((t) => t.trim()).filter(Boolean) } };
      }
      if (a.type === "assign_department" && form.department) {
        return { ...a, config: { department: form.department } };
      }
      if (a.type === "notify_user" && form.notify_role) {
        return { ...a, config: { role: form.notify_role, message: form.notify_message } };
      }
      if (a.type === "create_sla" && form.sla_hours) {
        return { ...a, config: { default_hours: parseInt(form.sla_hours) } };
      }
      return a;
    });

    const config_json = {
      condition: form.condition_field
        ? { field: form.condition_field, operator: "equals", value: form.condition_value }
        : null,
      actions,
    };

    await createRule({ name: form.name, trigger_event_type: form.trigger_event_type, config_json });
    setCreateOpen(false);
    setForm({ name: "", trigger_event_type: "", condition_field: "", condition_value: "", actions: [], task_list: "", department: "", notify_role: "", notify_message: "", sla_hours: "" });
  };

  const triggerLabel = (key: string) => TRIGGER_TYPES.find((t) => t.key === key)?.label || key;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={Workflow}
        title="Workflow Automation Engine"
        subtitle="Automate client onboarding, task creation, department assignments, and notifications"
        badge="Operations"
      />

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows"><Zap className="h-3.5 w-3.5 mr-1.5" /> Workflows</TabsTrigger>
          <TabsTrigger value="templates"><Copy className="h-3.5 w-3.5 mr-1.5" /> Templates</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-3.5 w-3.5 mr-1.5" /> Run Logs</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Workflow</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Workflow Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SEO Client Onboarding" />
                  </div>

                  {/* Trigger */}
                  <div>
                    <Label>Trigger Event *</Label>
                    <Select value={form.trigger_event_type} onValueChange={(v) => setForm({ ...form, trigger_event_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((t) => (
                          <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Condition */}
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Condition (optional)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Field (e.g. service_type)" value={form.condition_field} onChange={(e) => setForm({ ...form, condition_field: e.target.value })} />
                      <Input placeholder="Value (e.g. SEO)" value={form.condition_value} onChange={(e) => setForm({ ...form, condition_value: e.target.value })} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Label>Actions *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ACTION_TYPES.map((a) => {
                        const selected = form.actions.some((fa) => fa.type === a.key);
                        return (
                          <Badge
                            key={a.key}
                            variant={selected ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => selected ? removeAction(a.key) : addAction(a.key)}
                          >
                            {selected ? "✓ " : "+ "}{a.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action configs */}
                  {form.actions.some((a) => a.type === "create_tasks") && (
                    <div>
                      <Label>Task List (one per line)</Label>
                      <Textarea
                        value={form.task_list}
                        onChange={(e) => setForm({ ...form, task_list: e.target.value })}
                        placeholder={"Website Audit\nKeyword Research\nCompetitor Analysis"}
                        rows={5}
                      />
                    </div>
                  )}

                  {form.actions.some((a) => a.type === "assign_department") && (
                    <div>
                      <Label>Department Name</Label>
                      <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. SEO" />
                    </div>
                  )}

                  {form.actions.some((a) => a.type === "notify_user") && (
                    <div className="space-y-2">
                      <Label>Notify Role</Label>
                      <Input value={form.notify_role} onChange={(e) => setForm({ ...form, notify_role: e.target.value })} placeholder="e.g. manager" />
                      <Label>Notification Message</Label>
                      <Input value={form.notify_message} onChange={(e) => setForm({ ...form, notify_message: e.target.value })} placeholder="e.g. New client onboarded" />
                    </div>
                  )}

                  {form.actions.some((a) => a.type === "create_sla") && (
                    <div>
                      <Label>Default SLA Hours</Label>
                      <Input type="number" value={form.sla_hours} onChange={(e) => setForm({ ...form, sla_hours: e.target.value })} placeholder="e.g. 48" />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create Workflow</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No workflows yet</p>
                <p className="text-sm text-muted-foreground/70">Create a workflow or use a template to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const config = rule.config_json || {};
                const actions = config.actions || [];
                const condition = config.condition;
                return (
                  <Card key={rule.id} className="hover:shadow-elevated transition-shadow rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm">{rule.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <Badge variant="secondary" className="text-[10px]">
                              <Play className="h-3 w-3 mr-0.5" /> {triggerLabel(rule.trigger_event_type)}
                            </Badge>
                            {condition && (
                              <>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Badge variant="outline" className="text-[10px]">
                                  {condition.field} = {condition.value}
                                </Badge>
                              </>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {actions.map((a: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {ACTION_TYPES.find((at) => at.key === a.type)?.label || a.type}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Created {new Date(rule.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_enabled}
                            onCheckedChange={(v) => toggleRule(rule.id, v)}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRule(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <p className="text-sm text-muted-foreground">Pre-built workflow templates — click to create instantly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKFLOW_TEMPLATES.map((tpl, idx) => (
              <Card key={idx} className="hover:shadow-elevated transition-shadow cursor-pointer group rounded-2xl" onClick={() => createFromTemplate(idx)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{tpl.name}</h3>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Use
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{triggerLabel(tpl.trigger)}</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <span>{tpl.config.actions.length} actions</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tpl.config.actions.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {ACTION_TYPES.find((at) => at.key === a.type)?.label || a.type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {runs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No workflow runs yet</p>
                <p className="text-sm text-muted-foreground/70">Workflow execution history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-medium text-muted-foreground">Workflow</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => {
                        const rule = rules.find((r) => r.id === run.rule_id);
                        return (
                          <tr key={run.id} className="border-b hover:bg-muted/30">
                            <td className="p-3 font-medium">{rule?.name || "Deleted workflow"}</td>
                            <td className="p-3">
                              <Badge variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                                {run.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{new Date(run.created_at).toLocaleString()}</td>
                            <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {run.logs_json ? JSON.stringify(run.logs_json).slice(0, 80) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Trigger → Action</p>
            <p className="text-xs text-muted-foreground">
              Workflows fire when system events occur. Configure conditions to filter events and chain multiple actions.
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">SLA Integration</p>
            <p className="text-xs text-muted-foreground">
              Auto-create SLA deadlines with workflows. Tasks are tracked and alerts fire when deadlines approach.
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">RBAC Aware</p>
            <p className="text-xs text-muted-foreground">
              Notifications and assignments respect role permissions. Managers receive department tasks automatically.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowAutomationPage;
