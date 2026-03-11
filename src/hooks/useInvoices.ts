import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "overdue" | "canceled";
export type InvoiceType = "one_time" | "recurring" | "milestone" | "prepaid";

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  billing_product_id?: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  client_id: string | null;
  deal_id: string | null;
  project_id: string | null;
  invoice_type: InvoiceType;
  invoice_number: number;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  due_date: string | null;
  pdf_url: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 50;

export function useInvoices() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchInvoices = useCallback(async (pageNum = 0, status = "all", append = false) => {
    if (!append) setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let countQuery = supabase
      .from("invoices")
      .select("id", { count: "exact", head: true });
    if (status !== "all") countQuery = countQuery.eq("status", status as any);

    const { count } = await countQuery;
    setTotalCount(count || 0);

    let dataQuery = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status !== "all") dataQuery = dataQuery.eq("status", status as any);

    const { data } = await dataQuery;
    const batch = (data as any as Invoice[]) || [];

    if (append) {
      setInvoices(prev => [...prev, ...batch]);
    } else {
      setInvoices(batch);
    }

    setHasMore(batch.length === PAGE_SIZE);
    setPage(pageNum);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices(0, statusFilter);
  }, [fetchInvoices, statusFilter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchInvoices(page + 1, statusFilter, true);
    }
  };

  const setFilter = (status: string) => {
    setStatusFilter(status);
  };

  const createInvoice = async (input: {
    client_id?: string;
    deal_id?: string;
    project_id?: string;
    invoice_type?: InvoiceType;
    items: InvoiceItem[];
    tax?: number;
    discount?: number;
    due_date?: string;
    currency?: string;
  }) => {
    if (!profile?.business_id) return null;

    const subtotal = input.items.reduce((sum, i) => sum + i.amount, 0);
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = subtotal + tax - discount;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        business_id: profile.business_id,
        client_id: input.client_id,
        deal_id: input.deal_id,
        project_id: input.project_id,
        invoice_type: input.invoice_type || "one_time",
        subtotal,
        tax,
        discount,
        total,
        amount_due: total,
        currency: input.currency || "AUD",
        due_date: input.due_date,
        created_by_user_id: profile.user_id,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create invoice"); return null; }

    const invoiceId = (data as any).id;

    if (input.items.length > 0) {
      await supabase.from("invoice_items").insert(
        input.items.map((item) => ({
          business_id: profile.business_id,
          invoice_id: invoiceId,
          billing_product_id: item.billing_product_id,
          description: item.description,
          quantity: item.quantity,
          unit_amount: item.unit_amount,
          amount: item.amount,
        })) as any
      );
    }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "INVOICE_CREATED",
        payload_json: { entity_type: "invoice", entity_id: invoiceId, actor_user_id: profile.user_id, short_message: `Invoice #${(data as any).invoice_number} created` },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "CREATE_INVOICE", entity_type: "invoice", entity_id: invoiceId,
      }),
    ]);

    toast.success("Invoice created");
    fetchInvoices(0, statusFilter);
    return data as any as Invoice;
  };

  const createFromDeal = async (dealId: string) => {
    if (!profile?.business_id) return null;

    const { data: deal } = await supabase.from("deals").select("*").eq("id", dealId).single();
    if (!deal) { toast.error("Deal not found"); return null; }

    const { data: client } = await supabase.from("clients").select("id").eq("deal_id", dealId).single();

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("deal_id", dealId)
      .eq("status", "accepted")
      .single();

    const items: InvoiceItem[] = [];
    let tax = 0;
    let discount = 0;

    if (proposal) {
      const services = (proposal as any).services_json as any[] || [];
      services.forEach((s: any) => {
        items.push({
          description: s.description || "Service",
          quantity: s.quantity || 1,
          unit_amount: s.unit_price || 0,
          amount: s.total || 0,
        });
      });
      tax = (proposal as any).tax_amount || 0;
      discount = (proposal as any).discount_amount || 0;
    } else if ((deal as any).estimated_value) {
      items.push({
        description: (deal as any).deal_name,
        quantity: 1,
        unit_amount: Number((deal as any).estimated_value),
        amount: Number((deal as any).estimated_value),
      });
    }

    if (items.length === 0) {
      toast.error("No billable items found");
      return null;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    return createInvoice({
      client_id: client?.id,
      deal_id: dealId,
      items,
      tax,
      discount,
      due_date: dueDate.toISOString().split("T")[0],
    });
  };

  const sendInvoice = async (invoiceId: string) => {
    if (!profile) return;
    await supabase.from("invoices").update({ status: "open" } as any).eq("id", invoiceId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "INVOICE_SENT",
      payload_json: { entity_type: "invoice", entity_id: invoiceId, actor_user_id: profile.user_id, short_message: "Invoice sent" },
    });
    toast.success("Invoice sent");
    fetchInvoices(page, statusFilter);
  };

  const markPaid = async (invoiceId: string, transactionId?: string) => {
    if (!profile) return;
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    await supabase.from("invoices").update({
      status: "paid",
      amount_paid: invoice.total,
      amount_due: 0,
    } as any).eq("id", invoiceId);

    await supabase.from("payments").insert({
      business_id: profile.business_id,
      client_id: invoice.client_id,
      invoice_id: invoiceId,
      gateway_provider: transactionId ? "eway" : "manual",
      eway_transaction_id: transactionId,
      amount: invoice.total,
      currency: invoice.currency,
      status: "approved",
      paid_at: new Date().toISOString(),
    } as any);

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "PAYMENT_SUCCEEDED",
        payload_json: { entity_type: "invoice", entity_id: invoiceId, actor_user_id: profile.user_id, short_message: `Payment received for invoice` },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "MARK_INVOICE_PAID", entity_type: "invoice", entity_id: invoiceId,
      }),
    ]);

    if (invoice.client_id) {
      const { data: suspension } = await supabase
        .from("account_suspensions")
        .select("id")
        .eq("client_id", invoice.client_id)
        .eq("is_active", true)
        .single();

      if (suspension) {
        await supabase.from("account_suspensions").update({
          is_active: false,
          reinstated_at: new Date().toISOString(),
        } as any).eq("id", (suspension as any).id);

        await supabase.from("system_events").insert({
          business_id: profile.business_id,
          event_type: "ACCOUNT_REINSTATED",
          payload_json: { entity_type: "client", entity_id: invoice.client_id, short_message: "Account reinstated after payment" },
        });
      }
    }

    toast.success("Invoice marked as paid");
    fetchInvoices(page, statusFilter);
  };

  const voidInvoice = async (invoiceId: string) => {
    if (!profile) return;
    await supabase.from("invoices").update({ status: "void" } as any).eq("id", invoiceId);
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id, actor_user_id: profile.user_id,
      action_type: "VOID_INVOICE", entity_type: "invoice", entity_id: invoiceId,
    });
    toast.success("Invoice voided");
    fetchInvoices(page, statusFilter);
  };

  return {
    invoices, loading, totalCount, page, hasMore,
    createInvoice, createFromDeal, sendInvoice, markPaid, voidInvoice,
    loadMore, setFilter, statusFilter,
    refetch: () => fetchInvoices(0, statusFilter),
  };
}
