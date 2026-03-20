// 🔒 DO NOT MODIFY — SECURITY CRITICAL
// Central role + shell resolution utilities.
//
// Security identity (`UserType`) stays strict and mutually exclusive.
// UI shell resolution (`AppMode`) is separate so tenant users never fall back
// into internal NextWeb shells during delayed client-link hydration.
//
// 🚫 NEVER use roles.includes("client") — INVALID DESIGN
// Client detection MUST ONLY use: clientUserId AND no employee signal

export type UserType = "super_admin" | "business_admin" | "employee" | "client";
export type AppMode = "super_admin" | "internal_staff" | "client_business" | "client_portal";
export type DashboardShell = AppMode;

const INTERNAL_STAFF_ROLES = ["employee", "hr_manager", "manager"] as const;
const PRIVILEGED_ROLES = ["super_admin", "business_admin", ...INTERNAL_STAFF_ROLES] as const;

function hasAnyRole(roles: string[], allowedRoles: readonly string[]) {
  return allowedRoles.some((role) => roles.includes(role));
}

/**
 * STRICT USER TYPE RESOLUTION — SINGLE SOURCE OF TRUTH
 *
 * Priority order:
 * 1. super_admin (role)
 * 2. business_admin (role)
 * 3. employee (role OR hr_employees record)
 * 4. client (only if clientUserId AND no employee signal)
 * 5. employee (fallback)
 */
export function resolveUserType({
  roles,
  clientUserId,
  isEmployeeByHR,
}: {
  roles: string[];
  clientUserId: string | null;
  isEmployeeByHR?: boolean;
}): UserType {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("business_admin")) return "business_admin";

  // Employee check: role-based OR hr_employees record
  if (hasAnyRole(roles, INTERNAL_STAFF_ROLES)) return "employee";
  if (isEmployeeByHR) return "employee";

  // Client ONLY if no employee signal exists
  if (clientUserId) return "client";

  // Fallback: treat as employee (safer than client)
  return "employee";
}

export function resolveAppMode({
  roles,
  clientUserId,
  businessId,
  isEmployeeByHR,
}: {
  roles: string[];
  clientUserId: string | null;
  businessId: string | null;
  isEmployeeByHR?: boolean;
}): AppMode {
  // 1. Super admin always gets the global shell
  if (roles.includes("super_admin")) return "super_admin";

  // 2. Any staff role or hr_employees record → business shell
  const isStaff = hasAnyRole(roles, PRIVILEGED_ROLES) || !!isEmployeeByHR;

  // 3. Internal NextWeb staff — ONLY when they have NO businessId
  if (isStaff && !businessId) {
    return "internal_staff";
  }

  // 4. Staff with businessId → client_business (tenant CRM)
  if (isStaff && businessId) {
    return "client_business";
  }

  // 5. Non-staff with businessId → client_business
  if (businessId) {
    return "client_business";
  }

  // 6. Client portal user (linked via client_users but no business)
  if (clientUserId) {
    return "client_portal";
  }

  // 7. Safe fallback — portal, never internal
  return "client_portal";
}

export function isStaffUser(userType: UserType): boolean {
  return userType === "super_admin" || userType === "business_admin" || userType === "employee";
}

export function isClientPortalUser(userType: UserType): boolean {
  return userType === "client";
}

/**
 * 🔒 DO NOT MODIFY — SECURITY CRITICAL
 * REGRESSION GUARD — fires if a staff user is either:
 *   - classified as "client", OR
 *   - still holds a non-null clientUserId
 */
export function assertNoEmployeeClientCrossover({
  isEmployeeByHR,
  roles,
  userType,
  clientUserId,
  userId,
}: {
  isEmployeeByHR?: boolean;
  roles: string[];
  userType: UserType;
  clientUserId?: string | null;
  userId?: string;
}): void {
  const hasStaffSignal = !!isEmployeeByHR || hasAnyRole(roles, [...PRIVILEGED_ROLES]);
  if (hasStaffSignal && (userType === "client" || !!clientUserId)) {
    const msg = `[CRITICAL SECURITY] Employee detected as client. User ${userId}, Roles: ${roles.join(",")}, userType: ${userType}, clientUserId: ${clientUserId}, isEmployeeByHR: ${isEmployeeByHR}`;
    console.error(msg);
    throw new Error("SECURITY_VIOLATION: Employee cannot be classified as client");
  }
}

/** Routes that ONLY client users may access */
export const CLIENT_ONLY_ROUTES = ["/client-dashboard", "/client-portal"] as const;

/** Routes that clients must NEVER access */
export const STAFF_ONLY_ROUTES = [
  "/crm",
  "/command-centre",
  "/sales",
  "/dialer",
  "/hr",
  "/finance",
  "/platform-billing",
  "/investor-dashboard",
  "/corporate-structure",
  "/infrastructure",
  "/observability",
] as const;

export function detectRoleConflict({
  roles,
  clientUserId,
  userId,
  isEmployeeByHR,
}: {
  roles: string[];
  clientUserId: string | null;
  userId: string | undefined;
  isEmployeeByHR?: boolean;
}): string | null {
  const hasPrivilegedRole = hasAnyRole(roles, PRIVILEGED_ROLES) || !!isEmployeeByHR;

  if (hasPrivilegedRole && !!clientUserId) {
    return `[ROLE CONFLICT] Staff user ${userId} has client_users record — client context IGNORED. Roles: ${roles.join(",")}, isEmployeeByHR: ${isEmployeeByHR}`;
  }

  return null;
}
