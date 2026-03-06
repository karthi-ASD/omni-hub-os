import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCompanyAccounts() {
  const { profile } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("company_accounts")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("company_accounts").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("company_accounts").update(values as any).eq("id", id);
    fetch();
  };

  return { accounts, loading, create, update, refresh: fetch };
}
