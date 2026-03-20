import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const PIPELINE_STAGES = [
  { key: "new_project", label: "New Project", color: "bg-primary/10 text-primary" },
  { key: "site_inspection_scheduled", label: "Site Inspection Scheduled", color: "bg-info/10 text-info" },
  { key: "site_inspection_completed", label: "Site Inspection Completed", color: "bg-accent/10 text-accent" },
  { key: "quote_approved", label: "Quote Approved", color: "bg-neon-green/10 text-neon-green" },
  { key: "installation_scheduled", label: "Installation Scheduled", color: "bg-warning/10 text-warning" },
  { key: "installation_in_progress", label: "Installation In Progress", color: "bg-neon-orange/10 text-neon-orange" },
  { key: "installation_completed", label: "Installation Completed", color: "bg-success/10 text-success" },
  { key: "qa_testing", label: "QA & Testing", color: "bg-neon-blue/10 text-neon-blue" },
  { key: "handover_completed", label: "Handover Completed", color: "bg-success/20 text-success" },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]["key"];

export interface SolarProject {
  id: string;
  business_id: string;
  project_name: string;
  project_type: string;
  pipeline_stage: PipelineStage;
  status: string;
  system_size_kw: number | null;
  estimated_value: number | null;
  priority: string;
  client_id: string | null;
  lead_id: string | null;
  deal_id: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  roof_type: string | null;
  consumption_kwh: number | null;
  notes: string | null;
  description: string | null;
  start_date: string | null;
  target_end_date: string | null;
  assigned_manager_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSolarProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [loading, setLoading] = useState(true);
  const businessId = profile?.business_id;

  const fetchProjects = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); }
    setProjects((data as any as SolarProject[]) || []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (input: Partial<SolarProject>) => {
    if (!businessId || !profile?.user_id) return null;
    const { data, error } = await supabase.from("projects").insert({
      business_id: businessId,
      project_name: input.project_name || "New Solar Project",
      project_type: input.project_type || "solar_installation",
      pipeline_stage: "new_project",
      status: "new" as any,
      system_size_kw: input.system_size_kw,
      estimated_value: input.estimated_value,
      priority: input.priority || "medium",
      client_id: input.client_id,
      lead_id: input.lead_id,
      deal_id: input.deal_id,
      address: input.address,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      contact_email: input.contact_email,
      roof_type: input.roof_type,
      consumption_kwh: input.consumption_kwh,
      notes: input.notes,
      description: input.description,
      start_date: input.start_date,
      target_end_date: input.target_end_date,
      assigned_manager_user_id: input.assigned_manager_user_id || profile.user_id,
    } as any).select().single();

    if (error) { toast.error("Failed to create project"); return null; }
    const project = data as any;

    // Auto-create default tasks
    const defaultTasks = [
      { title: "Call client to confirm details", priority: "high", due_offset: 1 },
      { title: "Schedule site inspection", priority: "high", due_offset: 2 },
      { title: "Collect documentation (ID, bills)", priority: "medium", due_offset: 3 },
      { title: "Prepare system design proposal", priority: "medium", due_offset: 5 },
      { title: "Submit permit application", priority: "medium", due_offset: 7 },
    ];

    const reminders = defaultTasks.map((t, i) => ({
      business_id: businessId,
      entity_type: "lead" as const,
      entity_id: project.id,
      assigned_to_user_id: input.assigned_manager_user_id || profile.user_id,
      title: `[${input.project_name}] ${t.title}`,
      due_at: new Date(Date.now() + t.due_offset * 24 * 60 * 60 * 1000).toISOString(),
      created_by_user_id: profile.user_id,
      priority: t.priority as any,
    }));
    await supabase.from("reminders").insert(reminders as any);

    toast.success("Solar project created with auto-tasks");
    fetchProjects();
    return project as SolarProject;
  };

  const updateStage = async (id: string, stage: PipelineStage) => {
    await supabase.from("projects").update({ pipeline_stage: stage } as any).eq("id", id);
    // Map stage to status
    const stageToStatus: Record<string, string> = {
      new_project: "new",
      handover_completed: "completed",
    };
    if (stageToStatus[stage]) {
      await supabase.from("projects").update({ status: stageToStatus[stage] } as any).eq("id", id);
    } else {
      await supabase.from("projects").update({ status: "in_progress" } as any).eq("id", id);
    }
    fetchProjects();
  };

  const updateProject = async (id: string, values: Partial<SolarProject>) => {
    await supabase.from("projects").update(values as any).eq("id", id);
    fetchProjects();
  };

  const projectsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = projects.filter(p => (p.pipeline_stage || "new_project") === stage.key);
    return acc;
  }, {} as Record<PipelineStage, SolarProject[]>);

  return { projects, projectsByStage, loading, createProject, updateStage, updateProject, refetch: fetchProjects };
}
