import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DataRetentionPolicy {
  id: string;
  scope_level: string;
  business_id: string | null;
  logs_retention_days: number;
  analytics_retention_days: number;
  ticket_retention_days: number;
  created_at: string;
}

export interface DataRequest {
  id: string;
  request_type: string;
  requester_user_id: string | null;
  business_id: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function useCompliance() {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from("data_retention_policies").select("*").order("created_at", { ascending: false }),
      supabase.from("data_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setPolicies((p.data as any) || []);
    setRequests((r.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createRequest = async (req: { request_type: string; business_id?: string }) => {
    const { error } = await supabase.from("data_requests").insert(req as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Data request submitted");
    fetchAll();
    return true;
  };

  const updateRequestStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "COMPLETED") updates.completed_at = new Date().toISOString();
    const { error } = await supabase.from("data_requests").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchAll();
  };

  return { policies, requests, loading, createRequest, updateRequestStatus, refetch: fetchAll };
}
