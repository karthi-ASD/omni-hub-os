import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export interface CallerMetrics {
  total_calls: number;
  connected_calls: number;
  ended_calls: number;
  failed_calls: number;
  busy_calls: number;
  no_answer_calls: number;
  total_talk_time: number;
  avg_duration: number;
  avg_ai_score: number;
  recordings_count: number;
  interested_count: number;
  converted_count: number;
  callback_count: number;
  not_interested_count: number;
  wrong_number_count: number;
}

export interface HourlyMetric {
  hour: number;
  total: number;
  connected: number;
  talk_time: number;
  avg_duration: number;
  conversions: number;
}

export interface DailyMetric {
  day: string;
  total: number;
  connected: number;
  talk_time: number;
  avg_ai_score: number;
  conversions: number;
  recordings: number;
}

export interface TeamAgent {
  user_id: string;
  agent_name: string;
  total: number;
  connected: number;
  talk_time: number;
  avg_duration: number;
  avg_ai_score: number;
  interested: number;
  converted: number;
  callbacks: number;
  not_interested: number;
  no_answer: number;
  failed: number;
  busy: number;
}

export interface TeamMetrics {
  summary: CallerMetrics & { active_callers: number; conversions: number };
  agents: TeamAgent[];
}

const emptyMetrics: CallerMetrics = {
  total_calls: 0, connected_calls: 0, ended_calls: 0, failed_calls: 0,
  busy_calls: 0, no_answer_calls: 0, total_talk_time: 0, avg_duration: 0,
  avg_ai_score: 0, recordings_count: 0, interested_count: 0, converted_count: 0,
  callback_count: 0, not_interested_count: 0, wrong_number_count: 0,
};

export function useCallerMetrics(period: "today" | "week" | "month" | "custom", customFrom?: Date, customTo?: Date) {
  const { profile } = useAuth();
  const now = new Date();
  let dateFrom: Date;
  let dateTo = now;

  switch (period) {
    case "today": dateFrom = startOfDay(now); break;
    case "week": dateFrom = startOfWeek(now, { weekStartsOn: 1 }); break;
    case "month": dateFrom = startOfMonth(now); break;
    case "custom": dateFrom = customFrom || subDays(now, 7); dateTo = customTo || now; break;
  }

  return useQuery<CallerMetrics>({
    queryKey: ["dialer-caller-metrics", profile?.business_id, profile?.user_id, period, dateFrom.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dialer_caller_metrics", {
        _business_id: profile!.business_id!,
        _user_id: profile!.user_id!,
        _date_from: dateFrom.toISOString(),
        _date_to: dateTo.toISOString(),
      });
      if (error) { console.error(error); return emptyMetrics; }
      return (data as any) || emptyMetrics;
    },
    enabled: !!profile?.business_id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useHourlyMetrics(userId?: string | null, dateFrom?: Date, dateTo?: Date) {
  const { profile } = useAuth();
  const from = dateFrom || startOfDay(new Date());
  const to = dateTo || new Date();

  return useQuery<HourlyMetric[]>({
    queryKey: ["dialer-hourly", profile?.business_id, userId, from.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dialer_hourly_metrics", {
        _business_id: profile!.business_id!,
        _user_id: userId || null,
        _date_from: from.toISOString(),
        _date_to: to.toISOString(),
      });
      if (error) { console.error(error); return []; }
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 30_000,
  });
}

export function useDailyMetrics(userId?: string | null, dateFrom?: Date, dateTo?: Date) {
  const { profile } = useAuth();
  const from = dateFrom || subDays(new Date(), 30);
  const to = dateTo || new Date();

  return useQuery<DailyMetric[]>({
    queryKey: ["dialer-daily", profile?.business_id, userId, from.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dialer_daily_metrics", {
        _business_id: profile!.business_id!,
        _user_id: userId || null,
        _date_from: from.toISOString(),
        _date_to: to.toISOString(),
      });
      if (error) { console.error(error); return []; }
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
    staleTime: 60_000,
  });
}

export function useTeamMetrics(dateFrom?: Date, dateTo?: Date) {
  const { profile } = useAuth();
  const from = dateFrom || startOfDay(new Date());
  const to = dateTo || new Date();

  return useQuery<TeamMetrics>({
    queryKey: ["dialer-team", profile?.business_id, from.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dialer_team_metrics", {
        _business_id: profile!.business_id!,
        _date_from: from.toISOString(),
        _date_to: to.toISOString(),
      });
      if (error) { console.error(error); return { summary: { ...emptyMetrics, active_callers: 0, conversions: 0 }, agents: [] }; }
      return (data as any) || { summary: { ...emptyMetrics, active_callers: 0, conversions: 0 }, agents: [] };
    },
    enabled: !!profile?.business_id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function formatTalkTime(seconds: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
