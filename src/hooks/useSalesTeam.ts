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

    // Get users who have a sales-related role or belong to the sales department
    // First try employee_profiles with department = 'sales'
    const { data: empData } = await supabase
      .from("employee_profiles")
      .select("user_id, full_name, department")
      .eq("business_id", profile.business_id)
      .ilike("department", "%sales%");

    const salesUserIds = new Set((empData || []).map(e => e.user_id).filter(Boolean));

    // Also get profiles for those users + any with sales roles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["sales_agent", "sales_manager"] as any[]);

    (roleData || []).forEach(r => salesUserIds.add(r.user_id));

    if (salesUserIds.size === 0) {
      // Fallback: return all non-client profiles for this business
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .eq("business_id", profile.business_id)
        .order("full_name");
      setMembers(allProfiles || []);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url")
      .in("user_id", Array.from(salesUserIds))
      .order("full_name");

    setMembers(profiles || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, refresh: fetch };
}
