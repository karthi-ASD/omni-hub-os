import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CrossDeptRequest {
  id: string;
  business_id: string;
  from_department_id: string | null;
  to_department_id: string | null;
  source_task_id: string | null;
  request_title: string;
  request_message: string | null;
  status: string;
  requested_by_user_id: string | null;
  requested_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function useCrossDepartmentRequests() {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<CrossDeptRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await (supabase.from("cross_department_requests" as any) as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRequests((data as any[]) ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: {
    from_department_id?: string;
    to_department_id?: string;
    source_task_id?: string;
    request_title: string;
    request_message?: string;
  }) => {
    if (!profile?.business_id || !user) return;
    await (supabase.from("cross_department_requests" as any) as any).insert([{
      ...values,
      business_id: profile.business_id,
      requested_by_user_id: user.id,
      requested_by_name: profile.full_name || profile.email,
    }]);
    toast.success("Cross-department request created");
    fetch();
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("cross_department_requests" as any) as any)
      .update({ status, ...(status === "completed" ? { resolved_at: new Date().toISOString() } : {}) })
      .eq("id", id);
    toast.success("Request updated");
    fetch();
  };

  return { requests, loading, create, updateStatus, refresh: fetch };
}
