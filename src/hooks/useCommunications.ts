import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CommsProvider {
  id: string;
  business_id: string | null;
  channel: string;
  provider_type: string;
  is_active: boolean;
  created_at: string;
}

export interface CommsTemplate {
  id: string;
  business_id: string | null;
  channel: string;
  template_key: string;
  subject: string | null;
  body: string | null;
  created_at: string;
}

export interface CommsSend {
  id: string;
  business_id: string | null;
  channel: string;
  provider_type: string | null;
  to_address: string;
  status: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export function useCommunications() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<CommsProvider[]>([]);
  const [templates, setTemplates] = useState<CommsTemplate[]>([]);
  const [sends, setSends] = useState<CommsSend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes, sRes] = await Promise.all([
      supabase.from("communications_providers").select("*").order("created_at", { ascending: false }),
      supabase.from("communications_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("communications_sends").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setProviders((pRes.data as any as CommsProvider[]) || []);
    setTemplates((tRes.data as any as CommsTemplate[]) || []);
    setSends((sRes.data as any as CommsSend[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProvider = async (input: { channel: string; provider_type: string }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("communications_providers").insert({
      business_id: profile.business_id,
      ...input,
    } as any);
    if (error) { toast.error("Failed to add provider"); return; }
    toast.success("Communications provider added");
    fetchAll();
  };

  const addTemplate = async (input: { channel: string; template_key: string; subject?: string; body?: string }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("communications_templates").insert({
      business_id: profile.business_id,
      ...input,
    } as any);
    if (error) { toast.error("Failed to add template"); return; }
    toast.success("Template added");
    fetchAll();
  };

  const sendMessage = async (input: { channel: string; to_address: string; related_entity_type?: string; related_entity_id?: string }) => {
    if (!profile?.business_id) return;

    const channel = input.channel.toLowerCase();

    if (channel === "whatsapp") {
      const entityKeyByType: Record<string, string> = {
        lead: "lead_id",
        client: "client_id",
        ticket: "ticket_id",
        job: "job_id",
      };

      const entityKey = input.related_entity_type ? entityKeyByType[input.related_entity_type] : undefined;
      const entityPayload = entityKey && input.related_entity_id
        ? { [entityKey]: input.related_entity_id }
        : {};

      const { data, error } = await supabase.functions.invoke("whatsapp-send-message", {
        body: {
          to: input.to_address,
          template_name: "hello_world",
          template_language: "en_US",
          ...entityPayload,
        },
      });

      if (error || !data?.success) {
        toast.error("Failed to send WhatsApp message");
        return;
      }

      toast.success("WhatsApp message sent");
      fetchAll();
      return;
    }

    const { error } = await supabase.from("communications_sends").insert({
      business_id: profile.business_id,
      channel: input.channel,
      to_address: input.to_address,
      status: "queued",
      related_entity_type: input.related_entity_type,
      related_entity_id: input.related_entity_id,
    } as any);
    if (error) { toast.error("Failed to queue message"); return; }

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "COMMUNICATION_SENT",
      payload_json: { channel: input.channel, to: input.to_address, short_message: `${input.channel} message queued to ${input.to_address}` },
    });

    toast.success("Message queued");
    fetchAll();
  };

  return { providers, templates, sends, loading, addProvider, addTemplate, sendMessage, refetch: fetchAll };
}
