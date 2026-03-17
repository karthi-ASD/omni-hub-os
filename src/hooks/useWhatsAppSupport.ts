import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WhatsAppConversation {
  id: string;
  client_id: string | null;
  ticket_id: string | null;
  business_id: string;
  channel_type: string;
  direction_last: string | null;
  client_whatsapp_phone: string;
  phone_number_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
  unread_for_support_count: number;
  unread_for_client_count: number;
  created_at: string;
  // Joined fields
  client_name?: string;
  client_business_name?: string;
  ticket_number?: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: string;
  sender_type: string;
  sender_display_name: string | null;
  message_type: string;
  message_text: string | null;
  status: string;
  sent_at: string | null;
  received_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  whatsapp_message_id: string | null;
}

export function useWhatsAppSupport() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("business_id", profile.business_id)
      .eq("channel_type", "nextweb_support")
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Enrich with client names and ticket numbers
    const enriched: WhatsAppConversation[] = [];
    for (const conv of (data || [])) {
      const c = conv as WhatsAppConversation;
      if (c.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("contact_name, company_name")
          .eq("id", c.client_id)
          .single();
        c.client_name = (client as any)?.contact_name || "Unknown";
        c.client_business_name = (client as any)?.company_name || "";
      }
      if (c.ticket_id) {
        const { data: ticket } = await supabase
          .from("support_tickets")
          .select("ticket_number")
          .eq("id", c.ticket_id)
          .single();
        c.ticket_number = (ticket as any)?.ticket_number || "";
      }
      enriched.push(c);
    }

    setConversations(enriched);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) {
      console.error("Error fetching messages:", error);
    }
    setMessages((data as WhatsAppMessage[]) || []);
    setMessagesLoading(false);

    // Mark as read
    await supabase.from("whatsapp_conversations").update({
      unread_for_support_count: 0,
    }).eq("id", conversationId);

    // Update local state
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unread_for_support_count: 0 } : c
    ));
  }, []);

  const sendReply = useCallback(async (conversationId: string, messageText: string, ticketId?: string) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-support-reply", {
      body: { conversation_id: conversationId, message_text: messageText, ticket_id: ticketId },
    });

    if (error || !data?.success) {
      toast.error("Failed to send WhatsApp reply");
      return false;
    }

    toast.success("Reply sent via WhatsApp");
    // Refresh messages
    await fetchMessages(conversationId);
    await fetchConversations();
    return true;
  }, [fetchMessages, fetchConversations]);

  const linkConversationToClient = useCallback(async (conversationId: string, clientId: string) => {
    const { error } = await supabase
      .from("whatsapp_conversations")
      .update({ client_id: clientId })
      .eq("id", conversationId);

    if (error) {
      toast.error("Failed to link conversation");
      return false;
    }

    // Also update all messages in conversation
    await supabase
      .from("whatsapp_messages")
      .update({ client_id: clientId })
      .eq("conversation_id", conversationId);

    // Create identity mapping
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      try {
        await supabase.from("client_whatsapp_identity").insert({
          client_id: clientId,
          whatsapp_phone_e164: conv.client_whatsapp_phone,
          whatsapp_phone_normalized: conv.client_whatsapp_phone.replace(/\D/g, ""),
          is_primary: true,
        } as any);
      } catch {
        // Ignore duplicate
      }
    }

    toast.success("Conversation linked to client");
    await fetchConversations();
    return true;
  }, [conversations, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!profile?.business_id) return;

    const channel = supabase
      .channel("whatsapp-support-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages" },
        () => {
          fetchConversations();
          if (activeConversation) fetchMessages(activeConversation);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => fetchConversations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.business_id, activeConversation, fetchConversations, fetchMessages]);

  return {
    conversations,
    messages,
    loading,
    messagesLoading,
    activeConversation,
    setActiveConversation: (id: string | null) => {
      setActiveConversation(id);
      if (id) fetchMessages(id);
      else setMessages([]);
    },
    sendReply,
    linkConversationToClient,
    refetch: fetchConversations,
  };
}
