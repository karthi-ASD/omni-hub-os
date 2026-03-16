import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientConversation {
  id: string;
  business_id: string;
  client_id: string;
  sales_user_id: string;
  conversation_date: string;
  conversation_type: string;
  notes: string | null;
  next_callback_date: string | null;
  created_at: string;
}

export function useClientConversations(clientId?: string) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    const { data } = await supabase
      .from("client_conversations")
      .select("*")
      .eq("client_id", clientId)
      .order("conversation_date", { ascending: false });
    setConversations((data as any as ClientConversation[]) || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const addConversation = async (input: {
    conversation_type: string;
    notes: string;
    next_callback_date?: string;
  }) => {
    if (!user || !profile?.business_id || !clientId) return null;
    const { data, error } = await supabase.from("client_conversations").insert({
      business_id: profile.business_id,
      client_id: clientId,
      sales_user_id: user.id,
      conversation_type: input.conversation_type,
      notes: input.notes,
      next_callback_date: input.next_callback_date || null,
    } as any).select().single();
    if (error) { toast.error("Failed to add conversation"); return null; }

    // Auto-create callback if next_callback_date is set
    if (input.next_callback_date) {
      await supabase.from("sales_callbacks").insert({
        business_id: profile.business_id,
        client_id: clientId,
        sales_user_id: user.id,
        callback_date: input.next_callback_date,
        notes: `Follow-up from conversation: ${input.notes?.substring(0, 100)}`,
      } as any);
    }

    toast.success("Conversation logged");
    fetchConversations();
    return data as any as ClientConversation;
  };

  return { conversations, loading, addConversation, refetch: fetchConversations };
}
