import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoClientMessage {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  message_text: string;
  attachment_url: string | null;
  sent_by_role: string;
  status: string;
  created_at: string;
}

export function useSeoClientMessages(projectId?: string) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<SeoClientMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_client_messages").select("*").eq("seo_project_id", projectId).order("created_at", { ascending: true });
    setMessages((data as any as SeoClientMessage[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Subscribe to realtime
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`seo-msgs-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "seo_client_messages", filter: `seo_project_id=eq.${projectId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, fetch]);

  const send = async (input: { message_text: string; sent_by_role?: string; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_client_messages").insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      sent_by_role: input.sent_by_role || "SEO_TEAM",
      ...input,
    } as any);
    fetch();
  };

  return { messages, loading, send, refetch: fetch };
}
