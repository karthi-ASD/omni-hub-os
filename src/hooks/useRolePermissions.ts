import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ModulePermission {
  id: string;
  module_key: string;
  role_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
}

// All available modules in the system
export const SYSTEM_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "deals", label: "Deals" },
  { key: "inquiries", label: "Inquiries" },
  { key: "clients", label: "Clients" },
  { key: "proposals", label: "Proposals" },
  { key: "contracts", label: "Contracts" },
  { key: "projects", label: "Projects" },
  { key: "tasks", label: "Tasks" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "billing", label: "Billing" },
  { key: "revenue", label: "Revenue Reports" },
  { key: "seo", label: "SEO Tools" },
  { key: "seo_projects", label: "SEO Projects" },
  { key: "marketing", label: "Marketing" },
  { key: "hr", label: "HR Management" },
  { key: "employees", label: "Employees" },
  { key: "departments", label: "Departments" },
  { key: "leave", label: "Leave Management" },
  { key: "payroll", label: "Payroll" },
  { key: "performance", label: "Performance" },
  { key: "tickets", label: "Support Tickets" },
  { key: "knowledge_base", label: "Knowledge Base" },
  { key: "calendar", label: "Calendar" },
  { key: "reports", label: "Reports" },
  { key: "communications", label: "Communications" },
  { key: "settings", label: "Settings" },
  { key: "users", label: "User Management" },
  { key: "audit_logs", label: "Audit Logs" },
  { key: "vault", label: "Vault" },
] as const;

export const SYSTEM_ROLES = [
  "super_admin",
  "business_admin",
  "hr_manager",
  "manager",
  "employee",
  "client",
] as const;

export const ROLE_TEMPLATES: Record<string, Record<string, Partial<ModulePermission>>> = {
  finance_manager: {
    dashboard: { can_view: true },
    invoices: { can_view: true, can_create: true, can_edit: true, can_export: true },
    payments: { can_view: true, can_create: true, can_edit: true, can_export: true },
    billing: { can_view: true, can_create: true, can_edit: true },
    revenue: { can_view: true, can_export: true },
    clients: { can_view: true },
    deals: { can_view: true },
    contracts: { can_view: true },
    reports: { can_view: true, can_export: true },
    calendar: { can_view: true },
  },
  seo_manager: {
    dashboard: { can_view: true },
    seo: { can_view: true, can_create: true, can_edit: true },
    seo_projects: { can_view: true, can_create: true, can_edit: true, can_delete: true },
    marketing: { can_view: true, can_create: true, can_edit: true },
    clients: { can_view: true },
    tasks: { can_view: true, can_create: true, can_edit: true },
    reports: { can_view: true, can_export: true },
    calendar: { can_view: true },
    communications: { can_view: true, can_create: true },
  },
  hr_manager: {
    dashboard: { can_view: true },
    hr: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true },
    employees: { can_view: true, can_create: true, can_edit: true, can_delete: true },
    departments: { can_view: true, can_create: true, can_edit: true },
    leave: { can_view: true, can_approve: true },
    payroll: { can_view: true, can_create: true, can_edit: true, can_export: true },
    performance: { can_view: true, can_create: true, can_edit: true },
    calendar: { can_view: true },
    reports: { can_view: true, can_export: true },
  },
  sales_manager: {
    dashboard: { can_view: true },
    leads: { can_view: true, can_create: true, can_edit: true },
    deals: { can_view: true, can_create: true, can_edit: true },
    inquiries: { can_view: true, can_create: true, can_edit: true },
    clients: { can_view: true, can_create: true, can_edit: true },
    proposals: { can_view: true, can_create: true, can_edit: true },
    contracts: { can_view: true, can_create: true },
    tasks: { can_view: true, can_create: true, can_edit: true },
    calendar: { can_view: true },
    reports: { can_view: true, can_export: true },
  },
};

export function useRolePermissions() {
  const { profile, roles, isSuperAdmin, isBusinessAdmin } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [allPermissions, setAllPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("role_module_permissions")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("role_name")
      .order("module_key");
    setAllPermissions((data as any as ModulePermission[]) ?? []);

    // Filter to current user's roles
    const userPerms = (data ?? []).filter((p: any) =>
      roles.includes(p.role_name)
    );
    setPermissions(userPerms as any as ModulePermission[]);
    setLoading(false);
  }, [profile?.business_id, roles]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const canAccess = useCallback((moduleKey: string, action: "view" | "create" | "edit" | "delete" | "approve" | "export" = "view"): boolean => {
    // Super admin and business admin bypass all permission checks
    if (isSuperAdmin || isBusinessAdmin) return true;

    const field = `can_${action}` as keyof ModulePermission;
    return permissions.some(
      (p) => p.module_key === moduleKey && p[field] === true
    );
  }, [permissions, isSuperAdmin, isBusinessAdmin]);

  const upsertPermission = async (
    roleName: string,
    moduleKey: string,
    updates: Partial<Pick<ModulePermission, "can_view" | "can_create" | "can_edit" | "can_delete" | "can_approve" | "can_export">>
  ) => {
    if (!profile?.business_id) return;

    const existing = allPermissions.find(
      (p) => p.role_name === roleName && p.module_key === moduleKey
    );

    if (existing) {
      await supabase
        .from("role_module_permissions")
        .update(updates as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("role_module_permissions").insert({
        business_id: profile.business_id,
        role_name: roleName,
        module_key: moduleKey,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,
        can_export: false,
        ...updates,
      } as any);
    }

    // Log to audit
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "UPDATE_PERMISSION",
      entity_type: "role_module_permissions",
      entity_id: `${roleName}:${moduleKey}`,
      new_value_json: updates,
    } as any);

    await fetchPermissions();
  };

  const applyTemplate = async (roleName: string, templateKey: string) => {
    if (!profile?.business_id) return;
    const template = ROLE_TEMPLATES[templateKey];
    if (!template) return;

    // Delete existing permissions for this role
    await supabase
      .from("role_module_permissions")
      .delete()
      .eq("business_id", profile.business_id)
      .eq("role_name", roleName);

    // Insert template permissions
    const rows = Object.entries(template).map(([moduleKey, perms]) => ({
      business_id: profile.business_id,
      role_name: roleName,
      module_key: moduleKey,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_approve: false,
      can_export: false,
      ...perms,
    }));

    await supabase.from("role_module_permissions").insert(rows as any);
    await fetchPermissions();
  };

  const cloneRole = async (sourceRole: string, targetRole: string) => {
    if (!profile?.business_id) return;
    const sourcePerms = allPermissions.filter((p) => p.role_name === sourceRole);

    // Delete existing target permissions
    await supabase
      .from("role_module_permissions")
      .delete()
      .eq("business_id", profile.business_id)
      .eq("role_name", targetRole);

    const rows = sourcePerms.map((p) => ({
      business_id: profile.business_id,
      role_name: targetRole,
      module_key: p.module_key,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
      can_approve: p.can_approve,
      can_export: p.can_export,
    }));

    if (rows.length > 0) {
      await supabase.from("role_module_permissions").insert(rows as any);
    }
    await fetchPermissions();
  };

  return {
    permissions,
    allPermissions,
    loading,
    canAccess,
    upsertPermission,
    applyTemplate,
    cloneRole,
    refetch: fetchPermissions,
  };
}
