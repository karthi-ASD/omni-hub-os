import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BillingStats {
  revenueThisMonth: number;
  mrr: number;
  overdueInvoices: number;
  totalPaid: number;
  totalOpen: number;
  suspendedAccounts: number;
}

export function useBillingStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<BillingStats>({
    revenueThisMonth: 0,
    mrr: 0,
    overdueInvoices: 0,
    totalPaid: 0,
    totalOpen: 0,
    suspendedAccounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetch = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Revenue this month
      const { data: paidPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "approved")
        .gte("paid_at", monthStart);

      const revenueThisMonth = paidPayments?.reduce((s, p) => s + Number((p as any).amount), 0) || 0;

      // MRR from active recurring profiles
      const { data: recurring } = await supabase
        .from("recurring_profiles")
        .select("amount, frequency")
        .eq("status", "active");

      const mrr = recurring?.reduce((s, r) => {
        const amt = Number((r as any).amount);
        return s + ((r as any).frequency === "yearly" ? amt / 12 : amt);
      }, 0) || 0;

      // Overdue invoices
      const { count: overdueCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue");

      // Paid invoices
      const { count: paidCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid");

      // Open invoices
      const { count: openCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");

      // Suspended accounts
      const { count: suspendedCount } = await supabase
        .from("account_suspensions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        revenueThisMonth,
        mrr,
        overdueInvoices: overdueCount || 0,
        totalPaid: paidCount || 0,
        totalOpen: openCount || 0,
        suspendedAccounts: suspendedCount || 0,
      });
      setLoading(false);
    };

    fetch();
  }, [profile]);

  return { stats, loading };
}
