import { useParams, useNavigate } from "react-router-dom";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useTaskConversations } from "@/hooks/useTaskConversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Lock, Globe, Send, Clock, User } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const STATUSES = ["new", "assigned", "in_progress", "under_review", "completed"];

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, update } = useProjectTasks();
  const { internalMessages, customerMessages, send } = useTaskConversations(taskId);
  const [newMessage, setNewMessage] = useState("");
  const [msgType, setMsgType] = useState<"internal" | "customer">("internal");

  const task = tasks.find((t: any) => t.id === taskId);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await send(newMessage, msgType);
    setNewMessage("");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "in_progress": return "bg-primary/10 text-primary border-primary/20";
      case "under_review": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "assigned": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
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
          <div className="flex items-center gap-2">
            {task.task_number && <Badge variant="outline" className="font-mono text-xs">{task.task_number}</Badge>}
            <h1 className="text-xl font-bold">{task.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{task.description || "No description"}</p>
        </div>
      </div>

      {/* Task Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={task.status} onValueChange={(v) => update(task.id, { status: v })}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
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
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className="text-sm font-medium mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.deadline || "None"}
            </p>
          </CardContent>
        </Card>
      </div>

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
