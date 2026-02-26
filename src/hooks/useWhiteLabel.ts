import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Brand {
  id: string;
  owner_business_id: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  domain: string | null;
  custom_css: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  features_json: any;
  max_users: number;
  max_campaigns: number;
  ai_enabled: boolean;
  white_label_enabled: boolean;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  created_at: string;
}

export function useWhiteLabel() {
  const { profile } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [bRes, pRes] = await Promise.all([
      supabase.from("brands").select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_packages").select("*").order("monthly_price", { ascending: true }),
    ]);
    setBrands((bRes.data as any) || []);
    setPackages((pRes.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addBrand = async (input: Partial<Brand>) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("brands").insert({
      owner_business_id: profile.business_id,
      brand_name: input.brand_name || "New Brand",
      primary_color: input.primary_color || "#6366f1",
      secondary_color: input.secondary_color || "#8b5cf6",
      domain: input.domain,
      logo_url: input.logo_url,
    } as any);
    if (error) { toast.error("Failed to create brand"); return; }
    toast.success("Brand created");
    fetchAll();
  };

  const addPackage = async (input: Partial<SubscriptionPackage>) => {
    const { error } = await supabase.from("subscription_packages").insert({
      name: input.name || "New Package",
      max_users: input.max_users || 5,
      max_campaigns: input.max_campaigns || 3,
      ai_enabled: input.ai_enabled || false,
      white_label_enabled: input.white_label_enabled || false,
      monthly_price: input.monthly_price || 0,
      yearly_price: input.yearly_price || 0,
      features_json: input.features_json || [],
    } as any);
    if (error) { toast.error("Failed to create package"); return; }
    toast.success("Package created");
    fetchAll();
  };

  return { brands, packages, loading, addBrand, addPackage, refetch: fetchAll };
}
