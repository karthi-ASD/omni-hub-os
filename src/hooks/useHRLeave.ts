import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHRLeaveTypes() {
  const { profile } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_leave_types")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("name");
    setLeaveTypes(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("hr_leave_types").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_leave_types").update(values as any).eq("id", id);
    fetch();
  };

  return { leaveTypes, loading, create, update, refresh: fetch };
}

export function useHRLeaveRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_leave_requests")
      .select("*, hr_employees(full_name, employee_code, department_id, departments(name)), hr_leave_types(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("hr_leave_requests").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const approve = async (id: string, userId: string) => {
    await supabase.from("hr_leave_requests").update({
      status: "approved", approved_by: userId, approved_at: new Date().toISOString(),
    } as any).eq("id", id);
    fetch();
  };

  const reject = async (id: string) => {
    await supabase.from("hr_leave_requests").update({ status: "rejected" } as any).eq("id", id);
    fetch();
  };

  return { requests, loading, create, approve, reject, refresh: fetch };
}
