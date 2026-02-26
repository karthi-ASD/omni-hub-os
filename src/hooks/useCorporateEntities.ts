import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CorporateEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  jurisdiction: string | null;
  tax_structure_notes: string | null;
  parent_entity_id: string | null;
  created_at: string;
}

export function useCorporateEntities() {
  const [entities, setEntities] = useState<CorporateEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("corporate_entities").select("*").order("created_at", { ascending: false });
    setEntities((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (entity: { entity_name: string; entity_type: string; jurisdiction?: string; parent_entity_id?: string }) => {
    const { error } = await supabase.from("corporate_entities").insert(entity as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Entity created");
    fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("corporate_entities").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Entity removed");
    fetch();
  };

  return { entities, loading, create, remove, refetch: fetch };
}
