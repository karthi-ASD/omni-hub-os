import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoCampaign {
  id: string;
  business_id: string;
  client_id: string | null;
  project_id: string | null;
  status: string;
  primary_domain: string | null;
  service_areas_json: any[];
  target_services_json: any[];
  start_date: string | null;
  created_at: string;
}

export interface SeoKeyword {
  id: string;
  campaign_id: string;
  keyword: string;
  keyword_type: string;
  target_url: string | null;
  priority: string;
  status: string;
}

export interface SeoOnpageTask {
  id: string;
  campaign_id: string;
  page_url: string | null;
  checklist_item: string;
  status: string;
  assigned_to_user_id: string | null;
  due_at: string | null;
}

export interface SeoOffpageItem {
  id: string;
  campaign_id: string;
  type: string;
  source_url: string | null;
  target_url: string | null;
  status: string;
}

export interface SeoContentItem {
  id: string;
  campaign_id: string;
  type: string;
  title: string;
  brief: string | null;
  status: string;
  target_url: string | null;
  due_at: string | null;
}

const DEFAULT_ACCESS_ITEMS = [
  "GA_ACCESS", "GSC_ACCESS", "GBP_ACCESS", "DOMAIN", "HOSTING", "FTP", "CMS_LOGIN"
];

export function useSeoCampaigns() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<SeoCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seo_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setCampaigns((data as any as SeoCampaign[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const createCampaign = async (input: {
    client_id?: string;
    project_id?: string;
    primary_domain?: string;
    service_areas?: string[];
    target_services?: string[];
  }) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase.from("seo_campaigns").insert({
      business_id: profile.business_id,
      client_id: input.client_id,
      project_id: input.project_id,
      primary_domain: input.primary_domain,
      service_areas_json: input.service_areas || [],
      target_services_json: input.target_services || [],
    } as any).select().single();

    if (error) { toast.error("Failed to create SEO campaign"); return null; }

    const campaignId = (data as any).id;

    // Create default access checklist
    await supabase.from("seo_access_checklist").insert(
      DEFAULT_ACCESS_ITEMS.map((key) => ({
        business_id: profile.business_id,
        campaign_id: campaignId,
        item_key: key,
      })) as any
    );

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "SEO_CAMPAIGN_CREATED",
      payload_json: { entity_type: "seo_campaign", entity_id: campaignId, short_message: `SEO campaign created for ${input.primary_domain || "new client"}` },
    });

    toast.success("SEO campaign created");
    fetchCampaigns();
    return data as any as SeoCampaign;
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("seo_campaigns").update({ status } as any).eq("id", id);
    toast.success("Campaign status updated");
    fetchCampaigns();
  };

  return { campaigns, loading, createCampaign, updateStatus, refetch: fetchCampaigns };
}

export function useSeoKeywords(campaignId?: string) {
  const { profile } = useAuth();
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setKeywords([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_keywords").select("*").eq("campaign_id", campaignId).order("created_at");
    setKeywords((data as any as SeoKeyword[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addKeyword = async (input: { keyword: string; keyword_type?: string; priority?: string; target_url?: string }) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_keywords").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("Keyword added");
    fetch();
  };

  const updateKeywordStatus = async (id: string, status: string) => {
    await supabase.from("seo_keywords").update({ status } as any).eq("id", id);
    fetch();
  };

  return { keywords, loading, addKeyword, updateKeywordStatus, refetch: fetch };
}

export function useSeoOnpageTasks(campaignId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<SeoOnpageTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_onpage_tasks").select("*").eq("campaign_id", campaignId).order("created_at");
    setTasks((data as any as SeoOnpageTask[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addTask = async (input: { page_url?: string; checklist_item: string }) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_onpage_tasks").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("On-page task added");
    fetch();
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await supabase.from("seo_onpage_tasks").update({ status } as any).eq("id", id);
    fetch();
  };

  return { tasks, loading, addTask, updateTaskStatus, refetch: fetch };
}

export function useSeoOffpageItems(campaignId?: string) {
  const { profile } = useAuth();
  const [items, setItems] = useState<SeoOffpageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_offpage_items").select("*").eq("campaign_id", campaignId).order("created_at");
    setItems((data as any as SeoOffpageItem[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addItem = async (input: { type: string; source_url?: string; target_url?: string }) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_offpage_items").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("Off-page item added");
    fetch();
  };

  const updateItemStatus = async (id: string, status: string) => {
    await supabase.from("seo_offpage_items").update({ status } as any).eq("id", id);
    fetch();
  };

  return { items, loading, addItem, updateItemStatus, refetch: fetch };
}

export function useSeoContent(campaignId?: string) {
  const { profile } = useAuth();
  const [content, setContent] = useState<SeoContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setContent([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_content_items").select("*").eq("campaign_id", campaignId).order("created_at");
    setContent((data as any as SeoContentItem[]) || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addContent = async (input: { type: string; title: string; brief?: string; target_url?: string }) => {
    if (!profile?.business_id || !campaignId) return;
    await supabase.from("seo_content_items").insert({
      business_id: profile.business_id,
      campaign_id: campaignId,
      ...input,
    } as any);
    toast.success("Content item added");
    fetch();
  };

  const updateContentStatus = async (id: string, status: string) => {
    await supabase.from("seo_content_items").update({ status } as any).eq("id", id);
    fetch();
  };

  return { content, loading, addContent, updateContentStatus, refetch: fetch };
}
