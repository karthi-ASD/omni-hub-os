/**
 * Hook for querying activity intelligence data for the calendar.
 * Applies role-based filtering via RLS + client-side context.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from "date-fns";

export interface DaySummary {
  date: string; // YYYY-MM-DD
  activities: number;
  behaviours: number;
  leads: number;
  tickets: number;
  tasks: number;
  communications: number;
}

export interface ActivityRecord {
  id: string;
  user_id: string;
  user_role: string | null;
  module: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
}

export interface BehaviourRecord {
  id: string;
  user_id: string;
  page_url: string | null;
  page_name: string | null;
  action: string | null;
  element: string | null;
  time_spent: number;
  created_at: string;
}

export function useActivityIntelligence() {
  const { profile, userType } = useAuth();
  const [monthlySummary, setMonthlySummary] = useState<DaySummary[]>([]);
  const [dayActivities, setDayActivities] = useState<ActivityRecord[]>([]);
  const [dayBehaviours, setDayBehaviours] = useState<BehaviourRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);

  const fetchMonthlySummary = useCallback(async (month: Date) => {
    if (!profile?.user_id) return;
    setLoading(true);

    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();

    const { data: activities } = await (supabase
      .from("activity_logs" as any)
      .select("created_at, module, action_type")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })
      .limit(1000) as any);

    const { data: behaviours } = await (supabase
      .from("user_behaviour_logs" as any)
      .select("created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(1000) as any);

    // Aggregate by day
    const dayMap: Record<string, DaySummary> = {};

    (activities || []).forEach((a: any) => {
      const d = format(new Date(a.created_at), "yyyy-MM-dd");
      if (!dayMap[d]) dayMap[d] = { date: d, activities: 0, behaviours: 0, leads: 0, tickets: 0, tasks: 0, communications: 0 };
      dayMap[d].activities++;
      if (a.module === "leads" || a.action_type?.includes("lead")) dayMap[d].leads++;
      if (a.module === "tickets" || a.action_type?.includes("ticket")) dayMap[d].tickets++;
      if (a.module === "tasks" || a.action_type?.includes("task")) dayMap[d].tasks++;
      if (["message", "email", "whatsapp", "call", "meeting"].some(k => a.action_type?.includes(k) || a.module?.includes(k)))
        dayMap[d].communications++;
    });

    (behaviours || []).forEach((b: any) => {
      const d = format(new Date(b.created_at), "yyyy-MM-dd");
      if (!dayMap[d]) dayMap[d] = { date: d, activities: 0, behaviours: 0, leads: 0, tickets: 0, tasks: 0, communications: 0 };
      dayMap[d].behaviours++;
    });

    setMonthlySummary(Object.values(dayMap));
    setLoading(false);
  }, [profile?.user_id]);

  const fetchDayDetails = useCallback(async (date: Date) => {
    if (!profile?.user_id) return;
    setDayLoading(true);

    const from = startOfDay(date).toISOString();
    const to = endOfDay(date).toISOString();

    const [actRes, behRes] = await Promise.all([
      (supabase
        .from("activity_logs" as any)
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(200) as any),
      (supabase
        .from("user_behaviour_logs" as any)
        .select("*")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(200) as any),
    ]);

    setDayActivities((actRes.data || []) as ActivityRecord[]);
    setDayBehaviours((behRes.data || []) as BehaviourRecord[]);
    setDayLoading(false);
  }, [profile?.user_id]);

  // Insights
  const getInsights = useCallback(() => {
    const moduleCount: Record<string, number> = {};
    const userCount: Record<string, number> = {};
    const pageCount: Record<string, number> = {};

    dayActivities.forEach((a) => {
      moduleCount[a.module] = (moduleCount[a.module] || 0) + 1;
      if (a.user_id) userCount[a.user_id] = (userCount[a.user_id] || 0) + 1;
    });

    dayBehaviours.forEach((b) => {
      if (b.page_name) pageCount[b.page_name] = (pageCount[b.page_name] || 0) + 1;
    });

    const topModules = Object.entries(moduleCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topPages = Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const mostActiveUsers = Object.entries(userCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const totalActivities = dayActivities.length;
    const leadActions = dayActivities.filter(a => a.module === "leads").length;
    const ticketActions = dayActivities.filter(a => a.module === "tickets").length;

    const aiSummary = totalActivities > 0
      ? `Today there were ${totalActivities} activities, ${leadActions} lead actions, and ${ticketActions} ticket actions.`
      : "No activity recorded for this day.";

    return { topModules, topPages, mostActiveUsers, aiSummary };
  }, [dayActivities, dayBehaviours]);

  return {
    monthlySummary,
    dayActivities,
    dayBehaviours,
    loading,
    dayLoading,
    fetchMonthlySummary,
    fetchDayDetails,
    getInsights,
  };
}
