import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useConversations() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("conversation_threads")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("last_message_at", { ascending: false });
    setThreads(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchMessages = useCallback(async (threadId: string) => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("thread_id", threadId)
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [profile?.business_id]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    if (selectedThread) fetchMessages(selectedThread);
  }, [selectedThread, fetchMessages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedThread) return;
    const channel = supabase
      .channel(`conv-${selectedThread}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversation_messages",
        filter: `thread_id=eq.${selectedThread}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as any]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedThread]);

  const createThread = async (values: { subject: string; thread_type: string; lead_id?: string; client_id?: string }) => {
    if (!user || !profile?.business_id) return null;
    const { data, error } = await supabase.from("conversation_threads").insert({
      ...values,
      business_id: profile.business_id,
      assigned_to: user.id,
    } as any).select().single();
    if (error) { toast.error(error.message); return null; }
    toast.success("Thread created");
    fetchThreads();
    return data;
  };

  const sendMessage = async (threadId: string, body: string, channel: string = "WEBCHAT") => {
    if (!user || !profile?.business_id) return;
    const { error } = await supabase.from("conversation_messages").insert({
      business_id: profile.business_id,
      thread_id: threadId,
      direction: "OUTBOUND",
      channel,
      body_text: body,
      status: "QUEUED",
      created_by: user.id,
      from_address: profile.email,
    } as any);
    if (error) { toast.error(error.message); return; }
    // Update last_message_at
    await supabase.from("conversation_threads").update({ last_message_at: new Date().toISOString() } as any).eq("id", threadId);
    fetchThreads();
  };

  const updateThreadStatus = async (threadId: string, status: string) => {
    await supabase.from("conversation_threads").update({ status } as any).eq("id", threadId);
    fetchThreads();
  };

  return {
    threads, messages, loading, selectedThread, setSelectedThread,
    createThread, sendMessage, updateThreadStatus, refresh: fetchThreads,
  };
}
