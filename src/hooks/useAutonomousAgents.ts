import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAutonomousAgents() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [audits, setAudits] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const [a, k, b, d, p, s, c, l] = await Promise.all([
      supabase.from("ai_seo_audits").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_keyword_clusters").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_content_briefs").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_blog_drafts").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_outreach_prospects").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_social_posts").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_competitor_analysis").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_execution_logs").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(200),
    ]);
    setAudits(a.data ?? []);
    setClusters(k.data ?? []);
    setBriefs(b.data ?? []);
    setDrafts(d.data ?? []);
    setProspects(p.data ?? []);
    setSocialPosts(s.data ?? []);
    setCompetitors(c.data ?? []);
    setLogs(l.data ?? []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const invoke = useCallback(async (taskType: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("ai-engine", {
      body: { task_type: taskType, payload: { business_id: bid, ...payload } },
    });
    if (error) throw error;
    return data?.result;
  }, [bid]);

  const logExecution = useCallback(async (module: string, action: string, summary: string, clientId?: string) => {
    if (!bid) return;
    await supabase.from("ai_execution_logs").insert({ business_id: bid, module, action, output_summary: summary, client_id: clientId } as any);
  }, [bid]);

  // SEO Audit
  const runSeoAudit = useCallback(async (clientData: { client_id?: string; domain: string; project_id?: string }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_seo_audit", clientData);
      if (result) {
        await supabase.from("ai_seo_audits").insert({
          business_id: bid,
          client_id: clientData.client_id,
          project_id: clientData.project_id,
          issues_json: result.issues || [],
          health_score: result.health_score || 0,
          total_issues: result.issues?.length || 0,
          critical_issues: (result.issues || []).filter((i: any) => i.severity === "critical").length,
        } as any);
        await logExecution("SEO Audit", "scan_complete", `Found ${result.issues?.length || 0} issues for ${clientData.domain}`, clientData.client_id);
        toast.success(`SEO audit completed — ${result.issues?.length || 0} issues found`);
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Audit failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Keyword Clusters
  const generateKeywordClusters = useCallback(async (clientData: { client_id?: string; business_niche: string; location?: string; services?: string[] }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_keyword_cluster", clientData);
      if (result?.clusters) {
        for (const c of result.clusters) {
          await supabase.from("ai_keyword_clusters").insert({
            business_id: bid, client_id: clientData.client_id,
            cluster_name: c.cluster_name, cluster_type: c.cluster_type || "service",
            primary_keyword: c.primary_keyword, keywords_json: c.keywords || [],
            search_intent: c.search_intent || "transactional",
            suggested_page_type: c.suggested_page_type, priority: c.priority || "medium",
          } as any);
        }
        await logExecution("Keyword Clusters", "generate", `Generated ${result.clusters.length} clusters`, clientData.client_id);
        toast.success(`${result.clusters.length} keyword clusters generated`);
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Content Brief
  const generateContentBrief = useCallback(async (data: { client_id?: string; brief_type: string; target_keyword: string; business_context?: string }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_content_brief", data);
      if (result) {
        await supabase.from("ai_content_briefs").insert({
          business_id: bid, client_id: data.client_id,
          brief_type: data.brief_type, target_keyword: data.target_keyword,
          secondary_keywords: result.secondary_keywords || [],
          search_intent: result.search_intent, recommended_title: result.recommended_title,
          headings_json: result.headings || [], structure_json: result.structure || {},
          word_count_recommendation: result.word_count || 1200,
          schema_recommendation: result.schema_recommendation,
        } as any);
        await logExecution("Content Brief", "generate", `Brief for "${data.target_keyword}"`, data.client_id);
        toast.success("Content brief generated");
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Blog Draft
  const generateBlogDraft = useCallback(async (data: { client_id?: string; brief_id?: string; target_keyword: string; tone?: string; word_count?: number }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_blog_draft", data);
      if (result) {
        await supabase.from("ai_blog_drafts").insert({
          business_id: bid, client_id: data.client_id, brief_id: data.brief_id,
          title: result.title || data.target_keyword, meta_title: result.meta_title,
          meta_description: result.meta_description, content: result.content,
          target_keyword: data.target_keyword, word_count: result.word_count || 0,
          tone: data.tone || "professional",
        } as any);
        await logExecution("Blog Draft", "generate", `Draft: "${result.title}"`, data.client_id);
        toast.success("Blog draft generated");
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Outreach
  const findOutreachProspects = useCallback(async (data: { client_id?: string; niche: string; target_url?: string }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_outreach", data);
      if (result?.prospects) {
        for (const p of result.prospects) {
          await supabase.from("ai_outreach_prospects").insert({
            business_id: bid, client_id: data.client_id,
            prospect_domain: p.domain, domain_quality_score: p.quality_score || 0,
            relevance_score: p.relevance_score || 0, contact_email: p.contact_email,
            outreach_category: p.category || "guest_post",
            suggested_anchor: p.anchor_text, suggested_target_url: p.target_url,
          } as any);
        }
        await logExecution("Outreach", "prospect_find", `Found ${result.prospects.length} prospects`, data.client_id);
        toast.success(`${result.prospects.length} outreach prospects found`);
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Social Posts
  const generateSocialPosts = useCallback(async (data: { client_id?: string; platform: string; content_type: string; topic: string; brand_tone?: string }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_social_post", data);
      if (result?.posts) {
        for (const p of result.posts) {
          await supabase.from("ai_social_posts").insert({
            business_id: bid, client_id: data.client_id,
            platform: p.platform || data.platform, content_type: data.content_type,
            caption: p.caption, hashtags: p.hashtags || [],
            image_brief: p.image_brief, cta: p.cta,
          } as any);
        }
        await logExecution("Social Media", "generate", `Generated ${result.posts.length} posts`, data.client_id);
        toast.success(`${result.posts.length} social posts generated`);
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Competitor Analysis
  const analyzeCompetitor = useCallback(async (data: { client_id?: string; competitor_domain: string; client_domain?: string }) => {
    if (!bid) return;
    try {
      const result = await invoke("autonomous_competitor_analysis", data);
      if (result) {
        await supabase.from("ai_competitor_analysis").insert({
          business_id: bid, client_id: data.client_id,
          competitor_domain: data.competitor_domain,
          analysis_json: result.overview || {},
          keyword_gaps_json: result.keyword_gaps || [],
          content_gaps_json: result.content_gaps || [],
          opportunities_json: result.opportunities || [],
        } as any);
        await logExecution("Competitor Intel", "analyze", `Analyzed ${data.competitor_domain}`, data.client_id);
        toast.success("Competitor analysis completed");
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, logExecution, fetchAll]);

  // Approve / update statuses
  const approveDraft = useCallback(async (id: string, table: string) => {
    if (!profile?.user_id) return;
    await supabase.from(table as any).update({ status: "approved", approved_by: profile.user_id, approved_at: new Date().toISOString() } as any).eq("id", id);
    toast.success("Approved");
    fetchAll();
  }, [profile?.user_id, fetchAll]);

  const updateStatus = useCallback(async (id: string, table: string, status: string) => {
    await supabase.from(table as any).update({ status } as any).eq("id", id);
    fetchAll();
  }, [fetchAll]);

  return {
    audits, clusters, briefs, drafts, prospects, socialPosts, competitors, logs, loading,
    runSeoAudit, generateKeywordClusters, generateContentBrief, generateBlogDraft,
    findOutreachProspects, generateSocialPosts, analyzeCompetitor,
    approveDraft, updateStatus, fetchAll,
  };
}
