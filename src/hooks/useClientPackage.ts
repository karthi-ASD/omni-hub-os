import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientPackage {
  id: string;
  client_id: string;
  business_id: string;
  package_name: string;
  start_date: string;
  contract_type: string;
  payment_type: string;
  total_value: number;
  account_manager_id: string | null;
  seo_manager_id: string | null;
  competitor_visibility: boolean;
  ranking_mode: string;
  status: string;
  created_at: string;
}

export interface PackageService {
  id: string;
  package_id: string;
  service_name: string;
  is_active: boolean;
  price: number;
  billing_cycle: string;
}

export interface SeoPackageData {
  id: string;
  package_id: string;
  radius_km: number;
  suburbs: string[];
  keyword_count: number;
  strategy_type: string;
}

export interface PackageAsset {
  id: string;
  package_id: string;
  domain_name: string | null;
  registrar: string | null;
  domain_login_encrypted: string | null;
  domain_renewal_date: string | null;
  hosting_provider: string | null;
  hosting_login_encrypted: string | null;
  hosting_renewal_date: string | null;
}

export interface PackageInstallment {
  id: string;
  package_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date: string | null;
}

export interface ClientGmb {
  id: string;
  package_id: string;
  gmb_link: string | null;
  access_status: string;
  managed_by: string;
}

export interface PackageEvent {
  id: string;
  package_id: string;
  event_name: string;
  event_date: string | null;
  total_cost: number;
  payment_type: string;
  status: string;
}

export const SERVICE_ENUM = [
  "SEO", "Website Development", "Social Media Marketing", "Google Ads",
  "Meta Ads", "Content Marketing", "Local SEO", "Technical SEO",
  "Hosting", "Maintenance",
] as const;

