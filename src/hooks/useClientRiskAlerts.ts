import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientRiskAlert {
  id: string;
  business_id: string;
  client_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export function useClientRiskAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<ClientRiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_risk_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAlerts((data as any as ClientRiskAlert[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resolveAlert = async (id: string) => {
    await supabase.from("client_risk_alerts").update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", id);
    fetchAlerts();
  };

  const unresolvedAlerts = alerts.filter((a) => !a.is_resolved);
  const criticalAlerts = unresolvedAlerts.filter((a) => a.severity === "high" || a.severity === "critical");

  return { alerts, unresolvedAlerts, criticalAlerts, loading, resolveAlert, refetch: fetchAlerts };
}
