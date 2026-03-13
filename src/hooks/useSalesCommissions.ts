import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SalesCommission {
  id: string;
  business_id: string;
  client_id: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  payment_received_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

export function useSalesCommissions() {
  const { profile } = useAuth();
  const [commissions, setCommissions] = useState<SalesCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sales_commissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setCommissions((data as any as SalesCommission[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  const createCommission = async (input: {
    client_id: string;
    sales_rep_name: string;
    sales_rep_id?: string;
    deal_value: number;
    commission_rate?: number;
  }) => {
    if (!profile?.business_id) return;
    const rate = input.commission_rate || 10;
    const amount = (input.deal_value * rate) / 100;
    const { error } = await supabase.from("sales_commissions").insert({
      business_id: profile.business_id,
      client_id: input.client_id,
      sales_rep_id: input.sales_rep_id,
      sales_rep_name: input.sales_rep_name,
      deal_value: input.deal_value,
      commission_rate: rate,
      commission_amount: amount,
    } as any);
    if (error) { toast.error("Failed to create commission"); return; }
    toast.success("Commission recorded");
    fetchCommissions();
  };

  const approveCommission = async (id: string) => {
    if (!profile) return;
    await supabase.from("sales_commissions").update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: profile.user_id,
    } as any).eq("id", id);
    toast.success("Commission approved");
    fetchCommissions();
  };

  const myCommissions = commissions.filter(
    (c) => c.sales_rep_id === profile?.user_id
  );

  const pendingTotal = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + c.commission_amount, 0);

  const approvedTotal = commissions
    .filter((c) => c.status === "approved")
    .reduce((s, c) => s + c.commission_amount, 0);

  return {
    commissions, loading, createCommission, approveCommission,
    myCommissions, pendingTotal, approvedTotal, refetch: fetchCommissions,
  };
}
