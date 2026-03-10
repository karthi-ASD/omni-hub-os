import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHRPerformance() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_performance_reviews")
      .select("*, hr_employees(full_name, employee_code, departments(name))")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const scores = [values.work_quality, values.productivity, values.communication, values.team_collaboration, values.leadership].map(Number);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const result = avg >= 8 ? "excellent" : avg >= 5 ? "good" : "needs_improvement";
    await supabase.from("hr_performance_reviews").insert([{
      ...values, overall_rating: Math.round(avg * 10) / 10, result, business_id: profile.business_id,
    } as any]);
    fetch();
  };

  return { reviews, loading, create, refresh: fetch };
}
