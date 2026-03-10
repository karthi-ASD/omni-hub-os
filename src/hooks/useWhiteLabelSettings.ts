import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WhiteLabelSettings {
  id: string;
  business_id: string;
  custom_logo_url: string | null;
  custom_favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_display_name: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  hide_platform_branding: boolean;
  login_page_html: string | null;
  email_footer_html: string | null;
}

export function useWhiteLabelSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("business_id", profile.business_id)
      .single();
    setSettings(data as any);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (input: Partial<WhiteLabelSettings>) => {
    if (!profile?.business_id) return;
    const payload = { ...input, business_id: profile.business_id, updated_at: new Date().toISOString() };

    if (settings?.id) {
      const { error } = await supabase.from("white_label_settings").update(payload as any).eq("id", settings.id);
      if (error) { toast.error("Failed to save branding"); return; }
    } else {
      const { error } = await supabase.from("white_label_settings").insert(payload as any);
      if (error) { toast.error("Failed to save branding"); return; }
    }
    toast.success("Branding saved");
    fetch();
  };

  return { settings, loading, upsert, refetch: fetch };
}
