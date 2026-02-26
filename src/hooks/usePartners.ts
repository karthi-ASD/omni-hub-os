import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Partner {
  id: string;
  partner_type: string;
  parent_partner_id: string | null;
  business_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  region: string | null;
  status: string;
  created_at: string;
}

export interface PartnerCommission {
  id: string;
  partner_id: string;
  tenant_business_id: string | null;
  platform_invoice_id: string | null;
  amount: number;
  status: string;
  approved_by_user_id: string | null;
  payout_batch_id: string | null;
  created_at: string;
}

export function usePartners() {
  const { isSuperAdmin } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    setPartners((data as any) || []);
    setLoading(false);
  }, []);

  const fetchCommissions = useCallback(async () => {
    const { data } = await supabase.from("partner_commissions").select("*").order("created_at", { ascending: false });
    setCommissions((data as any) || []);
  }, []);

  useEffect(() => {
    fetchPartners();
    fetchCommissions();
  }, [fetchPartners, fetchCommissions]);

  const createPartner = async (partner: Omit<Partner, "id" | "created_at">) => {
    const { error } = await supabase.from("partners").insert(partner as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Partner created");
    fetchPartners();
    return true;
  };

  const updatePartnerStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("partners").update({ status } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Partner updated");
    fetchPartners();
  };

  const approveCommission = async (id: string, userId: string) => {
    const { error } = await supabase.from("partner_commissions").update({ status: "approved", approved_by_user_id: userId } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Commission approved");
    fetchCommissions();
  };

  return { partners, commissions, loading, createPartner, updatePartnerStatus, approveCommission, refetch: fetchPartners };
}
