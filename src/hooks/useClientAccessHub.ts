import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AccessCredential {
  id: string;
  client_id: string;
  business_id: string;
  credential_type: "hosting" | "domain" | "website";
  provider_name: string | null;
  domain_name: string | null;
  platform_type: string | null;
  url: string | null;
  login_url: string | null;
  username: string | null;
  password_encrypted: string | null;
  account_email: string | null;
  recovery_email: string | null;
  admin_email: string | null;
  expiry_date: string | null;
  auto_renew_status: string;
  reminder_days: number;
  reminder_email: string | null;
  status: string;
  notes: string | null;
  is_client_visible: boolean;
  is_archived: boolean;
  two_fa_enabled: boolean;
  backup_contact: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectIntegration {
  id: string;
  client_id: string;
  business_id: string;
  integration_type: string;
  is_enabled: boolean;
  provider_name: string | null;
  api_url: string | null;
  api_key_encrypted: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  account_id: string | null;
  property_id: string | null;
  measurement_id: string | null;
  business_manager_id: string | null;
  connected_account_name: string | null;
  connected_email: string | null;
  status: string;
  verification_status: string | null;
  last_sync_at: string | null;
  notes: string | null;
  is_client_visible: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  record_type: string;
  record_id: string;
  action_type: string;
  action_by: string | null;
  action_note: string | null;
  created_at: string;
}

export function useClientAccessHub(clientId: string | undefined) {
  const { user, profile } = useAuth();
  const [credentials, setCredentials] = useState<AccessCredential[]>([]);
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = profile?.business_id;

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const [credRes, intRes, auditRes] = await Promise.all([
      supabase
        .from("client_access_credentials")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_project_integrations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_access_audit_logs")
        .select("id, record_type, record_id, action_type, action_by, action_note, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setCredentials((credRes.data as any[]) ?? []);
    setIntegrations((intRes.data as any[]) ?? []);
    setAuditLogs((auditRes.data as any[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const logAudit = async (
    recordType: string, recordId: string, actionType: string, note?: string
  ) => {
    if (!clientId || !businessId) return;
    await supabase.from("client_access_audit_logs").insert({
      client_id: clientId,
      business_id: businessId,
      record_type: recordType,
      record_id: recordId,
      action_type: actionType,
      action_by: user?.id,
      action_note: note || null,
    } as any);
  };

  const addCredential = async (data: Partial<AccessCredential>) => {
    if (!clientId || !businessId) return;
    const { data: res, error } = await supabase
      .from("client_access_credentials")
      .insert({
        ...data,
        client_id: clientId,
        business_id: businessId,
        created_by: user?.id,
        updated_by: user?.id,
      } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to add credential"); return null; }
    await logAudit("credential", (res as any).id, "create", `Added ${data.credential_type} credential`);
    toast.success("Credential added");
    fetchAll();
    return res;
  };

  const updateCredential = async (id: string, data: Partial<AccessCredential>) => {
    const { error } = await supabase
      .from("client_access_credentials")
      .update({ ...data, updated_by: user?.id } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to update credential"); return; }
    await logAudit("credential", id, "update", "Updated credential");
    toast.success("Credential updated");
    fetchAll();
  };

  const archiveCredential = async (id: string) => {
    const { error } = await supabase
      .from("client_access_credentials")
      .update({ is_archived: true, updated_by: user?.id } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to archive"); return; }
    await logAudit("credential", id, "archive", "Archived credential");
    toast.success("Credential archived");
    fetchAll();
  };

  const addIntegration = async (data: Partial<ProjectIntegration>) => {
    if (!clientId || !businessId) return;
    const { data: res, error } = await supabase
      .from("client_project_integrations")
      .insert({
        ...data,
        client_id: clientId,
        business_id: businessId,
        created_by: user?.id,
        updated_by: user?.id,
      } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to add integration"); return null; }
    await logAudit("integration", (res as any).id, "create", `Added ${data.integration_type} integration`);
    toast.success("Integration added");
    fetchAll();
    return res;
  };

  const updateIntegration = async (id: string, data: Partial<ProjectIntegration>) => {
    const { error } = await supabase
      .from("client_project_integrations")
      .update({ ...data, updated_by: user?.id } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to update integration"); return; }
    await logAudit("integration", id, "update", "Updated integration");
    toast.success("Integration updated");
    fetchAll();
  };

  const logRevealPassword = async (recordId: string) => {
    await logAudit("credential", recordId, "reveal_password", "Password revealed");
  };

  const logCopyAction = async (recordId: string, field: string) => {
    await logAudit("credential", recordId, "copy", `Copied ${field}`);
  };

  return {
    credentials,
    integrations,
    auditLogs,
    loading,
    addCredential,
    updateCredential,
    archiveCredential,
    addIntegration,
    updateIntegration,
    logRevealPassword,
    logCopyAction,
    refetch: fetchAll,
  };
}
