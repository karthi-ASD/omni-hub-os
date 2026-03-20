import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/**
 * Determines if the current user can access the dialer.
 * Rules:
 * - Super Admin / Business Admin → always allowed
 * - Sales department (checked via hr_employees.department) → allowed
 * - Client users → never allowed
 * - Other departments → not allowed
 * 
 * Additionally checks client.dialer_enabled if a clientId is provided.
 */
export function useDialerAccess(clientId?: string | null) {
  const { profile, roles, isSuperAdmin, isBusinessAdmin } = useAuth();

  // Check if user is in Sales department
  const { data: isSalesDept } = useQuery({
    queryKey: ["dialer-access-dept", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id || !profile?.business_id) return false;
      const { data } = await supabase
        .from("hr_employees")
        .select("department_id, departments:department_id(name)")
        .eq("user_id", profile.user_id)
        .eq("business_id", profile.business_id)
        .maybeSingle();
      
      if (!data) return false;
      const deptName = ((data as any)?.departments?.name || "").toLowerCase();
      return deptName.includes("sales");
    },
    enabled: !!profile?.user_id && !isSuperAdmin && !isBusinessAdmin,
    staleTime: 5 * 60 * 1000,
  });

  // Check if client has dialer enabled (when viewing a specific client context)
  const { data: clientDialerEnabled } = useQuery({
    queryKey: ["dialer-client-enabled", clientId],
    queryFn: async () => {
      if (!clientId) return true; // No client context = allow
      const { data } = await supabase
        .from("clients")
        .select("dialer_enabled")
        .eq("id", clientId)
        .maybeSingle();
      return data?.dialer_enabled ?? false;
    },
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });

  const hasRoleAccess = isSuperAdmin || isBusinessAdmin || !!isSalesDept;
  const isClientUser = roles.includes("client");
  const hasClientPermission = clientId ? (clientDialerEnabled ?? false) : true;

  return {
    canAccessDialer: hasRoleAccess && !isClientUser && hasClientPermission,
    hasRoleAccess,
    isClientUser,
    clientDialerEnabled: hasClientPermission,
  };
}
