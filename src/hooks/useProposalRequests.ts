import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProposalRequest {
  id: string;
  business_id: string;
  lead_id: string | null;
  client_id: string | null;
  requested_by_sales_id: string;
  client_name: string;
  service_details: string | null;
  budget_range: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
}

export function useProposalRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ProposalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proposal_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const userIds = [...new Set(data.map((r: any) => r.requested_by_sales_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      }
      setRequests(data.map((r: any) => ({ ...r, requester_name: nameMap[r.requested_by_sales_id] || "Unknown" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const createRequest = async (input: {
    lead_id?: string | null;
    client_id?: string | null;
    client_name: string;
    service_details?: string;
    budget_range?: string;
    notes?: string;
  }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("proposal_requests").insert({
      business_id: profile.business_id,
      requested_by_sales_id: profile.user_id,
      lead_id: input.lead_id || null,
      client_id: input.client_id || null,
      client_name: input.client_name,
      service_details: input.service_details || null,
      budget_range: input.budget_range || null,
      notes: input.notes || null,
    } as any);
    if (error) { toast.error("Failed to create proposal request"); return; }
    toast.success("Proposal request submitted");
    fetchRequests();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("proposal_requests").update({ status } as any).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success("Status updated");
    fetchRequests();
  };

  return { requests, loading, createRequest, updateStatus, refetch: fetchRequests };
}
