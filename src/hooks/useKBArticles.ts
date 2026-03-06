import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useKBArticles() {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("kb_articles")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("kb_articles").insert([{ ...values, business_id: profile.business_id, author_user_id: profile.user_id } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("kb_articles").update(values as any).eq("id", id);
    fetch();
  };

  return { articles, loading, create, update, refresh: fetch };
}
