import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTenantCustomers() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("tenant_customers")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setCustomers(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { name: string; phone?: string; email?: string }) => {
    if (!profile?.business_id) return;
    await supabase.from("tenant_customers").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { customers, loading, create, refresh: fetch };
}

export function useJobs() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("jobs")
      .select("*, tenant_customers(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("jobs").insert([{
      ...values,
      business_id: profile.business_id,
      created_by_user_id: user.id,
    } as any]);
    fetch();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("jobs").update({ status }).eq("id", id);
    fetch();
  };

  return { jobs, loading, create, updateStatus, refresh: fetch };
}

export function useReviewRequests() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("review_requests")
      .select("*, tenant_customers(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (tenantCustomerId: string, jobId?: string) => {
    if (!profile?.business_id) return;
    await supabase.from("review_requests").insert([{
      business_id: profile.business_id,
      tenant_customer_id: tenantCustomerId,
      job_id: jobId || null,
    } as any]);
    fetch();
  };

  return { reviews, loading, create, refresh: fetch };
}
