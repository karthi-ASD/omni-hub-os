import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const WEBSITE_STAGES = [
  { key: "requirement_gathering", label: "Requirement Gathering", color: "bg-blue-500" },
  { key: "wireframe", label: "Wireframe", color: "bg-indigo-500" },
  { key: "ui_design", label: "UI Design", color: "bg-purple-500" },
  { key: "content_insertion", label: "Content Insertion", color: "bg-pink-500" },
  { key: "development", label: "Development", color: "bg-orange-500" },
  { key: "qa_testing", label: "QA Testing", color: "bg-amber-500" },
  { key: "client_review", label: "Client Review", color: "bg-teal-500" },
  { key: "revisions", label: "Revisions", color: "bg-cyan-500" },
  { key: "launch", label: "Launch", color: "bg-green-500" },
] as const;

export interface WebsiteProjectStage {
  id: string;
  business_id: string;
  client_id: string;
  website_id: string | null;
  project_name: string;
  current_stage: string;
  stage_history: any[];
  assigned_team_lead: string | null;
  start_date: string | null;
  target_launch_date: string | null;
  actual_launch_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useWebsiteProjectStages(clientId?: string) {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<WebsiteProjectStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    let query = supabase
      .from("website_project_stages" as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    if (clientId) query = query.eq("client_id", clientId);
    const { data } = await query;
    setProjects((data as any as WebsiteProjectStage[]) || []);
    setLoading(false);
  }, [profile?.business_id, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { project_name: string; client_id: string; website_id?: string; start_date?: string; target_launch_date?: string }) => {
    if (!profile?.business_id) return;
    await supabase.from("website_project_stages" as any).insert({
      business_id: profile.business_id,
      ...values,
      stage_history: [{ stage: "requirement_gathering", entered_at: new Date().toISOString() }],
    } as any);
    toast.success("Website project created");
    fetch();
  };

  const advanceStage = async (projectId: string, newStage: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const history = [...(project.stage_history || []), { stage: newStage, entered_at: new Date().toISOString() }];
    const update: any = { current_stage: newStage, stage_history: history };
    if (newStage === "launch") update.actual_launch_date = new Date().toISOString().split("T")[0];
    await supabase.from("website_project_stages" as any).update(update).eq("id", projectId);
    toast.success(`Stage updated to ${WEBSITE_STAGES.find(s => s.key === newStage)?.label || newStage}`);
    fetch();
  };

  return { projects, loading, create, advanceStage, refetch: fetch };
}
