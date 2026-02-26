import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useInfraMonitoring() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [uptimeChecks, setUptimeChecks] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [nodesRes, uptimeRes, deployRes, secRes] = await Promise.all([
      supabase.from("infrastructure_nodes").select("*").order("created_at", { ascending: false }),
      supabase.from("uptime_checks").select("*").order("checked_at", { ascending: false }).limit(50),
      supabase.from("deployment_logs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("security_audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setNodes((nodesRes.data as any) || []);
    setUptimeChecks((uptimeRes.data as any) || []);
    setDeployments((deployRes.data as any) || []);
    setSecurityLogs((secRes.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { nodes, uptimeChecks, deployments, securityLogs, loading, refetch: fetchAll };
}
