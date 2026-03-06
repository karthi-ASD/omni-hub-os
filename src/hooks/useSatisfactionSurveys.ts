import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSatisfactionSurveys() {
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("satisfaction_surveys")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setSurveys(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("satisfaction_surveys").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { surveys, loading, create, refresh: fetch };
}

export function useSurveyResponses(surveyId?: string) {
  const { profile } = useAuth();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    let query = supabase
      .from("survey_responses")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (surveyId) query = query.eq("survey_id", surveyId);
    const { data } = await query;
    setResponses(data ?? []);
    setLoading(false);
  }, [profile?.business_id, surveyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { responses, loading, refresh: fetch };
}
