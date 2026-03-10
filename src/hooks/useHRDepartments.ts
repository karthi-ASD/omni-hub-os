import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHRDepartments() {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("name");
    setDepartments(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("departments").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("departments").update(values as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("departments").delete().eq("id", id);
    fetch();
  };

  return { departments, loading, create, update, remove, refresh: fetch };
}
