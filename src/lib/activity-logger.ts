/**
 * Activity Intelligence — centralized logging utilities.
 * All logging is fire-and-forget; failures never break the caller.
 */

import { supabase } from "@/integrations/supabase/client";

interface ActivityLogInput {
  userId: string;
  userRole?: string;
  businessId?: string | null;
  clientId?: string | null;
  module: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface BehaviourLogInput {
  userId: string;
  userRole?: string;
  businessId?: string | null;
  clientId?: string | null;
  sessionId: string;
  pageUrl: string;
  pageName: string;
  action?: string;
  element?: string;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

/**
 * Log a meaningful user/system action. Fire-and-forget.
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  try {
    await supabase.from("activity_logs" as any).insert({
      user_id: input.userId,
      user_role: input.userRole || null,
      business_id: input.businessId || null,
      client_id: input.clientId || null,
      module: input.module,
      action_type: input.actionType,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      description: input.description || null,
      metadata: input.metadata || {},
    });
  } catch (e) {
    console.warn("[ActivityLogger] Failed to log activity:", e);
  }
}

/**
 * Log page visit / behaviour. Fire-and-forget.
 */
export async function logBehaviour(input: BehaviourLogInput): Promise<void> {
  try {
    await supabase.from("user_behaviour_logs" as any).insert({
      user_id: input.userId,
      user_role: input.userRole || null,
      business_id: input.businessId || null,
      client_id: input.clientId || null,
      session_id: input.sessionId,
      page_url: input.pageUrl,
      page_name: input.pageName,
      action: input.action || "page_visit",
      element: input.element || null,
      time_spent: input.timeSpent || 0,
      metadata: input.metadata || {},
    });
  } catch (e) {
    console.warn("[ActivityLogger] Failed to log behaviour:", e);
  }
}

/**
 * Start a user session record. Returns the session row id.
 */
export async function startSession(userId: string, sessionId: string): Promise<void> {
  try {
    await supabase.from("user_sessions" as any).insert({
      user_id: userId,
      session_id: sessionId,
      login_time: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[ActivityLogger] Failed to start session:", e);
  }
}

/**
 * End a user session — sets logout_time and total_duration.
 */
export async function endSession(userId: string, sessionId: string): Promise<void> {
  try {
    const { data } = await (supabase.from("user_sessions" as any)
      .select("id, login_time")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .is("logout_time", null)
      .order("login_time", { ascending: false })
      .limit(1) as any);

    if (data && data.length > 0) {
      const row = data[0];
      const duration = Math.round((Date.now() - new Date(row.login_time).getTime()) / 1000);
      await (supabase.from("user_sessions" as any) as any)
        .update({ logout_time: new Date().toISOString(), total_duration: duration })
        .eq("id", row.id);
    }
  } catch (e) {
    console.warn("[ActivityLogger] Failed to end session:", e);
  }
}

/** Generate a unique session id */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
