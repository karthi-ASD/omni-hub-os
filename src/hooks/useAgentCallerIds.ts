import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface AgentCallerId {
  id: string;
  agent_user_id: string;
  agent_email: string;
  plivo_number: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  business_id: string;
}

/** Fetch caller IDs for the current logged-in agent */
export function useMyCallerIds() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["agent-caller-ids", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id || !profile?.business_id) return [];
      const { data, error } = await supabase
        .from("agent_caller_ids")
        .select("*")
        .eq("agent_user_id", profile.user_id)
        .eq("business_id", profile.business_id)
        .eq("is_active", true)
        .order("is_default", { ascending: false });
      if (error) {
        console.error("Failed to fetch caller IDs:", error);
        return [];
      }
      return (data as unknown as AgentCallerId[]) || [];
    },
    enabled: !!profile?.user_id,
    staleTime: 60_000,
  });
}

/** Fetch ALL caller IDs for admin management */
export function useAllCallerIds() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["all-agent-caller-ids", profile?.business_id],
    queryFn: async () => {
      if (!profile?.business_id) return [];
      const { data, error } = await supabase
        .from("agent_caller_ids")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("agent_email", { ascending: true });
      if (error) {
        console.error("Failed to fetch all caller IDs:", error);
        return [];
      }
      return (data as unknown as AgentCallerId[]) || [];
    },
    enabled: !!profile?.business_id,
  });
}
