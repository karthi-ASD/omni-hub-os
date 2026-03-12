import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SalesTeamMember {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export function useSalesTeam() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<SalesTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    // Get employee IDs from the Sales department only
    const { data: salesDept } = await supabase
      .from("departments")
      .select("id")
      .eq("business_id", profile.business_id)
      .ilike("name", "%sales%")
      .limit(1)
      .maybeSingle();

    if (!salesDept?.id) { setMembers([]); setLoading(false); return; }

    const { data: salesEmps } = await supabase
      .from("hr_employees")
      .select("user_id")
      .eq("business_id", profile.business_id)
      .eq("department_id", salesDept.id)
      .not("user_id", "is", null);

    const userIds = (salesEmps || []).map(e => e.user_id).filter(Boolean) as string[];
    if (userIds.length === 0) { setMembers([]); setLoading(false); return; }

    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url")
      .in("user_id", userIds)
      .order("full_name");
    setMembers(data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, refresh: fetch };
}
