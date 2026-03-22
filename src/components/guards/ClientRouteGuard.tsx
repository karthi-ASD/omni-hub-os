import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { CLIENT_ONLY_ROUTES, STAFF_ONLY_ROUTES } from "@/lib/role-resolver";

const TENANT_ALLOWED_PREFIXES = [
  "/dashboard",
  "/dialer",
  "/sales/dialer",
  "/sales/dialer-dashboard",
  "/my-billing",
  "/my-package",
  "/invoices",
  "/seo",
  "/client-reports",
  "/unified-tickets",
  "/projects",
  "/calendar",
  "/reports",
  "/settings",
  "/profile",
  "/nextweb-services",
  "/my-crm",
  "/client-performance-intelligence",
  "/client-seo-projects",
  "/client-website-structure",
  "/client-local-presence",
  "/client-leads-dashboard",
  "/solar-projects",
  "/solar-dashboard",
  "/solar-installations",
];

export function ClientRouteGuard({ children }: { children?: React.ReactNode }) {
  const { dashboardShell, userType, isAuthResolved } = useAuth();

  if (!isAuthResolved) {
    return children ? <>{children}</> : <Outlet />;
  }

  const path = window.location.pathname;

  // ── HARD BLOCK: Non-clients must NEVER reach client-only routes ──
  // Covers explicit list AND prefix-based fallback for future routes
  if (userType !== "client") {
    const isClientOnlyRoute = CLIENT_ONLY_ROUTES.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    );
    const isClientPrefixRoute = path.startsWith("/client-") || path.startsWith("/client/");

    if (isClientOnlyRoute || isClientPrefixRoute) {
      // Allow staff-managed client pages (e.g. /client-360, /client-package) 
      // that are protected by requiredRoles in App.tsx
      const STAFF_CLIENT_ROUTES = [
        "/client-360",
        "/client-package",
        "/client-projects",
        "/client-data-integrity",
      ];
      const isStaffClientRoute = STAFF_CLIENT_ROUTES.some(
        (prefix) => path === prefix || path.startsWith(prefix + "/")
      );
      if (!isStaffClientRoute) {
        console.error("[SECURITY] Non-client blocked from client route", { path, userType });
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // ── HARD BLOCK: Clients must NEVER reach staff-only routes ──
  if (userType === "client") {
    const isStaffOnlyRoute = STAFF_ONLY_ROUTES.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    );
    if (isStaffOnlyRoute) {
      console.warn(`[RouteGuard] Client blocked from staff route: ${path}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Super admin / internal staff → unrestricted
  if (dashboardShell === "super_admin" || dashboardShell === "internal_staff") {
    return children ? <>{children}</> : <Outlet />;
  }

  // Tenant users → restrict to allowed prefixes
  const allowed = TENANT_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
