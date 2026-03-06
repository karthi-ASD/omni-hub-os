import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCSTickets() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    open: 0, overdue: 0, resolvedToday: 0, avgResponseMin: 0, csatAvg: 0, aiHandledPct: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(100);
    const all = data ?? [];
    setTickets(all);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const open = all.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
    const overdue = all.filter((t: any) => t.sla_due_at && new Date(t.sla_due_at) < now && t.status !== "resolved" && t.status !== "closed").length;
    const resolvedToday = all.filter((t: any) => t.resolved_at?.startsWith(todayStr)).length;
    const withCsat = all.filter((t: any) => t.csat_score);
    const csatAvg = withCsat.length > 0 ? Math.round(withCsat.reduce((s: number, t: any) => s + (t.csat_score || 0), 0) / withCsat.length * 20) : 0;

    setStats({ open, overdue, resolvedToday, avgResponseMin: 0, csatAvg, aiHandledPct: 0 });
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tickets, stats, loading, refresh: fetch };
}
