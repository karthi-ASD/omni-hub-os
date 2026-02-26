import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useVault() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("vault_items")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("vault_access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data ?? []);
  }, []);

  useEffect(() => { fetchItems(); fetchLogs(); }, [fetchItems, fetchLogs]);

  const create = async (values: Record<string, any>) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("vault_items").insert([{
      ...values,
      business_id: profile.business_id,
      created_by: user.id,
    } as any]);
    fetchItems();
  };

  const logAccess = async (vaultItemId: string, action: string) => {
    if (!user) return;
    await supabase.from("vault_access_logs").insert([{
      vault_item_id: vaultItemId,
      accessed_by_user_id: user.id,
      action,
    } as any]);
    fetchLogs();
  };

  return { items, logs, loading, create, logAccess, refresh: fetchItems };
}
