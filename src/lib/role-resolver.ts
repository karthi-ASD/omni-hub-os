/**
 * Central role + shell resolution utilities.
 *
 * Security identity (`UserType`) stays strict and mutually exclusive.
 * UI shell resolution (`AppMode`) is separate so tenant users never fall back
 * into internal NextWeb shells during delayed client-link hydration.
 */

export type UserType = "super_admin" | "business_admin" | "employee" | "client";
export type AppMode = "super_admin" | "internal_staff" | "business_admin" | "client";
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
  hasCustomCRM,
}: {
  roles: string[];
  clientUserId: string | null;
  businessId: string | null;
  hasCustomCRM: boolean;
}): AppMode {
  if (roles.includes("super_admin")) return "super_admin";
  if (hasAnyRole(roles, INTERNAL_STAFF_ROLES)) return "internal_staff";
  if (roles.includes("business_admin")) return "business_admin";

  const hasTenantContext = !!businessId;

  if (hasTenantContext && hasCustomCRM) return "business_admin";
  if (clientUserId) return "client";
  if (hasTenantContext) return "client";

  // Never fall back to an internal shell for unresolved tenant-side users.
  return "client";
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
