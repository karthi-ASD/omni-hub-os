import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GeoEntity {
  id: string;
  business_id: string;
  entity_type: string;
  name: string;
  attributes_json: any;
  created_at: string;
}

export interface SchemaItem {
  id: string;
  business_id: string;
  schema_type: string;
  json_ld: any;
  status: string;
  created_at: string;
}

export interface GeoAnswerBlock {
  id: string;
  business_id: string;
  query_intent: string;
  answer_text: string;
  citations: string | null;
  status: string;
  created_at: string;
}

export function useGeoEngine() {
  const { profile } = useAuth();
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [schemaItems, setSchemaItems] = useState<SchemaItem[]>([]);
  const [answerBlocks, setAnswerBlocks] = useState<GeoAnswerBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const [e, s, a] = await Promise.all([
      supabase.from("geo_entities").select("*").order("created_at", { ascending: false }),
      supabase.from("schema_items").select("*").order("created_at", { ascending: false }),
      supabase.from("geo_answer_blocks").select("*").order("created_at", { ascending: false }),
    ]);
    setEntities((e.data as any) || []);
    setSchemaItems((s.data as any) || []);
    setAnswerBlocks((a.data as any) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addEntity = async (entity_type: string, name: string, attributes: any = {}) => {
    if (!profile?.business_id) return;
    await supabase.from("geo_entities").insert({
      business_id: profile.business_id, entity_type, name, attributes_json: attributes,
    } as any);
    fetchAll();
  };

  const addSchemaItem = async (schema_type: string, json_ld: any) => {
    if (!profile?.business_id) return;
    await supabase.from("schema_items").insert({
      business_id: profile.business_id, schema_type, json_ld, status: "DRAFT",
    } as any);
    fetchAll();
  };

  const addAnswerBlock = async (query_intent: string, answer_text: string) => {
    if (!profile?.business_id) return;
    await supabase.from("geo_answer_blocks").insert({
      business_id: profile.business_id, query_intent, answer_text, status: "DRAFT",
    } as any);
    fetchAll();
  };

  const geoScore = {
    entityCount: entities.length,
    schemaCount: schemaItems.filter(s => s.status === "PUBLISHED").length,
    answerBlockCount: answerBlocks.length,
    readiness: Math.min(100, Math.round(
      (entities.length > 0 ? 25 : 0) +
      (schemaItems.filter(s => s.status === "PUBLISHED").length > 0 ? 25 : 0) +
      (answerBlocks.length >= 3 ? 25 : answerBlocks.length * 8) +
      (entities.length >= 5 ? 25 : entities.length * 5)
    )),
  };

  return { entities, schemaItems, answerBlocks, loading, geoScore, addEntity, addSchemaItem, addAnswerBlock, refetch: fetchAll };
}
