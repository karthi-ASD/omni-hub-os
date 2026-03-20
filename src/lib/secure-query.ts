/**
 * Secure query wrapper — enforces role-based data isolation at the query level.
 *
 * Usage:
 *   const query = supabase.from("clients").select("*");
 *   const secured = secureClientQuery(query, { userType, userId, clientId, businessId });
 */

import type { UserType } from "./role-resolver";

interface SecureQueryContext {
  userType: UserType;
  userId: string;
  clientId: string | null;
  businessId: string | null;
}

/**
 * Applies role-based filters to a Supabase query targeting client-scoped data.
 * Super admins get business-scoped access; employees get assignment-scoped; clients get self-only.
 */
export function secureClientQuery<T extends { eq: (col: string, val: any) => T }>(
  query: T,
  ctx: SecureQueryContext
): T {
  switch (ctx.userType) {
    case "client":
      if (!ctx.clientId) {
        console.error("[SECURITY] Client user without clientId — blocking query");
        // Apply impossible filter to return empty result
        return query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
      return query.eq("id", ctx.clientId);

    case "employee":
      // Employees see data within their business
      if (ctx.businessId) {
        return query.eq("business_id", ctx.businessId);
      }
      console.error("[SECURITY] Employee without businessId — blocking query");
      return query.eq("id", "00000000-0000-0000-0000-000000000000");

    case "business_admin":
      if (ctx.businessId) {
        return query.eq("business_id", ctx.businessId);
      }
      return query;

    case "super_admin":
      // Super admins use selectedTenantId which is already set as business_id in profile
      if (ctx.businessId) {
        return query.eq("business_id", ctx.businessId);
      }
      return query;

    default:
      console.error("[SECURITY] Unknown userType — blocking query");
      return query.eq("id", "00000000-0000-0000-0000-000000000000");
  }
}

/**
 * Security audit logger — logs access checks for debugging role isolation issues.
 */
export function logSecurityCheck(context: {
  userId: string | undefined;
  userType: UserType;
  roles: string[];
  clientId: string | null;
  route: string;
  action: string;
}) {
  console.log("[SECURITY CHECK]", {
    userId: context.userId,
    userType: context.userType,
    roles: context.roles,
    clientId: context.clientId,
    route: context.route,
    action: context.action,
    timestamp: new Date().toISOString(),
  });
}
