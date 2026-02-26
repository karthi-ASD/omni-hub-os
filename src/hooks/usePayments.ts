import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Payment {
  id: string;
  business_id: string;
  client_id: string | null;
  invoice_id: string | null;
  subscription_id: string | null;
  gateway_provider: string;
  eway_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setPayments((data as any as Payment[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return { payments, loading, refetch: fetchPayments };
}
