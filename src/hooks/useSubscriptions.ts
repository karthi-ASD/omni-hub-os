import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptions() {
  const { isSuperAdmin, profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscriptions((data as any as Subscription[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createSubscription = async (input: {
    business_id: string;
    plan_id: string;
    billing_cycle?: string;
    status?: string;
    trial_ends_at?: string;
  }) => {
    const { error } = await supabase.from("subscriptions").insert({
      business_id: input.business_id,
      plan_id: input.plan_id,
      billing_cycle: input.billing_cycle || "monthly",
      status: input.status || "trial",
      trial_ends_at: input.trial_ends_at || new Date(Date.now() + 14 * 86400000).toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    } as any);
    if (error) {
      if (error.code === "23505") toast.error("Company already has a subscription");
      else toast.error("Failed to create subscription");
      return;
    }
    toast.success("Subscription created");
    fetchAll();
  };

  const updateSubscription = async (id: string, input: Partial<Subscription>) => {
    const { error } = await supabase.from("subscriptions").update({
      ...input,
      updated_at: new Date().toISOString(),
    } as any).eq("id", id);
    if (error) { toast.error("Failed to update subscription"); return; }
    toast.success("Subscription updated");
    fetchAll();
  };

  const cancelSubscription = async (id: string) => {
    await updateSubscription(id, { status: "cancelled", cancelled_at: new Date().toISOString() } as any);
  };

  return { subscriptions, loading, createSubscription, updateSubscription, cancelSubscription, refetch: fetchAll };
}
