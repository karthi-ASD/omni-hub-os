import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentGateway {
  id: string;
  business_id: string | null;
  gateway_type: string;
  mode: string;
  is_active: boolean;
  created_at: string;
}

export function usePaymentGateways() {
  const { profile } = useAuth();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payment_gateways")
      .select("id, business_id, gateway_type, mode, is_active, created_at")
      .order("created_at", { ascending: false });
    setGateways((data as any as PaymentGateway[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addGateway = async (input: {
    gateway_type: string;
    mode: string;
  }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("payment_gateways").insert({
      business_id: profile.business_id,
      gateway_type: input.gateway_type,
      mode: input.mode,
    } as any);
    if (error) { toast.error("Failed to add gateway"); return; }
    toast.success("Gateway added");
    fetch();
  };

  const toggleGateway = async (id: string, isActive: boolean) => {
    await supabase.from("payment_gateways").update({ is_active: isActive } as any).eq("id", id);
    fetch();
  };

  return { gateways, loading, addGateway, toggleGateway, refetch: fetch };
}
