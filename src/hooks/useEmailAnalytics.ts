import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EmailAnalytics {
  id: string;
  business_id: string;
  send_id: string | null;
  campaign_name: string | null;
  recipient_email: string | null;
  delivery_status: string;
  open_count: number;
  click_count: number;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export function useEmailAnalytics() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<EmailAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("email_campaign_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setAnalytics((data as any as EmailAnalytics[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const trackEvent = async (input: {
    send_id?: string;
    campaign_name?: string;
    recipient_email: string;
    delivery_status: string;
  }) => {
    if (!profile?.business_id) return;
    const now = new Date().toISOString();
    const statusFields: Record<string, any> = {};
    if (input.delivery_status === "delivered") statusFields.delivered_at = now;
    if (input.delivery_status === "opened") { statusFields.opened_at = now; statusFields.open_count = 1; }
    if (input.delivery_status === "clicked") { statusFields.clicked_at = now; statusFields.click_count = 1; }
    if (input.delivery_status === "bounced") statusFields.bounced_at = now;
    if (input.delivery_status === "unsubscribed") statusFields.unsubscribed_at = now;

    await supabase.from("email_campaign_analytics").insert({
      business_id: profile.business_id,
      send_id: input.send_id || null,
      campaign_name: input.campaign_name || null,
      recipient_email: input.recipient_email,
      delivery_status: input.delivery_status,
      ...statusFields,
    } as any);
    fetchAll();
  };

  // Stats
  const total = analytics.length;
  const delivered = analytics.filter(a => a.delivered_at).length;
  const opened = analytics.filter(a => a.opened_at).length;
  const clicked = analytics.filter(a => a.clicked_at).length;
  const bounced = analytics.filter(a => a.bounced_at).length;
  const unsubscribed = analytics.filter(a => a.unsubscribed_at).length;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    analytics, loading, trackEvent, refetch: fetchAll,
    stats: { total, delivered, opened, clicked, bounced, unsubscribed, openRate, clickRate },
  };
}
