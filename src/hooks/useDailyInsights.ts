import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DailyInsight {
  id: string;
  business_id: string;
  title: string;
  video_url: string | null;
  message: string | null;
  nextweb_application: string | null;
  department_target: string[];
  priority_level: string;
  created_by: string | null;
  created_at: string;
  start_date: string | null;
  expiry_date: string | null;
  require_acknowledgement: boolean;
  allow_comments: boolean;
  status: string;
}

export interface InsightView {
  id: string;
  employee_id: string;
  insight_id: string;
  business_id: string;
  view_status: string;
  view_time: string;
  acknowledged: boolean;
}

export interface InsightComment {
  id: string;
  insight_id: string;
  employee_id: string;
  business_id: string;
  comment: string;
  created_at: string;
}

export function useDailyInsights() {
  const { user, profile } = useAuth();
  const [insights, setInsights] = useState<DailyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("daily_insights")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setInsights((data as any[]) ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const createInsight = async (values: Partial<DailyInsight>) => {
    if (!profile?.business_id || !user) return;
    const { error } = await supabase.from("daily_insights").insert({
      ...values,
      business_id: profile.business_id,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Failed to publish insight"); return; }
    toast.success("Insight published!");
    fetchInsights();
  };

  const deleteInsight = async (id: string) => {
    await supabase.from("daily_insights").delete().eq("id", id);
    fetchInsights();
  };

  return { insights, loading, createInsight, deleteInsight, refresh: fetchInsights };
}

export function useTodayInsight() {
  const { profile } = useAuth();
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("daily_insights")
      .select("*")
      .eq("business_id", profile.business_id)
      .eq("status", "published")
      .lte("start_date", today)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setInsight((data?.[0] as any) ?? null);
        setLoading(false);
      });
  }, [profile?.business_id]);

  return { insight, loading };
}

export function useInsightViews(insightId?: string) {
  const { user, profile } = useAuth();
  const [views, setViews] = useState<InsightView[]>([]);
  const [myView, setMyView] = useState<InsightView | null>(null);

  const fetchViews = useCallback(async () => {
    if (!profile?.business_id) return;
    const q = supabase
      .from("employee_insight_views")
      .select("*")
      .eq("business_id", profile.business_id);
    if (insightId) q.eq("insight_id", insightId);
    const { data } = await q;
    const items = (data as any[]) ?? [];
    setViews(items);
    if (user) setMyView(items.find((v) => v.employee_id === user.id) ?? null);
  }, [profile?.business_id, insightId, user]);

  useEffect(() => { fetchViews(); }, [fetchViews]);

  const markViewed = async (iId: string) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("employee_insight_views").upsert({
      employee_id: user.id,
      insight_id: iId,
      business_id: profile.business_id,
      view_status: "viewed",
      view_time: new Date().toISOString(),
    } as any, { onConflict: "employee_id,insight_id" });
    fetchViews();
  };

  const acknowledge = async (iId: string) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("employee_insight_views").upsert({
      employee_id: user.id,
      insight_id: iId,
      business_id: profile.business_id,
      view_status: "viewed",
      acknowledged: true,
      view_time: new Date().toISOString(),
    } as any, { onConflict: "employee_id,insight_id" });
    fetchViews();
  };

  return { views, myView, markViewed, acknowledge, refresh: fetchViews };
}

export function useInsightComments(insightId?: string) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<InsightComment[]>([]);

  const fetchComments = useCallback(async () => {
    if (!insightId || !profile?.business_id) return;
    const { data } = await supabase
      .from("insight_comments")
      .select("*")
      .eq("insight_id", insightId)
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: true });
    setComments((data as any[]) ?? []);
  }, [insightId, profile?.business_id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async (text: string) => {
    if (!user || !profile?.business_id || !insightId) return;
    await supabase.from("insight_comments").insert({
      insight_id: insightId,
      employee_id: user.id,
      business_id: profile.business_id,
      comment: text,
    } as any);
    fetchComments();
  };

  return { comments, addComment, refresh: fetchComments };
}
