import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceWithClient {
  id: string;
  client_id: string;
  service_type: string;
  service_name: string | null;
  price_amount: number;
  billing_cycle: string;
  payment_method: string;
  payment_status: string;
  billing_date: number | null;
  next_billing_date: string | null;
  renewal_date: string | null;
  service_status: string;
  client_name: string;
  client_email: string;
  sales_owner_id: string | null;
  salesperson_owner: string | null;
  assigned_salesperson_id: string | null;
}

export function useRecurringRevenue() {
  const { profile } = useAuth();
  const [services, setServices] = useState<ServiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: svcData } = await supabase
      .from("client_services")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!svcData || svcData.length === 0) {
      setServices([]);
      setLoading(false);
      return;
    }

    const clientIds = [...new Set((svcData as any[]).map((s) => s.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, contact_name, email, sales_owner_id, salesperson_owner")
      .in("id", clientIds);

    const clientMap = new Map((clients as any[] || []).map((c) => [c.id, c]));

    const enriched: ServiceWithClient[] = (svcData as any[]).map((s) => {
      const client = clientMap.get(s.client_id);
      return {
        id: s.id,
        client_id: s.client_id,
        service_type: s.service_type,
        service_name: s.service_name || null,
        price_amount: Number(s.price_amount || 0),
        billing_cycle: s.billing_cycle || "one_time",
        payment_method: s.payment_method || "eft",
        payment_status: s.payment_status || "pending",
        billing_date: s.billing_date || null,
        next_billing_date: s.next_billing_date || null,
        renewal_date: s.renewal_date,
        service_status: s.service_status || "active",
        client_name: client?.contact_name || "Unknown",
        client_email: client?.email || "",
        sales_owner_id: client?.sales_owner_id,
        salesperson_owner: client?.salesperson_owner,
        assigned_salesperson_id: s.assigned_salesperson_id || null,
      };
    });

    setServices(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const recurringServices = useMemo(
    () => services.filter((s) =>
      ["weekly", "fortnightly", "monthly", "quarterly", "half_yearly", "yearly"].includes(s.billing_cycle)
    ),
    [services]
  );

  const toMonthly = (amount: number, cycle: string) => {
    switch (cycle) {
      case "weekly": return amount * 4.33;
      case "fortnightly": return amount * 2.17;
      case "monthly": return amount;
      case "quarterly": return amount / 3;
      case "half_yearly": return amount / 6;
      case "yearly": return amount / 12;
      default: return 0;
    }
  };

  const monthlyRevenue = useMemo(() => {
    return recurringServices
      .filter((s) => s.service_status === "active")
      .reduce((sum, s) => sum + toMonthly(s.price_amount, s.billing_cycle), 0);
  }, [recurringServices]);

  const yearlyRevenue = useMemo(() => monthlyRevenue * 12, [monthlyRevenue]);

  // Payments due today
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const paymentsDueToday = useMemo(
    () => services.filter((s) => s.next_billing_date === today && s.service_status === "active"),
    [services, today]
  );

  // Pending payments this month
  const pendingThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return services.filter((s) => {
      if (s.service_status !== "active" || s.payment_status === "paid") return false;
      if (!s.next_billing_date) return false;
      const d = new Date(s.next_billing_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [services]);

  // Overdue payments
  const overduePayments = useMemo(
    () => services.filter((s) =>
      s.service_status === "active" &&
      s.payment_status === "overdue"
    ),
    [services]
  );

  // Renewal tracking
  const renewalsToday = useMemo(
    () => services.filter((s) => s.renewal_date === today),
    [services, today]
  );

  const renewalsThisWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return services.filter((s) => {
      if (!s.renewal_date) return false;
      const d = new Date(s.renewal_date);
      return d >= now && d <= weekEnd;
    });
  }, [services]);

  const renewalsThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return services.filter((s) => {
      if (!s.renewal_date) return false;
      const d = new Date(s.renewal_date);
      return d.getFullYear() === year && d.getMonth() === month && d >= now;
    });
  }, [services]);

  const mrrByPaymentMethod = useMemo(() => {
    const map: Record<string, { customers: Set<string>; revenue: number }> = {};
    recurringServices.filter((s) => s.service_status === "active").forEach((s) => {
      const method = s.payment_method || "eft";
      if (!map[method]) map[method] = { customers: new Set(), revenue: 0 };
      map[method].customers.add(s.client_id);
      map[method].revenue += toMonthly(s.price_amount, s.billing_cycle);
    });
    return Object.entries(map).map(([method, data]) => ({
      method,
      customers: data.customers.size,
      revenue: data.revenue,
    }));
  }, [recurringServices]);

  const revenueByService = useMemo(() => {
    const map: Record<string, { customers: Set<string>; revenue: number }> = {};
    services.filter((s) => s.service_status === "active").forEach((s) => {
      if (!map[s.service_type]) map[s.service_type] = { customers: new Set(), revenue: 0 };
      map[s.service_type].customers.add(s.client_id);
      map[s.service_type].revenue += s.price_amount;
    });
    return Object.entries(map).map(([service, data]) => ({
      service,
      customers: data.customers.size,
      revenue: data.revenue,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [services]);

  const agentPerformance = useMemo(() => {
    const map: Record<string, { name: string; clients: Set<string>; recurringRevenue: number; services: Set<string> }> = {};
    services.filter((s) => s.service_status === "active").forEach((s) => {
      const agentId = s.sales_owner_id || "unassigned";
      const agentName = s.salesperson_owner || "Unassigned";
      if (!map[agentId]) map[agentId] = { name: agentName, clients: new Set(), recurringRevenue: 0, services: new Set() };
      map[agentId].clients.add(s.client_id);
      map[agentId].services.add(s.service_type);
      map[agentId].recurringRevenue += toMonthly(s.price_amount, s.billing_cycle);
    });
    return Object.entries(map).map(([id, data]) => ({
      agentId: id,
      agentName: data.name,
      totalClients: data.clients.size,
      recurringRevenue: data.recurringRevenue,
      servicesCount: data.services.size,
    })).sort((a, b) => b.recurringRevenue - a.recurringRevenue);
  }, [services]);

  return {
    services, recurringServices, loading,
    monthlyRevenue, yearlyRevenue,
    mrrByPaymentMethod, revenueByService, agentPerformance,
    paymentsDueToday, pendingThisMonth, overduePayments,
    renewalsToday, renewalsThisWeek, renewalsThisMonth,
    refetch: fetchAll,
  };
}
