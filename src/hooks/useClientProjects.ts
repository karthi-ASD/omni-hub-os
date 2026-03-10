import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SERVICE_DEPARTMENT_MAP: Record<string, string> = {
  seo: "SEO",
  google_ads: "Google Ads",
  website_development: "Web Development",
  website_maintenance: "Web Development",
  social_media: "Content Writing",
  branding: "Design",
  video_marketing: "Design",
  content_marketing: "Content Writing",
};

export function useClientProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const [pRes, dRes] = await Promise.all([
      supabase
        .from("client_projects" as any)
        .select("*, departments(name)")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("departments")
        .select("id, name")
        .eq("business_id", profile.business_id)
        .eq("is_active", true),
    ]);
    setProjects((pRes.data as any[]) ?? []);
    setDepartments((dRes.data as any[]) ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    // Auto-resolve department from service type
    let deptId = values.assigned_department_id;
    if (!deptId && values.service_type) {
      const deptName = SERVICE_DEPARTMENT_MAP[values.service_type];
      if (deptName) {
        const found = departments.find(d => d.name?.toLowerCase() === deptName.toLowerCase());
        if (found) deptId = found.id;
      }
    }
    await supabase.from("client_projects" as any).insert([{
      ...values,
      business_id: profile.business_id,
      assigned_department_id: deptId || null,
    } as any]);
    fetch();
  };

  const update = async (id: string, values: Record<string, any>) => {
    await supabase.from("client_projects").update(values as any).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("client_projects").delete().eq("id", id);
    fetch();
  };

  return { projects, departments, loading, create, update, remove, refresh: fetch };
}
