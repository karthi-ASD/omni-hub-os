import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Keyword Management (now linked to seo_projects) ──

export interface SeoKeyword {
  id: string;
  business_id: string;
  seo_project_id: string | null;
  campaign_id: string;
  keyword: string;
  keyword_type: string;
  target_url: string | null;
  priority: string;
  status: string;
  location: string | null;
  current_ranking: number | null;
  previous_ranking: number | null;
  search_volume: number;
  difficulty: number;
  target_rank: number | null;
}

export function useSeoKeywords(projectId?: string) {
  const { profile } = useAuth();
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setKeywords([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_keywords") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at");
    setKeywords((data as SeoKeyword[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addKeyword = async (input: {
    keyword: string;
    keyword_type?: string;
    priority?: string;
    target_url?: string;
    location?: string;
    search_volume?: number;
    difficulty?: number;
    target_rank?: number;
  }) => {
    if (!profile?.business_id || !projectId) return;
    const { error } = await (supabase.from("seo_keywords") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      keyword: input.keyword,
      keyword_type: input.keyword_type || 'primary',
      priority: input.priority || 'medium',
      target_url: input.target_url || null,
      location: input.location || null,
      search_volume: input.search_volume || 0,
      difficulty: input.difficulty || 0,
      target_rank: input.target_rank || null,
    });
    if (error) {
      console.error("Keyword insert error:", error);
      toast.error("Failed to add keyword: " + error.message);
      return;
    }
    toast.success("Keyword added");
    await fetch();
  };

  const updateKeywordStatus = async (id: string, status: string) => {
    await (supabase.from("seo_keywords") as any).update({ status }).eq("id", id);
    fetch();
  };

  return { keywords, loading, addKeyword, updateKeywordStatus, refetch: fetch };
}

// ── On-Page Tasks (now linked to seo_projects) ──

export interface SeoOnpageTask {
  id: string;
  seo_project_id: string | null;
  page_url: string | null;
  checklist_item: string;
  status: string;
  assigned_to_user_id: string | null;
  due_at: string | null;
}

export function useSeoOnpageTasks(projectId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<SeoOnpageTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_onpage_tasks") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at");
    setTasks((data as SeoOnpageTask[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addTask = async (input: { page_url?: string; checklist_item: string }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_onpage_tasks") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("On-page task added");
    fetch();
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await (supabase.from("seo_onpage_tasks") as any).update({ status }).eq("id", id);
    fetch();
  };

  return { tasks, loading, addTask, updateTaskStatus, refetch: fetch };
}

// ── Off-Page Items (now linked to seo_projects) ──

export interface SeoOffpageItem {
  id: string;
  seo_project_id: string | null;
  type: string;
  source_url: string | null;
  target_url: string | null;
  status: string;
  website_name: string | null;
  da_score: number | null;
  anchor_text: string | null;
  follow_type: string | null;
}

export function useSeoOffpageItems(projectId?: string) {
  const { profile } = useAuth();
  const [items, setItems] = useState<SeoOffpageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_offpage_items") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at");
    setItems((data as SeoOffpageItem[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addItem = async (input: {
    type: string;
    source_url?: string;
    target_url?: string;
    website_name?: string;
    da_score?: number;
    anchor_text?: string;
    follow_type?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_offpage_items") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Off-page item added");
    fetch();
  };

  const updateItemStatus = async (id: string, status: string) => {
    await (supabase.from("seo_offpage_items") as any).update({ status }).eq("id", id);
    fetch();
  };

  return { items, loading, addItem, updateItemStatus, refetch: fetch };
}

// ── Content Items (now linked to seo_projects) ──

export interface SeoContentItem {
  id: string;
  seo_project_id: string | null;
  type: string;
  title: string;
  brief: string | null;
  status: string;
  target_url: string | null;
  target_keyword: string | null;
  word_count: number | null;
  due_at: string | null;
}

export function useSeoContent(projectId?: string) {
  const { profile } = useAuth();
  const [content, setContent] = useState<SeoContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setContent([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_content_items") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at");
    setContent((data as SeoContentItem[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addContent = async (input: {
    type: string;
    title: string;
    brief?: string;
    target_url?: string;
    target_keyword?: string;
    word_count?: number;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_content_items") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Content item added");
    fetch();
  };

  const updateContentStatus = async (id: string, status: string) => {
    await (supabase.from("seo_content_items") as any).update({ status }).eq("id", id);
    fetch();
  };

  return { content, loading, addContent, updateContentStatus, refetch: fetch };
}
