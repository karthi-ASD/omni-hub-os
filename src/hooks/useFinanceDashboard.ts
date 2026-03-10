import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface XeroInvoice {
  id: string;
  xero_invoice_id: string;
  invoice_number: string | null;
  client_id: string | null;
  contact_name: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  department_category: string | null;
  line_items_json: any;
  synced_at: string;
}

export interface XeroPayment {
  id: string;
  xero_payment_id: string;
  client_id: string | null;
  payment_amount: number;
  payment_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
}

export interface AgencyExpense {
  id: string;
  category: string;
  department: string | null;
  description: string | null;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
}

export interface BillingSchedule {
  id: string;
  client_id: string;
  service_type: string;
  monthly_fee: number;
  billing_cycle: string;
  next_billing_date: string | null;
  is_active: boolean;
}

export interface XeroConnection {
  id: string;
  is_connected: boolean;
  last_sync_at: string | null;
}

const DEPARTMENTS = ["SEO", "Website Development", "Mobile App Development", "Google Ads", "Hosting", "Maintenance", "Design"];

export function useFinanceDashboard() {
  const { profile } = useAuth();
  const bizId = profile?.business_id;

  const [xeroInvoices, setXeroInvoices] = useState<XeroInvoice[]>([]);
  const [xeroPayments, setXeroPayments] = useState<XeroPayment[]>([]);
  const [expenses, setExpenses] = useState<AgencyExpense[]>([]);
  const [billingSchedules, setBillingSchedules] = useState<BillingSchedule[]>([]);
  const [xeroConnection, setXeroConnection] = useState<XeroConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bizId) return;
    setLoading(true);

    const [invR, payR, expR, schedR, connR, logR] = await Promise.all([
      supabase.from("xero_invoices").select("*").eq("business_id", bizId).order("invoice_date", { ascending: false }).limit(500),
      supabase.from("xero_payments").select("*").eq("business_id", bizId).order("payment_date", { ascending: false }).limit(500),
      supabase.from("agency_expenses").select("*").eq("business_id", bizId).order("expense_date", { ascending: false }).limit(300),
      supabase.from("client_billing_schedules").select("*").eq("business_id", bizId).order("next_billing_date", { ascending: true }),
      supabase.from("xero_connections").select("*").eq("business_id", bizId).maybeSingle(),
      supabase.from("xero_sync_logs").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(20),
    ]);

    setXeroInvoices((invR.data as any[]) ?? []);
    setXeroPayments((payR.data as any[]) ?? []);
    setExpenses((expR.data as any[]) ?? []);
    setBillingSchedules((schedR.data as any[]) ?? []);
    setXeroConnection((connR.data as any) ?? null);
    setSyncLogs((logR.data as any[]) ?? []);
    setLoading(false);
  }, [bizId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Computed metrics
  const totalRevenue = xeroInvoices.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.total_amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

  const paidInvoices = xeroInvoices.filter(i => i.status === "PAID");
  const overdueInvoices = xeroInvoices.filter(i => i.status === "OVERDUE" || (i.status === "AUTHORISED" && i.due_date && new Date(i.due_date) < new Date()));
  const outstandingInvoices = xeroInvoices.filter(i => ["AUTHORISED", "SUBMITTED"].includes(i.status));
  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + Number(i.amount_due), 0);
  const avgInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

  // Monthly revenue (last 12 months)
  const monthlyRevenue = (() => {
    const months: Record<string, number> = {};
    paidInvoices.forEach(inv => {
      if (inv.invoice_date) {
        const key = inv.invoice_date.substring(0, 7); // YYYY-MM
        months[key] = (months[key] || 0) + Number(inv.total_amount);
      }
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, revenue]) => ({ month, revenue }));
  })();

  // Revenue by department
  const revenueByDepartment = (() => {
    const depts: Record<string, number> = {};
    paidInvoices.forEach(inv => {
      const dept = inv.department_category || "Unassigned";
      depts[dept] = (depts[dept] || 0) + Number(inv.total_amount);
    });
    return Object.entries(depts).map(([department, revenue]) => ({ department, revenue }));
  })();

  // Revenue by client (top 10)
  const revenueByClient = (() => {
    const clients: Record<string, { name: string; revenue: number }> = {};
    paidInvoices.forEach(inv => {
      const key = inv.client_id || inv.contact_name || "Unknown";
      const name = inv.contact_name || "Unknown";
      if (!clients[key]) clients[key] = { name, revenue: 0 };
      clients[key].revenue += Number(inv.total_amount);
    });
    return Object.values(clients).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  })();

  // MRR / ARR from billing schedules
  const activeSchedules = billingSchedules.filter(s => s.is_active);
  const mrr = activeSchedules.reduce((s, bs) => {
    const fee = Number(bs.monthly_fee);
    if (bs.billing_cycle === "yearly") return s + fee / 12;
    if (bs.billing_cycle === "quarterly") return s + fee / 3;
    return s + fee;
  }, 0);
  const arr = mrr * 12;

  // CLV helper
  const getClientLifetimeValue = (clientId: string) => {
    const clientInvoices = paidInvoices.filter(i => i.client_id === clientId);
    const totalRev = clientInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const invoiceCount = clientInvoices.length;
    const avgValue = invoiceCount > 0 ? totalRev / invoiceCount : 0;
    const dates = clientInvoices.map(i => new Date(i.invoice_date || "")).filter(d => !isNaN(d.getTime()));
    const monthsActive = dates.length >= 2
      ? Math.ceil((Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()))) / (1000 * 60 * 60 * 24 * 30))
      : 1;
    return { totalRev, invoiceCount, avgValue, monthsActive };
  };

  // Month-over-month growth
  const revenueGrowth = (() => {
    if (monthlyRevenue.length < 2) return 0;
    const current = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const previous = monthlyRevenue[monthlyRevenue.length - 2].revenue;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  })();

  // Expense CRUD
  const addExpense = async (values: Partial<AgencyExpense>) => {
    if (!bizId) return;
    await supabase.from("agency_expenses").insert({ ...values, business_id: bizId } as any);
    toast.success("Expense recorded");
    fetchAll();
  };

  const addBillingSchedule = async (values: Partial<BillingSchedule>) => {
    if (!bizId) return;
    await supabase.from("client_billing_schedules").insert({ ...values, business_id: bizId } as any);
    toast.success("Billing schedule created");
    fetchAll();
  };

  return {
    xeroInvoices, xeroPayments, expenses, billingSchedules, xeroConnection, syncLogs, loading,
    totalRevenue, totalExpenses, grossProfit, profitMargin,
    paidInvoices, overdueInvoices, outstandingInvoices, totalOutstanding, avgInvoiceValue,
    monthlyRevenue, revenueByDepartment, revenueByClient,
    mrr, arr, activeSchedules, revenueGrowth,
    getClientLifetimeValue, addExpense, addBillingSchedule,
    departments: DEPARTMENTS,
    refresh: fetchAll,
  };
}
