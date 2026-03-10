import { useParams, useNavigate } from "react-router-dom";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useTaskConversations } from "@/hooks/useTaskConversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, MessageSquare, Lock, Globe, Send, Clock, User,
  AlertTriangle, CheckCircle, Link2, UserPlus, HelpCircle
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { format, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STATUSES = ["new", "assigned", "in_progress", "under_review", "completed"];

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tasks, update } = useProjectTasks();
  const { internalMessages, customerMessages, send } = useTaskConversations(taskId);
  const [newMessage, setNewMessage] = useState("");
  const [msgType, setMsgType] = useState<"internal" | "customer">("internal");
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [askCustomerOpen, setAskCustomerOpen] = useState(false);
  const [askCreatorOpen, setAskCreatorOpen] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");

  const task = tasks.find((t: any) => t.id === taskId);

  // Load dependencies
  useEffect(() => {
    if (!taskId || !profile?.business_id) return;
    (supabase.from("task_dependencies" as any) as any)
      .select("*, depends_on:depends_on_task_id(id, title, status, task_number)")
      .eq("task_id", taskId)
      .then(({ data }: any) => setDependencies(data ?? []));
  }, [taskId, profile?.business_id]);

  // SLA calculation
  const sla = useMemo(() => {
    if (!task?.created_at) return null;
    const created = new Date(task.created_at);
    const deadline = task.deadline ? new Date(task.deadline) : new Date(created.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const totalHours = differenceInHours(deadline, created) || 24;
    const hoursRemaining = differenceInHours(deadline, now);
    const minutesRemaining = differenceInMinutes(deadline, now);
    const isOverdue = isPast(deadline);
    const isAtRisk = !isOverdue && hoursRemaining < totalHours * 0.25;
    const progressPct = task.status === "completed" ? 100 : Math.max(0, Math.min(100, ((totalHours - hoursRemaining) / totalHours) * 100));
    return { hoursRemaining, minutesRemaining, isOverdue, isAtRisk, progressPct, deadline };
  }, [task]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await send(newMessage, msgType);
    setNewMessage("");
  };

  const handleAskCustomer = async () => {
    if (!quickMsg.trim()) return;
    await send(quickMsg, "customer");
    setQuickMsg("");
    setAskCustomerOpen(false);
    toast.success("Question sent to customer");
  };

  const handleAskCreator = async () => {
    if (!quickMsg.trim()) return;
    await send(`[To Ticket Creator] ${quickMsg}`, "internal");
    setQuickMsg("");
    setAskCreatorOpen(false);
    toast.success("Question sent to ticket creator");
  };

  const handleMarkComplete = async () => {
    if (!task) return;
    await update(task.id, { status: "completed" });
    toast.success("Task marked as completed. Notifications will be sent.");
  };

  if (!task) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {task.task_number && <Badge variant="outline" className="font-mono text-xs">{task.task_number}</Badge>}
            <h1 className="text-xl font-bold">{task.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{task.description || "No description"}</p>
        </div>
        {task.status !== "completed" && (
          <Button variant="default" size="sm" className="gap-1" onClick={handleMarkComplete}>
            <CheckCircle className="h-4 w-4" /> Complete
          </Button>
        )}
      </div>

      {/* SLA Banner */}
      {sla && task.status !== "completed" && (
        <Card className={`border ${sla.isOverdue ? "border-destructive/50 bg-destructive/5" : sla.isAtRisk ? "border-yellow-500/50 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5"}`}>
          <CardContent className="p-3 flex items-center gap-3">
            {sla.isOverdue ? (
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            ) : sla.isAtRisk ? (
              <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {sla.isOverdue
                    ? `Overdue by ${Math.abs(sla.hoursRemaining)}h`
                    : sla.hoursRemaining > 0
                      ? `${sla.hoursRemaining}h ${sla.minutesRemaining % 60}m remaining`
                      : `${sla.minutesRemaining}m remaining`}
                </span>
                <span className="text-xs text-muted-foreground">
                  Due: {format(sla.deadline, "MMM d, h:mm a")}
                </span>
              </div>
              <Progress
                value={sla.progressPct}
                className={`h-2 mt-1.5 ${sla.isOverdue ? "[&>div]:bg-destructive" : sla.isAtRisk ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={task.status} onValueChange={(v) => update(task.id, { status: v })}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Priority</p>
            <Badge className={`mt-1 capitalize ${task.priority === "urgent" ? "bg-destructive/10 text-destructive" : ""}`}>
              {task.priority}
            </Badge>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Assigned</p>
            <p className="text-sm font-medium mt-1">{task.hr_employees?.full_name || "Unassigned"}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="text-sm font-medium mt-1">{task.departments?.name || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={askCustomerOpen} onOpenChange={setAskCustomerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" /> Ask Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ask Customer</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Send a question directly to the customer. They'll see it in their portal.</p>
            <Textarea value={quickMsg} onChange={e => setQuickMsg(e.target.value)} placeholder="e.g. Please confirm logo color for banner design." />
            <Button onClick={handleAskCustomer} disabled={!quickMsg.trim()} className="w-full gap-1"><Send className="h-4 w-4" /> Send to Customer</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={askCreatorOpen} onOpenChange={setAskCreatorOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" /> Ask Ticket Creator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ask Ticket Creator</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Send an internal question to whoever created this task.</p>
            <Textarea value={quickMsg} onChange={e => setQuickMsg(e.target.value)} placeholder="e.g. Can you share the brand guidelines?" />
            <Button onClick={handleAskCreator} disabled={!quickMsg.trim()} className="w-full gap-1"><Send className="h-4 w-4" /> Send Internally</Button>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/cross-dept-requests")}>
          <Link2 className="h-3.5 w-3.5" /> Cross-Dept Request
        </Button>
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dependencies.map((dep: any) => (
              <div key={dep.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                <span className="font-mono text-xs text-muted-foreground">{dep.depends_on?.task_number || "—"}</span>
                <span className="flex-1">{dep.depends_on?.title || "Unknown"}</span>
                <Badge variant="outline" className="text-xs capitalize">{dep.depends_on?.status?.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conversations */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="internal" onValueChange={(v) => setMsgType(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="internal" className="gap-1">
                <Lock className="h-3 w-3" /> Internal ({internalMessages.length})
              </TabsTrigger>
              <TabsTrigger value="customer" className="gap-1">
                <Globe className="h-3 w-3" /> Customer ({customerMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="internal">
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {internalMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No internal messages yet. Use this for team discussions hidden from the customer.</p>
                )}
                {internalMessages.map(m => (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm mt-1">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="customer">
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {customerMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No customer messages. Use "Ask Customer" to get clarification.</p>
                )}
                {customerMessages.map(m => (
                  <div key={m.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 bg-primary/5 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm mt-1">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Message Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder={msgType === "customer" ? "Ask the customer..." : "Internal team message..."}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="min-h-[60px]"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button onClick={handleSend} size="icon" className="h-auto">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailPage;
