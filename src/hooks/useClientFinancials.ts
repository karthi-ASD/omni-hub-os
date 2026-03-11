import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientFinancialSummary {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  totalOutstanding: number;
  avgInvoiceValue: number;
  monthsActive: number;
  lastPaymentDate: string | null;
  clientSince: string | null;
  invoices: any[];
  payments: any[];
}

export function useClientFinancials(clientId: string | undefined) {
  const [data, setData] = useState<ClientFinancialSummary>({
    totalRevenue: 0, totalInvoices: 0, paidInvoices: 0,
    outstandingInvoices: 0, overdueInvoices: 0, totalOutstanding: 0,
    avgInvoiceValue: 0, monthsActive: 1, lastPaymentDate: null,
    clientSince: null, invoices: [], payments: [],
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const [invR, payR] = await Promise.all([
      supabase.from("xero_invoices").select("*").eq("client_id", clientId).order("invoice_date", { ascending: false }),
      supabase.from("xero_payments").select("*").eq("client_id", clientId).order("payment_date", { ascending: false }),
    ]);

    const invoices = (invR.data as any[]) || [];
    const payments = (payR.data as any[]) || [];

    const paid = invoices.filter(i => i.status === "PAID");
    const overdue = invoices.filter(i => i.status === "OVERDUE" || (["AUTHORISED", "SUBMITTED"].includes(i.status) && i.due_date && new Date(i.due_date) < new Date()));
    const outstanding = invoices.filter(i => ["AUTHORISED", "SUBMITTED"].includes(i.status));

    const totalRevenue = paid.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.amount_due || 0), 0);

    const dates = invoices.map(i => new Date(i.invoice_date || "")).filter(d => !isNaN(d.getTime()));
    const monthsActive = dates.length >= 2
      ? Math.max(1, Math.ceil((Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24 * 30)))
      : 1;

    const lastPaymentDate = payments.length > 0 ? payments[0].payment_date : null;

    setData({
      totalRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paid.length,
      outstandingInvoices: outstanding.length,
      overdueInvoices: overdue.length,
      totalOutstanding,
      avgInvoiceValue: paid.length > 0 ? totalRevenue / paid.length : 0,
      monthsActive,
      lastPaymentDate,
      invoices,
      payments,
    });
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, refetch: fetch };
}
