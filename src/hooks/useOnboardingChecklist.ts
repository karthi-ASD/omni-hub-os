import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface OnboardingItem {
  id: string;
  business_id: string;
  client_id: string;
  deal_id: string | null;
  item_title: string;
  item_category: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export function useOnboardingChecklist(clientId: string | undefined) {
  const { profile } = useAuth();
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("onboarding_checklist_items" as any)
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true });
    setItems((data as any as OnboardingItem[]) || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleItem = async (itemId: string, completed: boolean) => {
    await supabase.from("onboarding_checklist_items" as any).update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? profile?.user_id : null,
    } as any).eq("id", itemId);
    fetch();
  };

  const addItem = async (title: string, category: string = "general") => {
    if (!profile?.business_id || !clientId) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
    await supabase.from("onboarding_checklist_items" as any).insert({
      business_id: profile.business_id,
      client_id: clientId,
      item_title: title,
      item_category: category,
      sort_order: maxOrder,
    } as any);
    toast.success("Checklist item added");
    fetch();
  };

  const updateNotes = async (itemId: string, notes: string) => {
    await supabase.from("onboarding_checklist_items" as any).update({ notes } as any).eq("id", itemId);
    fetch();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("onboarding_checklist_items" as any).delete().eq("id", itemId);
    fetch();
  };

  const completedCount = items.filter(i => i.is_completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return { items, loading, toggleItem, addItem, updateNotes, removeItem, progress, completedCount, refetch: fetch };
}
