/**
 * Central role + shell resolution utilities.
 *
 * Security identity (`UserType`) stays strict and mutually exclusive.
 * UI shell resolution (`AppMode`) is separate so tenant users never fall back
 * into internal NextWeb shells during delayed client-link hydration.
 */

export type UserType = "super_admin" | "business_admin" | "employee" | "client";
export type AppMode = "super_admin" | "internal_staff" | "client_business" | "client_portal";
export type DashboardShell = AppMode;

const INTERNAL_STAFF_ROLES = ["employee", "hr_manager", "manager"] as const;
const PRIVILEGED_ROLES = ["super_admin", "business_admin", ...INTERNAL_STAFF_ROLES] as const;

function hasAnyRole(roles: string[], allowedRoles: readonly string[]) {
  return allowedRoles.some((role) => roles.includes(role));
}

export function resolveUserType({
  roles,
  clientUserId,
}: {
  roles: string[];
  clientUserId: string | null;
}): UserType {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("business_admin")) return "business_admin";
  if (hasAnyRole(roles, INTERNAL_STAFF_ROLES)) return "employee";

  if (clientUserId) return "client";

  return "employee";
}

export function resolveAppMode({
  roles,
  clientUserId,
  businessId,
}: {
  roles: string[];
  clientUserId: string | null;
  businessId: string | null;
}): AppMode {
  // 1. Super admin always gets the global shell
  if (roles.includes("super_admin")) return "super_admin";

  // 2. Internal NextWeb staff — ONLY when they have NO businessId
  //    (NextWeb employees don't belong to a client tenant)
  if (hasAnyRole(roles, INTERNAL_STAFF_ROLES) && !businessId) {
    return "internal_staff";
  }

  // 3. CRITICAL FIX: Any user belonging to a business → client_business shell
  //    This catches: business_admin, employees-of-tenant, tenant owners, etc.
  if (businessId) {
    return "client_business";
  }

  // 4. Client portal user (linked via client_users but no business)
  if (clientUserId) {
    return "client_portal";
  }

  // 5. Safe fallback — portal, never internal
  return "client_portal";
}

export function isStaffUser(userType: UserType): boolean {
  return userType === "super_admin" || userType === "business_admin" || userType === "employee";
}

export function isClientPortalUser(userType: UserType): boolean {
  return userType === "client";
}

export function detectRoleConflict({
  roles,
  clientUserId,
  userId,
}: {
  roles: string[];
  clientUserId: string | null;
  userId: string | undefined;
}): string | null {
  const hasPrivilegedRole = hasAnyRole(roles, PRIVILEGED_ROLES);

  if (hasPrivilegedRole && !!clientUserId) {
    return `[ROLE CONFLICT] Staff user ${userId} has client_users record — client context IGNORED. Roles: ${roles.join(",")}`;
  }

  return null;
}
