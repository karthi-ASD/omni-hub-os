/**
 * SINGLE SOURCE OF TRUTH for user type resolution.
 *
 * Priority order:
 *   1. super_admin  (highest privilege)
 *   2. business_admin
 *   3. employee
 *   4. client       (ONLY if explicit link exists AND no staff role)
 *   5. employee     (SAFE DEFAULT — never "client")
 */

export type UserType = "super_admin" | "business_admin" | "employee" | "client";

export function resolveUserType({
  roles,
  clientUserId,
}: {
  roles: string[];
  clientUserId: string | null;
}): UserType {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("business_admin")) return "business_admin";
  if (roles.includes("employee")) return "employee";

  // ONLY classify as client when explicitly linked AND no staff role
  if (clientUserId) return "client";

  // SAFE DEFAULT — never fall back to "client"
  return "employee";
}

/** Returns true if the resolved type is any staff role */
export function isStaffUser(userType: UserType): boolean {
  return userType === "super_admin" || userType === "business_admin" || userType === "employee";
}

/** Returns true if the resolved type is a client portal user */
export function isClientPortalUser(userType: UserType): boolean {
  return userType === "client";
}

/**
 * Detects role conflicts — e.g. a staff user who also has a client_users record.
 * Returns a warning string or null.
 */
export function detectRoleConflict({
  roles,
  clientUserId,
  userId,
}: {
  roles: string[];
  clientUserId: string | null;
  userId: string | undefined;
}): string | null {
  const hasStaffRole =
    roles.includes("super_admin") ||
    roles.includes("business_admin") ||
    roles.includes("employee");

  if (hasStaffRole && !!clientUserId) {
    return `[ROLE CONFLICT] Staff user ${userId} has client_users record — client context IGNORED. Roles: ${roles.join(",")}`;
  }

  return null;
}
