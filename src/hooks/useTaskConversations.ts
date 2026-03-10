import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TaskConversation {
  id: string;
  business_id: string;
  task_id: string;
  sender_user_id: string;
  sender_name: string | null;
  message: string;
  conversation_type: "internal" | "customer";
  created_at: string;
}

export function useTaskConversations(taskId?: string) {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<TaskConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!taskId || !profile?.business_id) return;
    setLoading(true);
    const { data } = await (supabase.from("task_conversations" as any) as any)
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setMessages((data as any[]) ?? []);
    setLoading(false);
  }, [taskId, profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`task-conv-${taskId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_conversations" }, (payload: any) => {
        if (payload.new?.task_id === taskId) {
          setMessages(prev => [...prev, payload.new as TaskConversation]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  const send = async (message: string, type: "internal" | "customer") => {
    if (!profile?.business_id || !taskId || !user) return;
    await (supabase.from("task_conversations" as any) as any).insert([{
      business_id: profile.business_id,
      task_id: taskId,
      sender_user_id: user.id,
      sender_name: profile.full_name || profile.email,
      message,
      conversation_type: type,
    }]);
    toast.success(type === "customer" ? "Message sent to customer" : "Internal message sent");
  };

  const internalMessages = messages.filter(m => m.conversation_type === "internal");
  const customerMessages = messages.filter(m => m.conversation_type === "customer");

  return { messages, internalMessages, customerMessages, loading, send, refresh: fetch };
}
