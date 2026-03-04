import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, Plus, Send, User, Clock, CheckCircle2,
  AlertCircle, Mail, Phone, MessageCircle, Globe,
} from "lucide-react";
import { format } from "date-fns";

const channelIcons: Record<string, React.ElementType> = {
  EMAIL: Mail, SMS: Phone, WHATSAPP: MessageCircle,
  WEBCHAT: Globe, VOICE_TRANSCRIPT: Phone, INTERNAL_NOTE: MessageSquare,
};

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ConversationsPage = () => {
  usePageTitle("Conversations");
  const {
    threads, messages, loading, selectedThread, setSelectedThread,
    createThread, sendMessage, updateThreadStatus,
  } = useConversations();
  const [filter, setFilter] = useState("ALL");
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState("GENERAL");
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState("WEBCHAT");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = filter === "ALL" ? threads : threads.filter(t => t.status === filter);
  const currentThread = threads.find(t => t.id === selectedThread);

  const handleCreate = async () => {
    if (!newSubject.trim()) return;
    const t = await createThread({ subject: newSubject, thread_type: newType });
    if (t) { setSelectedThread(t.id); setDialogOpen(false); setNewSubject(""); }
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selectedThread) return;
    await sendMessage(selectedThread, replyText, replyChannel);
    setReplyText("");
  };

  const stats = {
    open: threads.filter(t => t.status === "OPEN").length,
    pending: threads.filter(t => t.status === "PENDING").length,
    closed: threads.filter(t => t.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conversations</h1>
          <p className="text-sm text-muted-foreground">Unified messaging inbox across all channels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b48]">
              <Plus className="h-4 w-4 mr-2" /> New Thread
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Conversation Thread</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["GENERAL","LEAD","CLIENT","JOB","SUPPORT"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full bg-[#d4a853] text-[#0a0e1a]">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", value: stats.open, icon: AlertCircle, color: "text-emerald-400" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400" },
          { label: "Closed", value: stats.closed, icon: CheckCircle2, color: "text-gray-400" },
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

      {/* Main content: thread list + messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread List */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Tabs value={filter} onValueChange={setFilter} className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-8">
                  <TabsTrigger value="ALL" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="OPEN" className="text-xs">Open</TabsTrigger>
                  <TabsTrigger value="PENDING" className="text-xs">Pending</TabsTrigger>
                  <TabsTrigger value="CLOSED" className="text-xs">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No conversations</div>
              ) : (
                filtered.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThread(t.id)}
                    className={`w-full text-left p-4 border-b border-border hover:bg-accent/50 transition-colors ${
                      selectedThread === t.id ? "bg-accent/30 border-l-2 border-l-[#d4a853]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{t.subject || "No Subject"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.thread_type}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[t.status] || ""}`}>
                        {t.status}
                      </Badge>
                    </div>
                    {t.last_message_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(t.last_message_at), "MMM d, h:mm a")}
                      </p>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 bg-card border-border">
          {!selectedThread ? (
            <CardContent className="flex items-center justify-center h-[560px]">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentThread?.subject || "Conversation"}</CardTitle>
                    <p className="text-xs text-muted-foreground">{currentThread?.thread_type} • {currentThread?.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentThread?.status !== "CLOSED" && (
                      <Button size="sm" variant="outline" onClick={() => updateThreadStatus(selectedThread, "CLOSED")}>
                        Close
                      </Button>
                    )}
                    {currentThread?.status === "CLOSED" && (
                      <Button size="sm" variant="outline" onClick={() => updateThreadStatus(selectedThread, "OPEN")}>
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[460px]">
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No messages yet</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(m => {
                        const Icon = channelIcons[m.channel] || MessageSquare;
                        const isOutbound = m.direction === "OUTBOUND";
                        return (
                          <div key={m.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                              isOutbound
                                ? "bg-[#d4a853]/20 border border-[#d4a853]/30"
                                : "bg-accent border border-border"
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {m.channel} • {m.direction}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4">{m.status}</Badge>
                              </div>
                              <p className="text-sm text-foreground">{m.body_text}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {format(new Date(m.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                {/* Reply box */}
                {currentThread?.status !== "CLOSED" && (
                  <div className="border-t border-border p-3 flex gap-2">
                    <Select value={replyChannel} onValueChange={setReplyChannel}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["WEBCHAT","EMAIL","SMS","WHATSAPP"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Type your message..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSend()}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} size="icon" className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b48]">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationsPage;
