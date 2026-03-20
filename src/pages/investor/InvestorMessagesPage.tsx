import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Send, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";

export default function InvestorMessagesPage() {
  usePageTitle("Messages", "Communicate with your investment advisor");
  const { profile } = useAuth();
  const qc = useQueryClient();
  const bid = profile?.business_id;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: clientLink } = useQuery({
    queryKey: ["investor-client-link", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("client_users")
        .select("client_id").eq("user_id", profile!.user_id).eq("is_primary", true).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const clientId = clientLink?.client_id;

  // Use account_timeline as message system
  const { data: messages = [] } = useQuery({
    queryKey: ["investor-messages", bid, clientId],
    queryFn: async () => {
      const { data } = await supabase.from("account_timeline")
        .select("*")
        .eq("business_id", bid!)
        .eq("client_id", clientId!)
        .in("event_type", ["client_message", "advisor_message", "note", "message"])
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  const handleSend = async () => {
    if (!message.trim() || !bid || !clientId) return;
    setSending(true);
    const { error } = await supabase.from("account_timeline").insert({
      business_id: bid,
      client_id: clientId,
      event_type: "client_message",
      event_title: "Message from investor",
      event_description: message.trim(),
      user_id: profile?.user_id,
      visibility: "both",
    });
    if (error) { toast.error("Failed to send"); setSending(false); return; }
    toast.success("Message sent");
    setMessage("");
    setSending(false);
    qc.invalidateQueries({ queryKey: ["investor-messages"] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">Communicate with your investment advisor</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {messages.length > 0 ? messages.map((msg: any) => {
          const isClient = msg.event_type === "client_message";
          return (
            <div key={msg.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${isClient ? "order-2" : ""}`}>
                <Card className={`rounded-2xl border-0 shadow-sm ${isClient ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <CardContent className="p-3">
                    <p className={`text-sm ${isClient ? "text-primary-foreground" : "text-foreground"}`}>
                      {msg.event_description}
                    </p>
                  </CardContent>
                </Card>
                <p className={`text-[9px] mt-1 px-2 ${isClient ? "text-right" : ""} text-muted-foreground`}>
                  {isClient ? "You" : "Advisor"} • {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation with your investment advisor</p>
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={2}
          className="resize-none"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        />
        <Button onClick={handleSend} disabled={sending || !message.trim()} size="sm" className="h-10 px-4">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
