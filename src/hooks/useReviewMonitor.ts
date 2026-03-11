import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GoogleReview {
  id: string;
  business_id: string;
  review_id: string | null;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  rating: number;
  comment: string | null;
  review_time: string | null;
  reply_text: string | null;
  replied_at: string | null;
  source: string;
  created_at: string;
}

export interface ReviewAutoSettings {
  id: string;
  business_id: string;
  is_enabled: boolean;
  delay_hours: number;
  channel: string;
  message_template: string | null;
  review_link: string | null;
  min_job_value: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewRequest {
  id: string;
  business_id: string;
  tenant_customer_id: string | null;
  job_id: string | null;
  status: string;
  sent_at: string;
  review_url: string | null;
  channel: string | null;
  auto_sent: boolean | null;
  created_at: string;
  tenant_customers?: { name: string } | null;
  jobs?: { job_title: string } | null;
}

export function useReviewMonitor() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [settings, setSettings] = useState<ReviewAutoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const businessId = profile?.business_id;

  const fetchAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    const [revRes, reqRes, setRes] = await Promise.all([
      supabase
        .from("google_reviews" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("review_time", { ascending: false })
        .limit(100),
      supabase
        .from("review_requests")
        .select("*, tenant_customers(name), jobs(job_title)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("review_auto_settings" as any)
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle(),
    ]);

    setReviews((revRes.data as any) || []);
    setRequests((reqRes.data as any) || []);
    setSettings((setRes.data as any) || null);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertSettings = async (input: Partial<ReviewAutoSettings>) => {
    if (!businessId) return;
    if (settings) {
      await supabase.from("review_auto_settings" as any)
        .update({ ...input, updated_at: new Date().toISOString() } as any)
        .eq("id", settings.id);
    } else {
      await supabase.from("review_auto_settings" as any)
        .insert([{ business_id: businessId, ...input } as any]);
    }
    toast.success("Review settings saved");
    fetchAll();
  };

  const sendManualRequest = async (tenantCustomerId: string, jobId?: string) => {
    if (!businessId) return;
    await supabase.from("review_requests").insert([{
      business_id: businessId,
      tenant_customer_id: tenantCustomerId,
      job_id: jobId || null,
      status: "sent",
      review_url: settings?.review_link || null,
      channel: settings?.channel || "sms",
      auto_sent: false,
    } as any]);
    toast.success("Review request sent");
    fetchAll();
  };

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return {
    reviews,
    requests,
    settings,
    loading,
    upsertSettings,
    sendManualRequest,
    refetch: fetchAll,
    stats: { totalReviews, avgRating, ratingDistribution },
  };
}
