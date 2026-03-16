import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

/**
 * useInvoices – READ-ONLY hook.
 * All invoice creation, editing, payments, and status changes must happen in Xero.
 * This hook provides read-only access to legacy CRM invoices for backward compatibility.
 */
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

  return {
    invoices, loading, totalCount, page, hasMore,
    loadMore, setFilter, statusFilter,
    refetch: () => fetchInvoices(0, statusFilter),
  };
}
