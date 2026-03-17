import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SeoKeywordRow {
  id: string;
  keyword: string;
  current_ranking: number | null;
  previous_ranking: number | null;
  search_volume: number | null;
}

export interface SeoCompetitorRow {
  id: string;
  competitor_name: string | null;
  competitor_domain: string;
  ranking_position: number | null;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
  stage: string;
}

export interface WorkLogRow {
  id: string;
  task_title: string;
  task_category: string;
  status: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  service_type: string;
  service_name: string | null;
  service_status: string;
  price_amount: number | null;
  billing_cycle: string | null;
  next_billing_date: string | null;
}

export interface ClientDashboardData {
  // Stats
  totalLeads: number;
  leadsThisMonth: number;
  totalCalls: number;
  callsThisMonth: number;
  openDeals: number;
  totalCustomers: number;
  openTickets: number;
  openInvoices: number;
  outstandingAmount: number;
  totalPaid: number;
  // SEO
  seoKeywords: SeoKeywordRow[];
  seoCompetitors: SeoCompetitorRow[];
  seoProject: { id: string; project_name: string; service_package: string | null; contract_start: string | null; project_status: string } | null;
  // Recent leads
  recentLeads: LeadRow[];
  // Work log
  workLog: WorkLogRow[];
  // Services
  services: ServiceRow[];
  // Website
  websites: { website_url: string; website_status: string }[];
}

export function useClientDashboardData() {
  const { profile, clientId } = useAuth();
  const [data, setData] = useState<ClientDashboardData>({
    totalLeads: 0, leadsThisMonth: 0, totalCalls: 0, callsThisMonth: 0,
    openDeals: 0, totalCustomers: 0, openTickets: 0, openInvoices: 0,
    outstandingAmount: 0, totalPaid: 0,
    seoKeywords: [], seoCompetitors: [], seoProject: null,
    recentLeads: [], workLog: [], services: [], websites: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    const bid = profile.business_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const result: ClientDashboardData = {
      totalLeads: 0, leadsThisMonth: 0, totalCalls: 0, callsThisMonth: 0,
      openDeals: 0, totalCustomers: 0, openTickets: 0, openInvoices: 0,
      outstandingAmount: 0, totalPaid: 0,
      seoKeywords: [], seoCompetitors: [], seoProject: null,
      recentLeads: [], workLog: [], services: [], websites: [],
    };

    // ── CRM stats: scoped to client's own business_id ──
    const [
      leadsAll, leadsMonth, callsAll, callsMonth, deals, customers,
      tickets, recentLeads
    ] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("is_deleted", false),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("is_deleted", false).gte("created_at", monthStart),
      supabase.from("call_logs").select("id", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("call_logs").select("id", { count: "exact", head: true }).eq("business_id", bid).gte("call_time", monthStart),
      supabase.from("deals").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("status", "open"),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("business_id", bid),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("business_id", bid).in("status", ["open", "in_progress"]),
      supabase.from("leads").select("id, name, email, phone, source, created_at, stage").eq("business_id", bid).eq("is_deleted", false).order("created_at", { ascending: false }).limit(5),
    ]);

    result.totalLeads = leadsAll.count ?? 0;
    result.leadsThisMonth = leadsMonth.count ?? 0;
    result.totalCalls = callsAll.count ?? 0;
    result.callsThisMonth = callsMonth.count ?? 0;
    result.openDeals = deals.count ?? 0;
    result.totalCustomers = customers.count ?? 0;
    result.openTickets = tickets.count ?? 0;
    result.recentLeads = (recentLeads.data as any) ?? [];

    // ── Invoices: fetch from xero_invoices by client_id (NextWeb's invoices FOR this client) ──
    if (clientId) {
      const [invoicesOpen, invoicesPaid] = await Promise.all([
        supabase.from("xero_invoices").select("id, total_amount, amount_due, status").eq("client_id", clientId).in("status", ["AUTHORISED", "SUBMITTED", "OVERDUE"]),
        supabase.from("xero_invoices").select("id, total_amount").eq("client_id", clientId).eq("status", "PAID"),
      ]);

      result.openInvoices = invoicesOpen.data?.length ?? 0;
      result.outstandingAmount = invoicesOpen.data?.reduce((s, i) => s + Number((i as any).amount_due || (i as any).total_amount || 0), 0) ?? 0;
      result.totalPaid = invoicesPaid.data?.reduce((s, i) => s + Number((i as any).total_amount || 0), 0) ?? 0;
    }

    // ── SEO + Services: fetch via client_id, then keywords via seo_project_id ──
    if (clientId) {
      // First get the SEO project
      const seoProj = await supabase
        .from("seo_projects")
        .select("id, project_name, service_package, contract_start, project_status")
        .eq("client_id", clientId)
        .eq("project_status", "active")
        .limit(1)
        .maybeSingle();

      result.seoProject = seoProj.data as any;

      // Now fetch keywords by seo_project_id (NOT client_id — seo_keywords doesn't have client_id)
      const projectId = seoProj.data?.id;

      const [keywords, competitors, workLog, services, websites] = await Promise.all([
        projectId
          ? supabase.from("seo_keywords").select("id, keyword, current_ranking, previous_ranking, search_volume").eq("seo_project_id", projectId).order("current_ranking", { ascending: true, nullsFirst: false }).limit(20)
          : Promise.resolve({ data: [] }),
        supabase.from("seo_competitors").select("id, competitor_name, competitor_domain, ranking_position").eq("client_id", clientId).limit(10),
        supabase.from("seo_tasks").select("id, task_title, task_category, status, updated_at").eq("client_id", clientId).eq("is_visible_to_client", true).order("updated_at", { ascending: false }).limit(10),
        supabase.from("client_services").select("id, service_type, service_name, service_status, price_amount, billing_cycle, next_billing_date").eq("client_id", clientId).eq("service_status", "active"),
        supabase.from("client_websites").select("website_url, website_status").eq("client_id", clientId),
      ]);

      result.seoKeywords = (keywords.data as any) ?? [];
      result.seoCompetitors = (competitors.data as any) ?? [];
      result.workLog = (workLog.data as any) ?? [];
      result.services = (services.data as any) ?? [];
      result.websites = (websites.data as any) ?? [];
    }

    // Debug logging for data visibility issues
    if (clientId) {
      console.debug("[ClientDashboard] clientId:", clientId, "business_id:", bid);
      console.debug("[ClientDashboard] invoices:", result.openInvoices, "paid:", result.totalPaid, "outstanding:", result.outstandingAmount);
      console.debug("[ClientDashboard] seoKeywords:", result.seoKeywords.length, "seoProject:", result.seoProject?.id ?? "none");
      console.debug("[ClientDashboard] tickets:", result.openTickets, "leads:", result.totalLeads, "services:", result.services.length);
    }

    setData(result);
    setLoading(false);
  }, [profile?.business_id, clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
