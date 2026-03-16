import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";

const ALLOWED_DEPARTMENTS = ["accounts", "finance", "account"];

export function useCanCreateClient(): { canCreate: boolean; loading: boolean } {
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { departmentName, loading } = useEmployeeDepartment();

  if (isSuperAdmin || isBusinessAdmin) return { canCreate: true, loading: false };
  if (loading) return { canCreate: false, loading: true };

  const dept = (departmentName || "").toLowerCase();
  const canCreate = ALLOWED_DEPARTMENTS.some((d) => dept.includes(d));
  return { canCreate, loading: false };
}
