import { useMemo } from "react";
import { useClients } from "@/hooks/useClients";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { useRenewalReminders } from "@/hooks/useRenewalReminders";
import { addDays, isFuture, isPast } from "date-fns";

export function useRevenueForecasting() {
  const { clients } = useClients();
  const { payments } = usePayments();
  const { invoices } = useInvoices();
  const { reminders } = useRenewalReminders();

  return useMemo(() => {
    const activeClients = clients.filter((c: any) => c.client_status === "active");

    // MRR from active contracts
    const mrr = activeClients.reduce((sum, c: any) => {
      const cv = Number(c.contract_value || 0);
      return sum + cv / 12; // annualized to monthly
    }, 0);

    // Renewal revenue by period
    const now = new Date();
    const renewalRevenue = (days: number) =>
      reminders
        .filter((r) => {
          if (r.status !== "pending") return false;
          const d = new Date(r.reminder_date);
          return isFuture(d) && d <= addDays(now, days);
        })
        .reduce((sum, r) => sum + (r.contract_value || 0), 0);

    const renewal30 = renewalRevenue(30);
    const renewal60 = renewalRevenue(60);
    const renewal90 = renewalRevenue(90);

    // Outstanding payments
    const outstandingPayments = (invoices as any[])
      .filter((i) => i.status === "sent" || i.status === "pending")
      .reduce((sum, i) => sum + (i.total || i.amount || 0), 0);

    // Revenue by state
    const revenueByState: Record<string, number> = {};
    activeClients.forEach((c: any) => {
      const state = c.state || "Unknown";
      revenueByState[state] = (revenueByState[state] || 0) + Number(c.contract_value || 0);
    });

    // Revenue by service
    const revenueByService: Record<string, number> = {};
    activeClients.forEach((c: any) => {
      const svc = c.service_category || "Uncategorized";
      revenueByService[svc] = (revenueByService[svc] || 0) + Number(c.contract_value || 0);
    });

    // Clients by state
    const clientsByState: Record<string, number> = {};
    activeClients.forEach((c: any) => {
      const state = c.state || "Unknown";
      clientsByState[state] = (clientsByState[state] || 0) + 1;
    });

    // Churn risk counts
    const churnRisk = {
      high: clients.filter((c: any) => c.churn_risk === "high").length,
      medium: clients.filter((c: any) => c.churn_risk === "medium").length,
      low: clients.filter((c: any) => c.churn_risk === "low").length,
    };

    // Health score distribution
    const healthDist = {
      excellent: clients.filter((c: any) => c.health_score === "excellent").length,
      healthy: clients.filter((c: any) => c.health_score === "healthy").length,
      needs_attention: clients.filter((c: any) => c.health_score === "needs_attention").length,
      critical: clients.filter((c: any) => c.health_score === "critical").length,
    };

    return {
      mrr,
      renewal30, renewal60, renewal90,
      outstandingPayments,
      revenueByState,
      revenueByService,
      clientsByState,
      churnRisk,
      healthDist,
      totalActiveClients: activeClients.length,
      totalRevenue: activeClients.reduce((s, c: any) => s + Number(c.contract_value || 0), 0),
    };
  }, [clients, payments, invoices, reminders]);
}