export function useClientPackage(clientId: string | undefined) {
  const { profile } = useAuth();
  const [pkg, setPkg] = useState<ClientPackage | null>(null);
  const [services, setServices] = useState<PackageService[]>([]);
  const [seoData, setSeoData] = useState<SeoPackageData | null>(null);
  const [assets, setAssets] = useState<PackageAsset | null>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [gmb, setGmb] = useState<ClientGmb | null>(null);
  const [installments, setInstallments] = useState<PackageInstallment[]>([]);
  const [events, setEvents] = useState<PackageEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const { data: pkgData } = await supabase
      .from("client_packages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as any;

    setPkg(pkgData);

    if (pkgData?.id) {
      const pid = pkgData.id;
      const [svcR, seoR, assetR, slR, gmbR, instR, evtR] = await Promise.all([
        supabase.from("package_services").select("*").eq("package_id", pid) as any,
        supabase.from("seo_package_data").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_package_assets").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_social_links").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_gmb").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("package_installments").select("*").eq("package_id", pid).order("installment_number") as any,
        supabase.from("package_events").select("*").eq("package_id", pid).order("event_date") as any,
      ]);
      setServices(svcR.data || []);
      setSeoData(seoR.data);
      setAssets(assetR.data);
      setSocialLinks(slR.data);
      setGmb(gmbR.data);
      setInstallments(instR.data || []);
      setEvents(evtR.data || []);
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createPackage = async (data: Partial<ClientPackage>) => {
    if (!clientId || !profile?.business_id) return null;
    const { data: created, error } = await supabase.from("client_packages").insert({
      client_id: clientId,
      business_id: profile.business_id,
      package_name: data.package_name || "Standard Package",
      start_date: data.start_date || new Date().toISOString().split("T")[0],
      contract_type: data.contract_type || "month_on_month",
      payment_type: data.payment_type || "monthly",
      total_value: data.total_value || 0,
      account_manager_id: data.account_manager_id,
      seo_manager_id: data.seo_manager_id,
      competitor_visibility: data.competitor_visibility ?? true,
      ranking_mode: data.ranking_mode || "auto",
    } as any).select().single();
    if (error) { toast.error("Failed to create package"); return null; }
    toast.success("Package created");
    fetchAll();
    return created;
  };

  const updatePackage = async (id: string, data: Partial<ClientPackage>) => {
    const { error } = await supabase.from("client_packages").update(data as any).eq("id", id);
    if (error) { toast.error("Failed to update package"); return; }
    toast.success("Package updated");
    fetchAll();
  };

  const upsertService = async (packageId: string, serviceName: string, isActive: boolean, price: number) => {
    const existing = services.find(s => s.service_name === serviceName);
    if (existing) {
      await supabase.from("package_services").update({ is_active: isActive, price } as any).eq("id", existing.id);
    } else {
      await supabase.from("package_services").insert({ package_id: packageId, service_name: serviceName, is_active: isActive, price } as any);
    }
    fetchAll();
  };

  const upsertSeoData = async (packageId: string, data: Partial<SeoPackageData>) => {
    if (seoData?.id) {
      await supabase.from("seo_package_data").update(data as any).eq("id", seoData.id);
    } else {
      await supabase.from("seo_package_data").insert({ package_id: packageId, ...data } as any);
    }
    fetchAll();
  };

  const upsertAssets = async (packageId: string, data: Partial<PackageAsset>) => {
    if (assets?.id) {
      await supabase.from("client_package_assets").update(data as any).eq("id", assets.id);
    } else {
      await supabase.from("client_package_assets").insert({ package_id: packageId, ...data } as any);
    }
    fetchAll();
  };

  const upsertSocialLinks = async (packageId: string, data: any) => {
    if (socialLinks?.id) {
      await supabase.from("client_social_links").update(data).eq("id", socialLinks.id);
    } else {
      await supabase.from("client_social_links").insert({ package_id: packageId, ...data } as any);
    }
    fetchAll();
  };

  const upsertGmb = async (packageId: string, data: Partial<ClientGmb>) => {
    if (gmb?.id) {
      await supabase.from("client_gmb").update(data as any).eq("id", gmb.id);
    } else {
      await supabase.from("client_gmb").insert({ package_id: packageId, ...data } as any);
    }
    fetchAll();
  };

  const generateInstallments = async (packageId: string, totalValue: number, count: number, startDate: string) => {
    const amount = Math.round((totalValue / count) * 100) / 100;
    const start = new Date(startDate);
    const rows = Array.from({ length: count }, (_, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      return {
        package_id: packageId,
        installment_number: i + 1,
        due_date: due.toISOString().split("T")[0],
        amount,
        status: "pending",
      };
    });
    // Clear existing
    await supabase.from("package_installments").delete().eq("package_id", packageId);
    await supabase.from("package_installments").insert(rows as any);
    toast.success(`${count} installments generated`);
    fetchAll();
  };

  const markInstallmentPaid = async (id: string) => {
    await supabase.from("package_installments").update({
      status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
    } as any).eq("id", id);
    toast.success("Installment marked as paid");
    fetchAll();
  };

  const markInstallmentSkipped = async (id: string) => {
    await supabase.from("package_installments").update({ status: "skipped" } as any).eq("id", id);
    toast.success("Installment marked as skipped");
    fetchAll();
  };

  // Computed payment summary
  const totalPaid = installments.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalOutstanding = installments.filter(i => ["pending", "overdue", "skipped"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
  const overdueAmount = installments.filter(i => i.status === "overdue" || (i.status === "pending" && new Date(i.due_date) < new Date())).reduce((s, i) => s + Number(i.amount), 0);
  const nextDueDate = installments.filter(i => i.status === "pending").sort((a, b) => a.due_date.localeCompare(b.due_date))[0]?.due_date || null;

  return {
    pkg, services, seoData, assets, socialLinks, gmb, installments, events,
    loading, fetchAll,
    createPackage, updatePackage, upsertService, upsertSeoData,
    upsertAssets, upsertSocialLinks, upsertGmb,
    generateInstallments, markInstallmentPaid, markInstallmentSkipped,
    totalPaid, totalOutstanding, overdueAmount, nextDueDate,
  };
}
