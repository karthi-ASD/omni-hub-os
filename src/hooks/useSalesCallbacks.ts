import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export interface SalesCallback {
  id: string;
  business_id: string;
  client_id: string | null;
  lead_id: string | null;
  sales_user_id: string;
  callback_date: string;
  callback_time: string | null;
  notes: string | null;
  result: string | null;
  next_step: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSalesCallbacks() {
  const { user, profile } = useAuth();
  const [callbacks, setCallbacks] = useState<SalesCallback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallbacks = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("sales_callbacks")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("callback_date", { ascending: true });
    setCallbacks((data as any as SalesCallback[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchCallbacks(); }, [fetchCallbacks]);

  const createCallback = async (input: {
    client_id?: string;
    lead_id?: string;
    callback_date: string;
    callback_time?: string;
    notes?: string;
  }) => {
    if (!user || !profile?.business_id) return null;
    const { data, error } = await supabase.from("sales_callbacks").insert({
      business_id: profile.business_id,
      sales_user_id: user.id,
      client_id: input.client_id || null,
      lead_id: input.lead_id || null,
      callback_date: input.callback_date,
      callback_time: input.callback_time || null,
      notes: input.notes || null,
    } as any).select().single();
    if (error) { toast.error("Failed to schedule callback"); return null; }
    toast.success("Callback scheduled");
    fetchCallbacks();
    return data as any as SalesCallback;
  };

  const completeCallback = async (id: string, result: string, nextStep?: string) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("sales_callbacks")
      .update({ status: "completed", result, next_step: nextStep || null, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to update callback"); return; }
    toast.success("Callback completed");
    fetchCallbacks();
  };

  const missCallback = async (id: string) => {
    await supabase.from("sales_callbacks")
      .update({ status: "missed", updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    fetchCallbacks();
  };

  return { callbacks, loading, createCallback, completeCallback, missCallback, refetch: fetchCallbacks };
}
