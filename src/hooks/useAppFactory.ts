import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AppBuild {
  id: string;
  business_id: string;
  platform: string;
  version: string;
  build_status: string;
  store_status: string;
  bundle_id: string | null;
  build_log: string | null;
  created_at: string;
}

export function useAppFactory() {
  const { profile } = useAuth();
  const [builds, setBuilds] = useState<AppBuild[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuilds = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase.from("app_builds").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false });
    setBuilds((data as any) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchBuilds(); }, [fetchBuilds]);

  const createBuild = async (platform: string, version: string, bundleId: string) => {
    if (!profile?.business_id) return false;
    const { error } = await supabase.from("app_builds").insert({
      business_id: profile.business_id, platform, version, bundle_id: bundleId,
      build_status: "pending", store_status: "not_submitted",
    } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Build queued");
    fetchBuilds();
    return true;
  };

  return { builds, loading, createBuild, refetch: fetchBuilds };
}
