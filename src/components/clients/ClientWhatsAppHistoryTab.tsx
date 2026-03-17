import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Phone, MessageSquare, Plus, Ticket, Check, CheckCheck, XCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
  businessId: string;
}

export function ClientWhatsAppHistoryTab({ clientId, businessId }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addPhoneOpen, setAddPhoneOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    const [convRes, idRes] = await Promise.all([
      supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("client_id", clientId)
        .eq("channel_type", "nextweb_support")
        .order("last_message_at", { ascending: false }),
      supabase
        .from("client_whatsapp_identity")
        .select("*")
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false }),
    ]);
    setConversations(convRes.data || []);
    setIdentities(idRes.data || []);
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    setSelectedConv(convId);
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages(data || []);
  };

  const addPhone = async () => {
    if (!newPhone.trim()) return;
    let phone = newPhone.trim().replace(/[\s\-\(\)]/g, "");
    if (!phone.startsWith("+")) phone = "+" + phone;

    const { error } = await supabase.from("client_whatsapp_identity").insert({
      client_id: clientId,
      whatsapp_phone_e164: phone,
      whatsapp_phone_normalized: phone.replace(/\D/g, ""),
      is_primary: identities.length === 0,
    } as any);

    if (error) {
      toast.error("Failed to add phone number");
      return;
    }
    toast.success("WhatsApp number added");
    setAddPhoneOpen(false);
    setNewPhone("");
    fetchData();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered": return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read": return <CheckCheck className="h-3 w-3 text-primary" />;
      case "failed": return <XCircle className="h-3 w-3 text-destructive" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* WhatsApp Numbers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp Numbers
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddPhoneOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Number
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No WhatsApp numbers linked</p>
          ) : (
            <div className="space-y-2">
              {identities.map(id => (
                <div key={id.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono">{id.whatsapp_phone_e164}</span>
                    {id.is_primary && <Badge variant="default" className="text-[10px] h-4">Primary</Badge>}
                    {!id.is_active && <Badge variant="outline" className="text-[10px] h-4">Inactive</Badge>}
                  </div>
                  {id.contact_name && (
                    <span className="text-xs text-muted-foreground">{id.contact_name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Support Conversations ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No WhatsApp conversations yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => fetchMessages(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors",
                    selectedConv === conv.id && "bg-muted border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={conv.status === "open" ? "default" : "outline"} className="text-[10px]">
                        {conv.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{conv.client_whatsapp_phone}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {conv.last_message_at
                        ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {conv.last_message_preview || "No messages"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message History */}
      {selectedConv && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Message History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
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
                        "max-w-[75%] rounded-xl px-3 py-2 text-sm",
                        msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {msg.sender_display_name && msg.direction === "outbound" && (
                        <div className="text-[10px] opacity-70 mb-0.5">{msg.sender_display_name}</div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.message_text}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] opacity-60">
                        <span>{format(new Date(msg.created_at), "dd MMM HH:mm")}</span>
                        {msg.direction === "outbound" && statusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Add Phone Dialog */}
      <Dialog open={addPhoneOpen} onOpenChange={setAddPhoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add WhatsApp Number</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="+61400000000"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPhoneOpen(false)}>Cancel</Button>
            <Button onClick={addPhone}>Add Number</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
