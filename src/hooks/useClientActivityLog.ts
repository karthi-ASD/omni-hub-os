import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientActivity {
  id: string;
  client_id: string;
  business_id: string;
  activity_type: string;
  activity_source: string;
  description: string | null;
  created_by_user_id: string | null;
  created_at: string;
  created_by_name?: string;
}

export function useClientActivityLog(clientId: string | undefined) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("client_activity_log")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error) {
      const userIds = [...new Set((data || []).map((a: any) => a.created_by_user_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      }
      setActivities((data || []).map((a: any) => ({
        ...a,
        created_by_name: nameMap[a.created_by_user_id] || "System",
      })));
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const logActivity = async (input: {
    activity_type: string;
    activity_source?: string;
    description: string;
  }) => {
    if (!clientId || !profile?.business_id) return;
    const { error } = await supabase.from("client_activity_log").insert({
      client_id: clientId,
      business_id: profile.business_id,
      activity_type: input.activity_type,
      activity_source: input.activity_source || "manual",
      description: input.description,
      created_by_user_id: profile.user_id,
    } as any);
    if (error) { toast.error("Failed to log activity"); return; }
    fetchActivities();
  };

  return { activities, loading, logActivity, refetch: fetchActivities };
}
