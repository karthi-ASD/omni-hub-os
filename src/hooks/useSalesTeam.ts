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
    // Return all team profiles for this business
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url")
      .eq("business_id", profile.business_id)
      .order("full_name");
    setMembers(data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, refresh: fetch };
}
