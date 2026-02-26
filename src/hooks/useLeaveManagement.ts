import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLeaveTypes() {
  const { profile } = useAuth();
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("name");
    setTypes(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string, quota: number) => {
    if (!profile?.business_id) return;
    await supabase.from("leave_types").insert({
      business_id: profile.business_id,
      name,
      annual_quota_days: quota,
    });
    fetch();
  };

  return { types, loading, create, refresh: fetch };
}

export function useLeaveRequests() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("leave_requests")
      .select("*, leave_types(name)")
      .eq("business_id", profile.business_id)
      .order("requested_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { leave_type_id: string; start_date: string; end_date: string; reason?: string }) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("leave_requests").insert({
      ...values,
      user_id: user.id,
      business_id: profile.business_id,
    });
    fetch();
  };

  const approve = async (id: string) => {
    if (!user) return;
    await supabase.from("leave_requests").update({
      status: "approved",
      approved_by_user_id: user.id,
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    fetch();
  };

  const reject = async (id: string) => {
    if (!user) return;
    await supabase.from("leave_requests").update({
      status: "rejected",
      approved_by_user_id: user.id,
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    fetch();
  };

  return { requests, loading, create, approve, reject, refresh: fetch };
}
