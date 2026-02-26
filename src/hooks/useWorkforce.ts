import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useEmployeeProfiles() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("employee_profiles")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("employee_profiles").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { employees, loading, create, refresh: fetch };
}

export function useAttendance() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("attendance_daily")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("date", { ascending: false })
      .limit(100);
    setRecords(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { records, loading, refresh: fetch };
}

export function useCheckins() {
  const { user, profile } = useAuth();

  const checkin = async (type: "in" | "out") => {
    if (!user || !profile?.business_id) return;
    await supabase.from("attendance_checkins").insert({
      user_id: user.id,
      business_id: profile.business_id,
      checkin_type: type,
      source: "web",
    });
  };

  return { checkin };
}

export function useEmployeeSessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("employee_sessions")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("login_at", { ascending: false })
      .limit(100);
    setSessions(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, loading, refresh: fetch };
}
