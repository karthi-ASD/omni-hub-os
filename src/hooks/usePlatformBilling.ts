import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PlatformInvoice {
  id: string;
  client_business_id: string;
  invoice_number: number;
  type: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export interface PlatformPayment {
  id: string;
  client_business_id: string;
  invoice_id: string | null;
  gateway_type: string;
  gateway_transaction_id: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function usePlatformBilling() {
  const { profile, isSuperAdmin } = useAuth();
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [invRes, payRes] = await Promise.all([
      supabase.from("platform_invoices").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("platform_payments").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setInvoices((invRes.data as any as PlatformInvoice[]) || []);
    setPayments((payRes.data as any as PlatformPayment[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createInvoice = async (input: {
    client_business_id: string;
    type?: string;
    amount: number;
    tax?: number;
    description?: string;
    due_date?: string;
  }) => {
    const total = input.amount + (input.tax || 0);
    const { data, error } = await supabase.from("platform_invoices").insert({
      client_business_id: input.client_business_id,
      type: input.type || "one_time",
      amount: input.amount,
      tax: input.tax || 0,
      total,
      description: input.description,
      due_date: input.due_date,
    } as any).select().single();

    if (error) { toast.error("Failed to create platform invoice"); return null; }

    await supabase.from("system_events").insert({
      business_id: input.client_business_id,
      event_type: "PLATFORM_INVOICE_CREATED",
      payload_json: { entity_type: "platform_invoice", entity_id: (data as any).id, short_message: `Platform invoice #${(data as any).invoice_number} created` },
    });

    toast.success("Platform invoice created");
    fetchAll();
    return data as any as PlatformInvoice;
  };

  const sendInvoice = async (invoiceId: string) => {
    await supabase.from("platform_invoices").update({ status: "sent" } as any).eq("id", invoiceId);
    toast.success("Invoice sent");
    fetchAll();
  };

  const markPaid = async (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    await supabase.from("platform_invoices").update({ status: "paid" } as any).eq("id", invoiceId);

    await supabase.from("platform_payments").insert({
      client_business_id: inv.client_business_id,
      invoice_id: invoiceId,
      gateway_type: "manual",
      amount: inv.total,
      status: "success",
      paid_at: new Date().toISOString(),
    } as any);

    await supabase.from("system_events").insert({
      business_id: inv.client_business_id,
      event_type: "PLATFORM_PAYMENT_RECEIVED",
      payload_json: { entity_type: "platform_invoice", entity_id: invoiceId, short_message: "Platform payment received" },
    });

    toast.success("Marked as paid");
    fetchAll();
  };

  return { invoices, payments, loading, createInvoice, sendInvoice, markPaid, refetch: fetchAll };
}
