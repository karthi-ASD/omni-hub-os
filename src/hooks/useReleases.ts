import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Release {
  id: string;
  version: string;
  environment: string;
  status: string;
  deployed_at: string | null;
  deployed_by: string | null;
  created_at: string;
}

export function useReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("releases").select("*").order("created_at", { ascending: false });
    setReleases((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (release: { version: string; environment: string }) => {
    const { error } = await supabase.from("releases").insert(release as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Release created");
    fetch();
    return true;
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "DEPLOYED") updates.deployed_at = new Date().toISOString();
    const { error } = await supabase.from("releases").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetch();
  };

  return { releases, loading, create, updateStatus, refetch: fetch };
}
