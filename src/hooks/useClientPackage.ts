import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientPackage {
  id: string;
  client_id: string;
  business_id: string;
  package_name: string;
  start_date: string;
  end_date: string | null;
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
  is_missed: boolean;
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

export interface PaymentLog {
  id: string;
  installment_id: string;
  package_id: string;
  business_id: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
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
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

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

      // Auto-sync overdue installments server-side
      await supabase.rpc("sync_overdue_installments", { _package_id: pid } as any);

      const [svcR, seoR, assetR, slR, gmbR, instR, evtR, logR] = await Promise.all([
        supabase.from("package_services").select("*").eq("package_id", pid) as any,
        supabase.from("seo_package_data").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_package_assets").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_social_links").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("client_gmb").select("*").eq("package_id", pid).maybeSingle() as any,
        supabase.from("package_installments").select("*").eq("package_id", pid).order("installment_number") as any,
        supabase.from("package_events").select("*").eq("package_id", pid).order("event_date") as any,
        supabase.from("package_payment_logs").select("*").eq("package_id", pid).order("created_at", { ascending: false }) as any,
      ]);
      setServices(svcR.data || []);
      setSeoData(seoR.data);
      setAssets(assetR.data);
      setSocialLinks(slR.data);
      setGmb(gmbR.data);
      setInstallments(instR.data || []);
      setEvents(evtR.data || []);
      setPaymentLogs(logR.data || []);
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
      end_date: (data as any).end_date || null,
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
    // Local state update instead of full refetch
    setPkg(prev => prev ? { ...prev, ...data } : prev);
    toast.success("Package updated");
  };

  const upsertService = async (packageId: string, serviceName: string, isActive: boolean, price: number) => {
    // Debounce to avoid rapid-fire DB calls
    const key = `svc-${serviceName}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      const existing = services.find(s => s.service_name === serviceName);
      if (existing) {
        await supabase.from("package_services").update({ is_active: isActive, price } as any).eq("id", existing.id);
        setServices(prev => prev.map(s => s.id === existing.id ? { ...s, is_active: isActive, price } : s));
      } else {
        const { data } = await supabase.from("package_services").insert({
          package_id: packageId, service_name: serviceName, is_active: isActive, price,
        } as any).select().single();
        if (data) setServices(prev => [...prev, data as any]);
      }
    }, 300);
  };

  const upsertSeoData = async (packageId: string, data: Partial<SeoPackageData>) => {
    if (seoData?.id) {
      await supabase.from("seo_package_data").update(data as any).eq("id", seoData.id);
      setSeoData(prev => prev ? { ...prev, ...data } as SeoPackageData : prev);
    } else {
      const { data: created } = await supabase.from("seo_package_data").insert({ package_id: packageId, ...data } as any).select().single();
      if (created) setSeoData(created as any);
    }
    toast.success("SEO data saved");
  };

  const upsertAssets = async (packageId: string, data: Partial<PackageAsset>) => {
    // Encrypt sensitive fields via edge function before saving
    const toSave = { ...data };
    if (toSave.domain_login_encrypted) {
      const { encryptField } = await import("@/lib/vault-crypto");
      toSave.domain_login_encrypted = await encryptField(toSave.domain_login_encrypted);
    }
    if (toSave.hosting_login_encrypted) {
      const { encryptField } = await import("@/lib/vault-crypto");
      toSave.hosting_login_encrypted = await encryptField(toSave.hosting_login_encrypted);
    }

    if (assets?.id) {
      await supabase.from("client_package_assets").update(toSave as any).eq("id", assets.id);
      setAssets(prev => prev ? { ...prev, ...toSave } as PackageAsset : prev);
    } else {
      const { data: created } = await supabase.from("client_package_assets").insert({ package_id: packageId, ...toSave } as any).select().single();
      if (created) setAssets(created as any);
    }
    toast.success("Assets saved");
  };

  const upsertSocialLinks = async (packageId: string, data: any) => {
    if (socialLinks?.id) {
      await supabase.from("client_social_links").update(data).eq("id", socialLinks.id);
      setSocialLinks((prev: any) => ({ ...prev, ...data }));
    } else {
      const { data: created } = await supabase.from("client_social_links").insert({ package_id: packageId, ...data } as any).select().single();
      if (created) setSocialLinks(created);
    }
    toast.success("Social links saved");
  };

  const upsertGmb = async (packageId: string, data: Partial<ClientGmb>) => {
    if (gmb?.id) {
      await supabase.from("client_gmb").update(data as any).eq("id", gmb.id);
      setGmb(prev => prev ? { ...prev, ...data } as ClientGmb : prev);
    } else {
      const { data: created } = await supabase.from("client_gmb").insert({ package_id: packageId, ...data } as any).select().single();
      if (created) setGmb(created as any);
    }
    toast.success("GMB saved");
  };

  const generateInstallments = async (packageId: string, totalValue: number, count: number, startDate: string, endDate?: string) => {
    // Rounding fix: ensure sum = totalValue exactly
    const baseAmount = Math.floor((totalValue / count) * 100) / 100;
    const remainder = Math.round((totalValue - baseAmount * count) * 100) / 100;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const rows = Array.from({ length: count }, (_, i) => {
      const due = new Date(start);
      if (end && count > 1) {
        // Distribute evenly between start and end
        const totalMs = end.getTime() - start.getTime();
        const stepMs = totalMs / (count - 1);
        due.setTime(start.getTime() + stepMs * i);
      } else {
        due.setMonth(due.getMonth() + i);
      }
      const isLast = i === count - 1;
      return {
        package_id: packageId,
        installment_number: i + 1,
        due_date: due.toISOString().split("T")[0],
        amount: isLast ? baseAmount + remainder : baseAmount,
        status: "pending",
        is_missed: false,
      };
    });

    // Clear existing
    await supabase.from("package_installments").delete().eq("package_id", packageId);
    await supabase.from("package_installments").insert(rows as any);
    toast.success(`${count} installments generated`);
    // Local update
    setInstallments(rows.map((r, i) => ({ ...r, id: `temp-${i}`, paid_date: null })) as any);
    // Then refetch to get real IDs
    const { data } = await supabase.from("package_installments").select("*").eq("package_id", packageId).order("installment_number") as any;
    if (data) setInstallments(data);
  };

  const markInstallmentPaid = async (id: string, paymentMethod?: string, notes?: string) => {
    const inst = installments.find(i => i.id === id);
    if (!inst || !profile?.business_id) return;

    const paidDate = new Date().toISOString().split("T")[0];
    await supabase.from("package_installments").update({
      status: "paid",
      paid_date: paidDate,
      is_missed: false,
    } as any).eq("id", id);

    // Log payment
    await supabase.from("package_payment_logs").insert({
      installment_id: id,
      package_id: inst.package_id,
      business_id: profile.business_id,
      amount: inst.amount,
      paid_date: paidDate,
      payment_method: paymentMethod || "bank_transfer",
      notes: notes || null,
    } as any);

    // Local state update
    setInstallments(prev => prev.map(i => i.id === id ? { ...i, status: "paid", paid_date: paidDate, is_missed: false } : i));
    toast.success("Installment marked as paid");
  };

  const markInstallmentSkipped = async (id: string) => {
    await supabase.from("package_installments").update({ status: "skipped" } as any).eq("id", id);
    setInstallments(prev => prev.map(i => i.id === id ? { ...i, status: "skipped" } : i));
    toast.success("Installment marked as skipped");
  };

  // Computed payment summary - next due includes pending, overdue, skipped (excludes only paid)
  const totalPaid = installments.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalOutstanding = installments.filter(i => ["pending", "overdue", "skipped"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);
  const overdueAmount = installments.filter(i => i.status === "overdue" || (i.status === "pending" && new Date(i.due_date) < new Date())).reduce((s, i) => s + Number(i.amount), 0);
  // Next due: earliest unpaid (pending, overdue, or skipped)
  const nextDueDate = installments
    .filter(i => ["pending", "overdue", "skipped"].includes(i.status))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]?.due_date || null;

  return {
    pkg, services, seoData, assets, socialLinks, gmb, installments, events, paymentLogs,
    loading, fetchAll,
    createPackage, updatePackage, upsertService, upsertSeoData,
    upsertAssets, upsertSocialLinks, upsertGmb,
    generateInstallments, markInstallmentPaid, markInstallmentSkipped,
    totalPaid, totalOutstanding, overdueAmount, nextDueDate,
  };
}
