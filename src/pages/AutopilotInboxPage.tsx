import { useLeadConversations, useAutopilotRuns } from "@/hooks/useAutopilot";
import { useConversations } from "@/hooks/useConversations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Inbox, Bot, User, Pause, Play, XCircle, Activity, Phone, MessageSquare,
  Mail, Send, Search, Sparkles, ChevronLeft, Clock,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-500/20 text-green-400 border-green-500/30",
  PAUSED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP: MessageSquare,
  SMS: Phone,
  EMAIL: Mail,
  VOICE: Phone,
};

const runStatusColors: Record<string, string> = {
  RUNNING: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  STOPPED: "bg-yellow-500/20 text-yellow-400",
  FAILED: "bg-red-500/20 text-red-400",
};

const AutopilotInboxPage = () => {
  const { conversations, updateMode, updateStatus } = useLeadConversations();
  const { runs } = useAutopilotRuns();
  const { messages, sendMessage, setSelectedThread } = useConversations();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyChannel, setReplyChannel] = useState("WEBCHAT");

  const filtered = conversations
    .filter(c => filter === "ALL" || c.status === filter)
    .filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (c.lead_id || "").toLowerCase().includes(s);
    });

  const selectedConvo = conversations.find(c => c.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    // Also load conversation_messages thread if linked
    setSelectedThread(id);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selected) return;
    sendMessage(selected, replyText, replyChannel);
    setReplyText("");
  };

  // Mobile: show detail view when selected
  if (selected && selectedConvo) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 bg-[#0d1117] border-b border-[#1e2a4a]">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Lead #{selectedConvo.lead_id?.slice(0, 8) || "–"}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${statusColors[selectedConvo.status] || ""}`}>
                {selectedConvo.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {selectedConvo.mode === "AUTOPILOT" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {selectedConvo.mode}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Autopilot status card */}
        <div className="px-3 py-2 bg-[#111832]/50 border-b border-[#1e2a4a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#d4a853]" />
              <span className="text-xs font-medium text-[#d4a853]">
                Autopilot: {selectedConvo.mode}
              </span>
            </div>
            <div className="flex gap-1">
              {selectedConvo.mode === "AUTOPILOT" ? (
                <Button size="sm" variant="ghost" onClick={() => updateMode(selectedConvo.id, "MANUAL")}
                  className="h-7 text-xs text-foreground">
                  <Pause className="h-3 w-3 mr-1" />Pause
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => updateMode(selectedConvo.id, "AUTOPILOT")}
                  className="h-7 text-xs text-foreground">
                  <Play className="h-3 w-3 mr-1" />Resume
                </Button>
              )}
              {selectedConvo.status !== "CLOSED" && (
                <Button size="sm" variant="ghost" onClick={() => updateStatus(selectedConvo.id, "CLOSED")}
                  className="h-7 text-xs text-red-400">
                  <XCircle className="h-3 w-3 mr-1" />Close
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <p>No messages yet</p>
              <p className="text-xs">Messages will appear here when channels are connected</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.direction === "OUTBOUND"
                    ? "bg-[#d4a853]/20 border border-[#d4a853]/30 text-foreground"
                    : "bg-[#111832] border border-[#1e2a4a] text-foreground"
                }`}>
                  <p className="text-sm">{msg.body_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                    </span>
                    {msg.channel && (
                      <span className="text-[10px] text-muted-foreground uppercase">{msg.channel}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="p-3 bg-[#0d1117] border-t border-[#1e2a4a]">
          <div className="flex items-center gap-2 mb-2">
            <Select value={replyChannel} onValueChange={setReplyChannel}>
              <SelectTrigger className="w-28 h-8 text-xs bg-[#111832] border-[#1e2a4a] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBCHAT">Webchat</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-[#d4a853]">
              <Sparkles className="h-3 w-3 mr-1" />AI Draft
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-24 resize-none bg-[#111832] border-[#1e2a4a] text-foreground text-sm"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
            />
            <Button onClick={handleSendReply} disabled={!replyText.trim()}
              className="bg-[#d4a853] text-[#0a0e1a] hover:bg-[#c49b43] self-end h-11 w-11 p-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="h-6 w-6 text-[#d4a853]" /> Inbox
        </h1>
        <p className="text-sm text-muted-foreground">Unified lead conversations</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="bg-[#111832]">
          <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-1" />Inbox</TabsTrigger>
          <TabsTrigger value="runs"><Activity className="h-4 w-4 mr-1" />Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-3">
          {/* Search + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-[#111832] border-[#1e2a4a] text-foreground" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-28 bg-[#111832] border-[#1e2a4a] text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversation list */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Inbox className="h-10 w-10 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <button key={c.id} onClick={() => handleSelect(c.id)}
                  className="w-full text-left p-3 rounded-xl bg-[#0d1117] border border-[#1e2a4a] hover:bg-[#111832] hover:border-[#d4a853]/20 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#111832] border border-[#1e2a4a] flex items-center justify-center">
                      {c.mode === "AUTOPILOT" ? <Bot className="h-5 w-5 text-[#d4a853]" /> : <User className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Lead #{c.lead_id?.slice(0, 8) || "–"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.last_message_at ? format(new Date(c.last_message_at), "h:mm a") : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] py-0 ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{c.mode}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs">
          <Card className="bg-[#0d1117] border-[#1e2a4a]">
            <CardHeader><CardTitle className="text-foreground">Automation Runs</CardTitle></CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No automation runs yet.</p>
              ) : (
                <div className="space-y-2">
                  {runs.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-[#111832] border border-[#1e2a4a]">
                      <div>
                        <span className="text-sm text-foreground">Step {r.current_step_order}</span>
                        <span className="text-xs text-muted-foreground ml-2">{format(new Date(r.created_at), "PPp")}</span>
                      </div>
                      <Badge className={runStatusColors[r.status] || ""}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutopilotInboxPage;
