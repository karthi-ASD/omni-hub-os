import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHREmployees() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("hr_employees")
      .select("*, departments(name)")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const { data, error } = await supabase
      .from("hr_employees")
      .insert([{ ...values, business_id: profile.business_id } as any])
      .select()
      .single();
    fetch();
    return { data, error };
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("hr_employees").update(values as any).eq("id", id);
    fetch();
  };

  const deactivate = async (id: string, reason: string) => {
    await supabase.from("hr_employees").update({
      employment_status: reason,
      deactivation_reason: reason,
      deactivated_at: new Date().toISOString(),
    } as any).eq("id", id);
    fetch();
  };

  return { employees, loading, create, update, deactivate, refresh: fetch };
}

export function useHREmployeeDetail(employeeId: string | undefined) {
  const [employee, setEmployee] = useState<any>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const [empRes, eduRes, bankRes, insRes, emgRes, docRes, attRes] = await Promise.all([
      supabase.from("hr_employees").select("*, departments(name)").eq("id", employeeId).single(),
      supabase.from("hr_employee_education").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_bank_details").select("*").eq("employee_id", employeeId).maybeSingle(),
      supabase.from("hr_employee_insurance").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_emergency_contacts").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_documents").select("*").eq("employee_id", employeeId).order("uploaded_at", { ascending: false }),
      supabase.from("hr_employee_attendance").select("*").eq("employee_id", employeeId).order("date", { ascending: false }).limit(50),
    ]);
    setEmployee(empRes.data);
    setEducation(eduRes.data ?? []);
    setBankDetails(bankRes.data);
    setInsurance(insRes.data ?? []);
    setEmergencyContacts(emgRes.data ?? []);
    setDocuments(docRes.data ?? []);
    setAttendance(attRes.data ?? []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsertEducation = async (values: Record<string, any>) => {
    if (!employeeId) return;
    await supabase.from("hr_employee_education").insert([{ ...values, employee_id: employeeId } as any]);
    fetch();
  };

  const upsertBankDetails = async (values: Record<string, any>) => {
    if (!employeeId) return;
    if (bankDetails?.id) {
      await supabase.from("hr_employee_bank_details").update(values as any).eq("id", bankDetails.id);
    } else {
      await supabase.from("hr_employee_bank_details").insert([{ ...values, employee_id: employeeId } as any]);
    }
    fetch();
  };

  const addInsurance = async (values: Record<string, any>) => {
    if (!employeeId) return;
    await supabase.from("hr_employee_insurance").insert([{ ...values, employee_id: employeeId } as any]);
    fetch();
  };

  const addEmergencyContact = async (values: Record<string, any>) => {
    if (!employeeId) return;
    await supabase.from("hr_employee_emergency_contacts").insert([{ ...values, employee_id: employeeId } as any]);
    fetch();
  };

  const addDocument = async (values: Record<string, any>) => {
    if (!employeeId) return;
    await supabase.from("hr_employee_documents").insert([{ ...values, employee_id: employeeId } as any]);
    fetch();
  };

  return {
    employee, education, bankDetails, insurance, emergencyContacts, documents, attendance, loading,
    upsertEducation, upsertBankDetails, addInsurance, addEmergencyContact, addDocument, refresh: fetch,
  };
}
