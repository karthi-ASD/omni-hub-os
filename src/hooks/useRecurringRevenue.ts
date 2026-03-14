import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceWithClient {
  id: string;
  client_id: string;
  service_type: string;
  price_amount: number;
  billing_cycle: string;
  payment_method: string;
  renewal_date: string | null;
  service_status: string;
  client_name: string;
  client_email: string;
  sales_owner_id: string | null;
  salesperson_owner: string | null;
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
        price_amount: Number(s.price_amount || 0),
        billing_cycle: s.billing_cycle || "one_time",
        payment_method: s.payment_method || "eft",
        renewal_date: s.renewal_date,
        service_status: s.service_status || "active",
        client_name: client?.contact_name || "Unknown",
        client_email: client?.email || "",
        sales_owner_id: client?.sales_owner_id,
        salesperson_owner: client?.salesperson_owner,
      };
    });

    setServices(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const recurringServices = useMemo(
    () => services.filter((s) => s.billing_cycle === "monthly" || s.billing_cycle === "quarterly" || s.billing_cycle === "yearly"),
    [services]
  );

  const monthlyRevenue = useMemo(() => {
    return recurringServices.reduce((sum, s) => {
      if (s.service_status !== "active") return sum;
      if (s.billing_cycle === "monthly") return sum + s.price_amount;
      if (s.billing_cycle === "quarterly") return sum + s.price_amount / 3;
      if (s.billing_cycle === "yearly") return sum + s.price_amount / 12;
      return sum;
    }, 0);
  }, [recurringServices]);

  const mrrByPaymentMethod = useMemo(() => {
    const map: Record<string, { customers: Set<string>; revenue: number }> = {};
    recurringServices.filter((s) => s.service_status === "active").forEach((s) => {
      const method = s.payment_method || "eft";
      if (!map[method]) map[method] = { customers: new Set(), revenue: 0 };
      map[method].customers.add(s.client_id);
      if (s.billing_cycle === "monthly") map[method].revenue += s.price_amount;
      else if (s.billing_cycle === "quarterly") map[method].revenue += s.price_amount / 3;
      else if (s.billing_cycle === "yearly") map[method].revenue += s.price_amount / 12;
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
      if (s.billing_cycle === "monthly") map[agentId].recurringRevenue += s.price_amount;
      else if (s.billing_cycle === "quarterly") map[agentId].recurringRevenue += s.price_amount / 3;
      else if (s.billing_cycle === "yearly") map[agentId].recurringRevenue += s.price_amount / 12;
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
    monthlyRevenue, mrrByPaymentMethod, revenueByService, agentPerformance,
    refetch: fetchAll,
  };
}
