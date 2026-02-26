import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSalaryProfiles() {
  const { profile } = useAuth();
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("salary_profiles")
      .select("*")
      .eq("business_id", profile.business_id);
    setSalaries(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("salary_profiles").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { salaries, loading, create, refresh: fetch };
}

export function usePayslips() {
  const { profile } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("payslips")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("generated_at", { ascending: false });
    setPayslips(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { payslips, loading, refresh: fetch };
}
