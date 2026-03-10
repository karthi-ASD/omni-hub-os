import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EmployeeDepartmentInfo {
  departmentId: string | null;
  departmentName: string | null;
  designation: string | null;
  employeeId: string | null;
}

export function useEmployeeDepartment(): EmployeeDepartmentInfo & { loading: boolean } {
  const { user, profile } = useAuth();
  const [info, setInfo] = useState<EmployeeDepartmentInfo>({
    departmentId: null,
    departmentName: null,
    designation: null,
    employeeId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !profile?.business_id) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      // Find hr_employee record linked to this user
      const { data: emp } = await supabase
        .from("hr_employees")
        .select("id, department_id, designation")
        .eq("user_id", user.id)
        .eq("business_id", profile.business_id)
        .maybeSingle();

      if (!emp?.department_id) {
        // Fallback: try matching by email
        const { data: empByEmail } = await supabase
          .from("hr_employees")
          .select("id, department_id, designation")
          .eq("email", profile.email)
          .eq("business_id", profile.business_id)
          .maybeSingle();

        if (empByEmail?.department_id) {
          const { data: dept } = await supabase
            .from("departments")
            .select("name")
            .eq("id", empByEmail.department_id)
            .maybeSingle();

          setInfo({
            departmentId: empByEmail.department_id,
            departmentName: dept?.name ?? null,
            designation: empByEmail.designation,
            employeeId: empByEmail.id,
          });
        }
        setLoading(false);
        return;
      }

      const { data: dept } = await supabase
        .from("departments")
        .select("name")
        .eq("id", emp.department_id)
        .maybeSingle();

      setInfo({
        departmentId: emp.department_id,
        departmentName: dept?.name ?? null,
        designation: emp.designation,
        employeeId: emp.id,
      });
      setLoading(false);
    };

    fetch();
  }, [user?.id, profile?.business_id, profile?.email]);

  return { ...info, loading };
}
