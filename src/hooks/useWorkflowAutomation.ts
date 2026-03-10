import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkflowRule {
  id: string;
  business_id: string;
  name: string;
  trigger_event_type: string;
  config_json: any;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  business_id: string;
  rule_id: string;
  event_id: string | null;
  status: string;
  logs_json: any;
  created_at: string;
}

export const TRIGGER_TYPES = [
  { key: "CLIENT_CREATED", label: "Client Created", icon: "UserPlus" },
  { key: "CLIENT_ONBOARDING_UPDATED", label: "Client Onboarding Updated", icon: "UserCheck" },
  { key: "PROJECT_CREATED", label: "Project Created", icon: "FolderPlus" },
  { key: "TASK_COMPLETED", label: "Task Completed", icon: "CheckCircle" },
  { key: "INVOICE_CREATED", label: "Invoice Created", icon: "FileText" },
  { key: "PAYMENT_RECEIVED", label: "Payment Received", icon: "CreditCard" },
  { key: "EMPLOYEE_ADDED", label: "Employee Added", icon: "UserPlus" },
  { key: "DEAL_WON", label: "Deal Won", icon: "Trophy" },
  { key: "LEAD_CREATED", label: "Lead Created", icon: "Target" },
] as const;

export const ACTION_TYPES = [
  { key: "create_project", label: "Create Project" },
  { key: "create_tasks", label: "Create Tasks" },
  { key: "assign_department", label: "Assign Department" },
  { key: "notify_user", label: "Notify User/Role" },
  { key: "send_email", label: "Send Email" },
  { key: "update_status", label: "Update Status" },
  { key: "create_sla", label: "Create SLA Deadline" },
  { key: "assign_employee", label: "Auto-assign Employee" },
] as const;

export const WORKFLOW_TEMPLATES = [
  {
    name: "SEO Client Onboarding",
    trigger: "CLIENT_CREATED",
    config: {
      condition: { field: "service_type", operator: "equals", value: "SEO" },
      actions: [
        { type: "create_project", config: { name_template: "{client_name} – SEO Campaign" } },
        { type: "create_tasks", config: { tasks: ["Website Audit", "Keyword Research", "Competitor Analysis", "Technical SEO Fixes", "On-Page Optimization", "Content Planning", "Backlink Strategy", "Monthly Reporting Setup"] } },
        { type: "assign_department", config: { department: "SEO" } },
        { type: "notify_user", config: { role: "manager", message: "New SEO client onboarded" } },
        { type: "create_sla", config: { default_hours: 48 } },
      ],
    },
  },
  {
    name: "Website Development Workflow",
    trigger: "CLIENT_CREATED",
    config: {
      condition: { field: "service_type", operator: "equals", value: "Web Development" },
      actions: [
        { type: "create_project", config: { name_template: "{client_name} – Web Development" } },
        { type: "create_tasks", config: { tasks: ["Requirements Gathering", "Wireframes & Design", "Frontend Development", "Backend Development", "Testing & QA", "Deployment", "Client Training"] } },
        { type: "assign_department", config: { department: "Development" } },
        { type: "notify_user", config: { role: "manager", message: "New web dev project created" } },
      ],
    },
  },
  {
    name: "PPC Campaign Workflow",
    trigger: "CLIENT_CREATED",
    config: {
      condition: { field: "service_type", operator: "equals", value: "PPC" },
      actions: [
        { type: "create_project", config: { name_template: "{client_name} – PPC Campaign" } },
        { type: "create_tasks", config: { tasks: ["Account Setup", "Keyword Research", "Ad Copy Creation", "Landing Page Review", "Campaign Launch", "Performance Monitoring", "Monthly Optimization"] } },
        { type: "assign_department", config: { department: "Marketing" } },
        { type: "notify_user", config: { role: "manager", message: "New PPC client onboarded" } },
      ],
    },
  },
  {
    name: "Client Support Workflow",
    trigger: "CLIENT_CREATED",
    config: {
      condition: { field: "service_type", operator: "equals", value: "Support" },
      actions: [
        { type: "create_tasks", config: { tasks: ["Welcome Call", "System Access Setup", "Knowledge Base Tour", "SLA Agreement Review"] } },
        { type: "assign_department", config: { department: "Support" } },
        { type: "notify_user", config: { role: "manager", message: "New support client onboarded" } },
        { type: "create_sla", config: { default_hours: 24 } },
      ],
    },
  },
];

export function useWorkflowAutomation() {
  const { profile } = useAuth();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRules((data ?? []) as any as WorkflowRule[]);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchRuns = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("automation_runs")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(100);
    setRuns((data ?? []) as any as WorkflowRun[]);
  }, [profile?.business_id]);

  useEffect(() => { fetchRules(); fetchRuns(); }, [fetchRules, fetchRuns]);

  const createRule = async (input: { name: string; trigger_event_type: string; config_json: any }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("automation_rules").insert({
      business_id: profile.business_id,
      ...input,
    } as any);
    if (error) { toast.error("Failed to create workflow"); return; }
    toast.success("Workflow created");
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id, actor_user_id: profile.user_id,
      action_type: "CREATE_WORKFLOW", entity_type: "automation_rules",
    } as any);
    fetchRules();
  };

  const updateRule = async (id: string, updates: Partial<WorkflowRule>) => {
    await supabase.from("automation_rules").update(updates as any).eq("id", id);
    fetchRules();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("automation_rules").update({ is_enabled: enabled } as any).eq("id", id);
    toast.success(enabled ? "Workflow enabled" : "Workflow disabled");
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    await supabase.from("automation_rules").delete().eq("id", id);
    toast.success("Workflow deleted");
    fetchRules();
  };

  const createFromTemplate = async (templateIndex: number) => {
    const tpl = WORKFLOW_TEMPLATES[templateIndex];
    if (!tpl) return;
    await createRule({
      name: tpl.name,
      trigger_event_type: tpl.trigger,
      config_json: tpl.config,
    });
  };

  return { rules, runs, loading, createRule, updateRule, toggleRule, deleteRule, createFromTemplate, refetch: fetchRules, refetchRuns: fetchRuns };
}
