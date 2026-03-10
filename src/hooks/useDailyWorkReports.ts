import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyWorkReport {
  id: string;
  employee_id: string;
  user_id: string | null;
  report_date: string;
  department_id: string | null;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_pending: number;
  calls_made: number;
  meetings_conducted: number;
  demos_done: number;
  tickets_handled: number;
  tickets_created: number;
  proposals_sent: number;
  leads_handled: number;
  deals_closed: number;
  notes: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

export function useDailyWorkReports() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await (supabase.from("daily_work_reports" as any) as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("report_date", { ascending: false })
      .limit(200);
    setReports((data ?? []) as DailyWorkReport[]);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsertReport = async (values: Partial<DailyWorkReport> & { employee_id: string; report_date: string }) => {
    if (!profile?.business_id || !user) return;
    await (supabase.from("daily_work_reports" as any) as any).upsert({
      business_id: profile.business_id,
      user_id: user.id,
      ...values,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }, { onConflict: "business_id,employee_id,report_date" });
    fetch();
  };

  return { reports, loading, upsertReport, refresh: fetch };
}
