import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TenantInvoice {
  id: string;
  business_id: string;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
}

export interface TenantPayment {
  id: string;
  business_id: string;
  invoice_id: string | null;
  gateway_type: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function useTenantBilling() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [invRes, payRes] = await Promise.all([
      supabase.from("tenant_invoices").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("tenant_payments").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setInvoices((invRes.data as any as TenantInvoice[]) || []);
    setPayments((payRes.data as any as TenantPayment[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createInvoice = async (input: {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    amount: number;
    tax?: number;
    description?: string;
    due_date?: string;
  }) => {
    if (!profile?.business_id) return null;
    const total = input.amount + (input.tax || 0);
    const { data, error } = await supabase.from("tenant_invoices").insert({
      business_id: profile.business_id,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      amount: input.amount,
      tax: input.tax || 0,
      total,
      description: input.description,
      due_date: input.due_date,
    } as any).select().single();

    if (error) { toast.error("Failed to create customer invoice"); return null; }

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "TENANT_INVOICE_CREATED",
      payload_json: { entity_type: "tenant_invoice", entity_id: (data as any).id, short_message: `Customer invoice created for ${input.customer_name}` },
    });

    toast.success("Customer invoice created");
    fetchAll();
    return data as any as TenantInvoice;
  };

  const sendInvoice = async (invoiceId: string) => {
    await supabase.from("tenant_invoices").update({ status: "sent" } as any).eq("id", invoiceId);
    toast.success("Invoice sent");
    fetchAll();
  };

  const markPaid = async (invoiceId: string) => {
    if (!profile?.business_id) return;
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    await supabase.from("tenant_invoices").update({ status: "paid" } as any).eq("id", invoiceId);

    await supabase.from("tenant_payments").insert({
      business_id: profile.business_id,
      invoice_id: invoiceId,
      gateway_type: "manual",
      amount: inv.total,
      status: "success",
      paid_at: new Date().toISOString(),
    } as any);

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "TENANT_PAYMENT_RECEIVED",
      payload_json: { entity_type: "tenant_invoice", entity_id: invoiceId, short_message: `Payment received from ${inv.customer_name}` },
    });

    toast.success("Marked as paid");
    fetchAll();
  };

  return { invoices, payments, loading, createInvoice, sendInvoice, markPaid, refetch: fetchAll };
}
