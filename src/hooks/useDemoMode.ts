import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DemoConfig {
  id: string;
  business_id: string;
  demo_enabled: boolean;
  demo_profile_type: string;
  demo_phone: string | null;
  demo_whatsapp: string | null;
  demo_email: string | null;
  expiry_at: string | null;
  reset_allowed: boolean;
  created_at: string;
}

export interface DemoSimulation {
  id: string;
  business_id: string;
  simulated_name: string;
  simulated_phone: string | null;
  simulated_email: string | null;
  simulated_service: string | null;
  inquiry_id: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface InquiryAnalyticsDaily {
  id: string;
  business_id: string;
  date: string;
  total_inquiries: number;
  demo_inquiries: number;
  responded_count: number;
  converted_count: number;
  average_response_time_minutes: number;
}

export interface DemoJob {
  id: string;
  business_id: string;
  simulated_customer: string;
  job_title: string;
  status: string;
  is_demo: boolean;
  created_at: string;
}

export function useDemoMode(targetBusinessId?: string) {
  const { profile } = useAuth();
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [simulations, setSimulations] = useState<DemoSimulation[]>([]);
  const [analytics, setAnalytics] = useState<InquiryAnalyticsDaily[]>([]);
  const [demoJobs, setDemoJobs] = useState<DemoJob[]>([]);
  const [loading, setLoading] = useState(true);

  const bizId = targetBusinessId || profile?.business_id;

  const fetchAll = useCallback(async () => {
    if (!bizId) return;
    setLoading(true);

    const [cfgRes, simRes, analyticsRes, jobsRes] = await Promise.all([
      supabase.from("demo_configurations").select("*").eq("business_id", bizId).maybeSingle(),
      supabase.from("demo_inquiry_simulations").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(100),
      supabase.from("inquiry_analytics_daily").select("*").eq("business_id", bizId).order("date", { ascending: true }).limit(90),
      supabase.from("demo_jobs").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(50),
    ]);

    setConfig((cfgRes.data as any) ?? null);
    setSimulations((simRes.data as any[]) ?? []);
    setAnalytics((analyticsRes.data as any[]) ?? []);
    setDemoJobs((jobsRes.data as any[]) ?? []);
    setLoading(false);
  }, [bizId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertConfig = async (values: Partial<DemoConfig>) => {
    if (!bizId) return;
    if (config) {
      await supabase.from("demo_configurations").update(values as any).eq("id", config.id);
    } else {
      await supabase.from("demo_configurations").insert({ ...values, business_id: bizId } as any);
    }
    toast.success("Demo configuration saved");
    fetchAll();
  };

  const toggleDemo = async (enabled: boolean) => {
    await upsertConfig({ demo_enabled: enabled });
  };

  const runDemoInquiry = async (name: string, email: string, phone: string, service: string) => {
    if (!bizId) return;
    // Create demo simulation record
    await supabase.from("demo_inquiry_simulations").insert({
      business_id: bizId,
      simulated_name: name,
      simulated_email: email,
      simulated_phone: phone,
      simulated_service: service,
    } as any);

    // Upsert today's analytics
    const today = new Date().toISOString().slice(0, 10);
    const existing = analytics.find(a => a.date === today);
    if (existing) {
      await supabase.from("inquiry_analytics_daily").update({
        total_inquiries: existing.total_inquiries + 1,
        demo_inquiries: existing.demo_inquiries + 1,
      } as any).eq("id", existing.id);
    } else {
      await supabase.from("inquiry_analytics_daily").insert({
        business_id: bizId,
        date: today,
        total_inquiries: 1,
        demo_inquiries: 1,
      } as any);
    }

    toast.success("Demo inquiry simulated");
    fetchAll();
  };

  const createDemoJob = async (customer: string, title: string) => {
    if (!bizId) return;
    await supabase.from("demo_jobs").insert({
      business_id: bizId,
      simulated_customer: customer,
      job_title: title,
    } as any);
    toast.success("Demo job created");
    fetchAll();
  };

  const updateDemoJobStatus = async (jobId: string, status: string) => {
    await supabase.from("demo_jobs").update({ status } as any).eq("id", jobId);
    toast.success(`Job status → ${status}`);
    fetchAll();
  };

  const resetDemoData = async () => {
    if (!bizId) return;
    await Promise.all([
      supabase.from("demo_inquiry_simulations").delete().eq("business_id", bizId),
      supabase.from("demo_jobs").delete().eq("business_id", bizId),
      supabase.from("inquiry_analytics_daily").delete().eq("business_id", bizId).gt("demo_inquiries", 0),
    ]);
    toast.success("Demo data reset");
    fetchAll();
  };

  return {
    config, simulations, analytics, demoJobs, loading,
    upsertConfig, toggleDemo, runDemoInquiry,
    createDemoJob, updateDemoJobStatus, resetDemoData,
    refresh: fetchAll,
  };
}
