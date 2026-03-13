import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SalesTeamMember {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  /** hr_employees.id — used when user_id is not available */
  employee_id?: string;
}

export function useSalesTeam() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<SalesTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;

    // 1. Find the Sales department
    const { data: salesDept } = await supabase
      .from("departments")
      .select("id")
      .eq("business_id", profile.business_id)
      .ilike("name", "%sales%")
      .limit(1)
      .maybeSingle();

    if (!salesDept?.id) { setMembers([]); setLoading(false); return; }

    // 2. Get all active employees in the Sales department
    const { data: salesEmps } = await supabase
      .from("hr_employees")
      .select("id, user_id, full_name, email")
      .eq("business_id", profile.business_id)
      .eq("department_id", salesDept.id)
      .eq("employment_status", "active")
      .order("full_name");

    const emps = salesEmps || [];

    if (emps.length === 0) { setMembers([]); setLoading(false); return; }

    // 3. For employees WITH user_id, try to get their profile (avatar etc.)
    const linkedIds = emps.filter(e => e.user_id).map(e => e.user_id) as string[];
    let profileMap = new Map<string, { avatar_url: string | null }>();

    if (linkedIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url")
        .in("user_id", linkedIds);
      (profiles || []).forEach(p => profileMap.set(p.user_id, { avatar_url: p.avatar_url }));
    }

    // 4. Build the members list — use employee id as fallback identifier
    const result: SalesTeamMember[] = emps.map(e => ({
      user_id: e.user_id || e.id, // fallback to employee id for assignment
      full_name: e.full_name,
      email: e.email,
      avatar_url: e.user_id ? (profileMap.get(e.user_id)?.avatar_url ?? null) : null,
      employee_id: e.id,
    }));

    setMembers(result);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, refresh: fetch };
}
