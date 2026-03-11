import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientDepartment {
  id: string;
  client_id: string;
  business_id: string;
  department_name: string;
  manager_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientEmployee {
  id: string;
  client_id: string;
  business_id: string;
  department_id: string | null;
  employee_name: string;
  phone: string | null;
  email: string | null;
  designation: string | null;
  joining_date: string | null;
  status: string;
  app_access: boolean;
  created_at: string;
  updated_at: string;
}

export function useClientWorkforce(clientId?: string) {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<ClientDepartment[]>([]);
  const [employees, setEmployees] = useState<ClientEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = profile?.business_id;

  const fetchDepartments = useCallback(async () => {
    if (!businessId || !clientId) return;
    const { data } = await supabase
      .from("client_departments" as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("client_id", clientId)
      .order("department_name");
    setDepartments((data as any) || []);
  }, [businessId, clientId]);

  const fetchEmployees = useCallback(async () => {
    if (!businessId || !clientId) return;
    const { data } = await supabase
      .from("client_employees" as any)
      .select("*")
      .eq("business_id", businessId)
      .eq("client_id", clientId)
      .order("employee_name");
    setEmployees((data as any) || []);
  }, [businessId, clientId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDepartments(), fetchEmployees()]);
    setLoading(false);
  }, [fetchDepartments, fetchEmployees]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createDepartment = async (values: Partial<ClientDepartment>) => {
    if (!businessId || !clientId) return;
    await supabase.from("client_departments" as any).insert([{
      ...values,
      business_id: businessId,
      client_id: clientId,
    } as any]);
    fetchDepartments();
  };

  const updateDepartment = async (id: string, values: Partial<ClientDepartment>) => {
    await supabase.from("client_departments" as any).update(values as any).eq("id", id);
    fetchDepartments();
  };

  const deleteDepartment = async (id: string) => {
    await supabase.from("client_departments" as any).delete().eq("id", id);
    fetchAll();
  };

  const createEmployee = async (values: Partial<ClientEmployee>) => {
    if (!businessId || !clientId) return;
    await supabase.from("client_employees" as any).insert([{
      ...values,
      business_id: businessId,
      client_id: clientId,
    } as any]);
    fetchEmployees();
  };

  const updateEmployee = async (id: string, values: Partial<ClientEmployee>) => {
    await supabase.from("client_employees" as any).update(values as any).eq("id", id);
    fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from("client_employees" as any).delete().eq("id", id);
    fetchEmployees();
  };

  return {
    departments,
    employees,
    loading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchAll,
  };
}
