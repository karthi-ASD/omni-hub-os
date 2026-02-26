import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOrgStructure() {
  const { profile } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("org_structure_nodes")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("name");
    setNodes(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { node_type: string; name: string; parent_node_id?: string | null }) => {
    if (!profile?.business_id) return;
    await supabase.from("org_structure_nodes").insert({ ...values, business_id: profile.business_id });
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("org_structure_nodes").delete().eq("id", id);
    fetch();
  };

  return { nodes, loading, create, remove, refresh: fetch };
}
