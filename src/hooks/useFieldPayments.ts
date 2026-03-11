import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GatewayTransaction {
  id: string;
  business_id: string;
  gateway_id: string | null;
  job_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_ref: string | null;
  receipt_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  notes: string | null;
  collected_by_user_id: string | null;
  created_at: string;
}

export function useFieldPayments(jobId?: string) {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<GatewayTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const businessId = profile?.business_id;

  const fetchTransactions = useCallback(async () => {
    if (!businessId || !jobId) return;
    setLoading(true);
    const { data } = await supabase
      .from("gateway_transactions" as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    setTransactions((data as any) || []);
    setLoading(false);
  }, [businessId, jobId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const generateReceiptNumber = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP-${ts}-${rand}`;
  };

  const collectPayment = async (values: {
    amount: number;
    payment_method: string;
    customer_name?: string;
    customer_email?: string;
    notes?: string;
  }) => {
    if (!businessId || !user || !jobId) return null;

    const receiptNumber = generateReceiptNumber();

    const { data, error } = await supabase
      .from("gateway_transactions" as any)
      .insert([{
        business_id: businessId,
        job_id: jobId,
        amount: values.amount,
        payment_method: values.payment_method,
        status: "completed",
        receipt_number: receiptNumber,
        customer_name: values.customer_name || null,
        customer_email: values.customer_email || null,
        notes: values.notes || null,
        collected_by_user_id: user.id,
      } as any])
      .select()
      .single();

    if (error) throw error;

    // Update job payment status
    await supabase.from("jobs").update({
      payment_status: "paid",
      payment_amount: values.amount,
    } as any).eq("id", jobId);

    fetchTransactions();
    return { ...(data as any), receipt_number: receiptNumber };
  };

  const markJobPaid = async (amount: number) => {
    if (!jobId) return;
    await supabase.from("jobs").update({
      payment_status: "paid",
      payment_amount: amount,
    } as any).eq("id", jobId);
  };

  return {
    transactions,
    loading,
    collectPayment,
    markJobPaid,
    refetch: fetchTransactions,
  };
}
