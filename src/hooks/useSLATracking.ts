import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSLATracking() {
  const { profile } = useAuth();
  const [slaItems, setSlaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("sla_tracking")
      .select("*, client_projects(client_name, service_type), project_tasks(title, status), departments(name)")
      .eq("business_id", profile.business_id)
      .order("deadline_at", { ascending: true });

    // Auto-compute status
    const now = new Date();
    const items = ((data as any[]) ?? []).map(s => {
      if (s.status === "breached") return s;
      const deadline = new Date(s.deadline_at);
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      let status = s.status;
      if (hoursLeft < 0) status = "breached";
      else if (hoursLeft < s.sla_hours * 0.25) status = "at_risk";
      else status = "on_track";
      return { ...s, computed_status: status, hours_remaining: Math.round(hoursLeft) };
    });

    setSlaItems(items);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("sla_tracking").insert([{
      ...values,
      business_id: profile.business_id,
    } as any]);
    fetch();
  };

  return { slaItems, loading, create, refresh: fetch };
}
