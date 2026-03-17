import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWhatsAppSupport, WhatsAppConversation, WhatsAppMessage } from "@/hooks/useWhatsAppSupport";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquare, Send, Search, Phone, User, Ticket, Clock,
  AlertTriangle, CheckCircle2, Eye, Link2, ExternalLink, Filter,
  XCircle, Check, CheckCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const statusIcon = (status: string) => {
  switch (status) {
    case "sent": return <Check className="h-3 w-3 text-muted-foreground" />;
    case "delivered": return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "read": return <CheckCheck className="h-3 w-3 text-primary" />;
    case "failed": return <XCircle className="h-3 w-3 text-destructive" />;
    default: return null;
  }
};

export default function WhatsAppSupportPage() {
  usePageTitle("WhatsApp Support");
  const { profile } = useAuth();
  const {
    conversations, messages, loading, messagesLoading,
    activeConversation, setActiveConversation, sendReply, linkConversationToClient,
  } = useWhatsAppSupport();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkConvId, setLinkConvId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversation);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations
  const filtered = conversations.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (c.client_name?.toLowerCase().includes(q)) ||
        (c.client_business_name?.toLowerCase().includes(q)) ||
        c.client_whatsapp_phone.includes(q) ||
        (c.ticket_number?.toLowerCase().includes(q)) ||
        (c.last_message_preview?.toLowerCase().includes(q));
      if (!match) return false;
    }
    switch (filterTab) {
      case "unread": return c.unread_for_support_count > 0;
      case "open": return c.status === "open";
      case "unmatched": return !c.client_id;
      default: return true;
    }
  });

  const handleSendReply = async () => {
    if (!activeConversation || !replyText.trim()) return;
    setSending(true);
    const success = await sendReply(activeConversation, replyText, activeConv?.ticket_id || undefined);
    if (success) setReplyText("");
    setSending(false);
  };

  const handleClientSearch = async (query: string) => {
    setClientSearch(query);
    if (query.length < 2) { setClientResults([]); return; }
    const { data } = await supabase
      .from("clients")
      .select("id, contact_name, company_name, phone")
      .eq("business_id", profile?.business_id || "")
      .or(`contact_name.ilike.%${query}%,company_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);
    setClientResults(data || []);
  };

  const handleLinkClient = async (clientId: string) => {
    if (!linkConvId) return;
    await linkConversationToClient(linkConvId, clientId);
    setLinkDialogOpen(false);
    setLinkConvId(null);
    setClientSearch("");
    setClientResults([]);
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread_for_support_count, 0);
  const unmatchedCount = conversations.filter(c => !c.client_id).length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">WhatsApp Support</h1>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversations · {totalUnread} unread · {unmatchedCount} unmatched
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8 h-9 text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-2 border-b border-border">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: `Unread (${totalUnread})` },
              { key: "unmatched", label: `Unmatched (${unmatchedCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-colors",
                  filterTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conversation items */}
          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations found
              </div>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors",
                    activeConversation === conv.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {conv.client_name || conv.client_whatsapp_phone}
                        </span>
                        {conv.unread_for_support_count > 0 && (
                          <Badge variant="default" className="text-[10px] h-4 px-1.5 rounded-full">
                            {conv.unread_for_support_count}
                          </Badge>
                        )}
                      </div>
                      {conv.client_business_name && (
                        <p className="text-[11px] text-muted-foreground truncate">{conv.client_business_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message_preview || "No messages yet"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {conv.last_message_at
                          ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                          : ""}
                      </span>
                      <div className="flex gap-1">
                        {!conv.client_id && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-[hsl(var(--warning))] text-[hsl(var(--warning))]">
                            Unmatched
                          </Badge>
                        )}
                        {conv.ticket_number && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {conv.ticket_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {activeConv?.client_name || activeConv?.client_whatsapp_phone}
                      </span>
                      {activeConv?.client_business_name && (
                        <span className="text-xs text-muted-foreground">
                          ({activeConv.client_business_name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {activeConv?.client_whatsapp_phone}
                      {activeConv?.ticket_number && (
                        <>
                          <Ticket className="h-3 w-3 ml-2" />
                          {activeConv.ticket_number}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!activeConv?.client_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLinkConvId(activeConversation);
                        setLinkDialogOpen(true);
                      }}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Link to Client
                    </Button>
                  )}
                  {activeConv?.ticket_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/unified-ticket/${activeConv.ticket_id}`, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      View Ticket
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-2/3" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.direction === "outbound" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          )}
                        >
                          {msg.sender_type === "system" && (
                            <div className="text-[10px] opacity-70 mb-1 font-medium">
                              System Auto-Reply
                            </div>
                          )}
                          {msg.direction === "outbound" && msg.sender_type === "support" && msg.sender_display_name && (
                            <div className="text-[10px] opacity-70 mb-1 font-medium">
                              {msg.sender_display_name}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-[10px]",
                            msg.direction === "outbound" ? "justify-end opacity-70" : "opacity-50"
                          )}>
                            <span>
                              {format(new Date(msg.sent_at || msg.received_at || msg.created_at), "HH:mm")}
                            </span>
                            {msg.direction === "outbound" && statusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Reply box */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a reply..."
                    className="min-h-[44px] max-h-32 resize-none text-sm"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    size="icon"
                    className="h-11 w-11 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Link to client dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Conversation to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search clients by name, company, or phone..."
              value={clientSearch}
              onChange={e => handleClientSearch(e.target.value)}
            />
            <ScrollArea className="max-h-60">
              {clientResults.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleLinkClient(client.id)}
                  className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="text-sm font-medium">{client.contact_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.company_name} · {client.phone || "No phone"}
                  </div>
                </button>
              ))}
              {clientSearch.length >= 2 && clientResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No clients found</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
