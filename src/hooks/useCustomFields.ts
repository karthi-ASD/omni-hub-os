import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CustomField {
  id: string;
  business_id: string;
  module_name: string;
  field_label: string;
  field_key: string;
  field_type: string;
  is_required: boolean;
  options: any;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  custom_field_id: string;
  record_id: string;
  module_name: string;
  value: string | null;
}

export const MODULE_OPTIONS = [
  { value: "clients", label: "Clients" },
  { value: "leads", label: "Leads" },
  { value: "deals", label: "Deals" },
  { value: "projects", label: "Projects" },
  { value: "invoices", label: "Invoices" },
  { value: "contacts", label: "Contacts" },
  { value: "accounts", label: "Accounts" },
  { value: "tickets", label: "Tickets" },
  { value: "contracts", label: "Contracts" },
];

export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean (Yes/No)" },
];

export function useCustomFields(moduleName?: string) {
  const { profile } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFields = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    let query = supabase
      .from("custom_fields")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("module_name")
      .order("display_order");

    if (moduleName) {
      query = query.eq("module_name", moduleName).eq("is_active", true);
    }

    const { data } = await query;
    setFields((data as any as CustomField[]) || []);
    setLoading(false);
  }, [profile?.business_id, moduleName]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const createField = async (input: {
    module_name: string;
    field_label: string;
    field_type: string;
    is_required?: boolean;
    options?: string[];
    display_order?: number;
  }) => {
    if (!profile?.business_id) return null;
    const field_key = input.field_label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const { data, error } = await supabase
      .from("custom_fields")
      .insert({
        business_id: profile.business_id,
        module_name: input.module_name,
        field_label: input.field_label,
        field_key,
        field_type: input.field_type,
        is_required: input.is_required || false,
        options: input.options || [],
        display_order: input.display_order || 0,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success("Custom field created");
    fetchFields();
    return data as any as CustomField;
  };

  const updateField = async (id: string, updates: Partial<CustomField>) => {
    const { error } = await supabase
      .from("custom_fields")
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Custom field updated");
    fetchFields();
  };

  const deleteField = async (id: string) => {
    const { error } = await supabase.from("custom_fields").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Custom field deleted");
    fetchFields();
  };

  return { fields, loading, createField, updateField, deleteField, refetch: fetchFields };
}

export function useCustomFieldValues(moduleName: string, recordId?: string) {
  const { profile } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchValues = useCallback(async () => {
    if (!profile?.business_id || !recordId) return;
    setLoading(true);
    const { data } = await supabase
      .from("custom_field_values")
      .select("custom_field_id, value")
      .eq("record_id", recordId)
      .eq("module_name", moduleName)
      .eq("business_id", profile.business_id);

    const map: Record<string, string> = {};
    (data || []).forEach((v: any) => {
      map[v.custom_field_id] = v.value || "";
    });
    setValues(map);
    setLoading(false);
  }, [profile?.business_id, recordId, moduleName]);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const saveValues = async (fieldValues: Record<string, string>) => {
    if (!profile?.business_id || !recordId) return;

    const upserts = Object.entries(fieldValues).map(([fieldId, value]) => ({
      business_id: profile.business_id,
      custom_field_id: fieldId,
      record_id: recordId,
      module_name: moduleName,
      value: value || null,
    }));

    for (const row of upserts) {
      await supabase
        .from("custom_field_values")
        .upsert(row as any, { onConflict: "custom_field_id,record_id" });
    }

    toast.success("Custom fields saved");
    fetchValues();
  };

  return { values, loading, saveValues, refetch: fetchValues };
}
