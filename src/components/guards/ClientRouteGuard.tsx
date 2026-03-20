import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { CLIENT_ONLY_ROUTES, STAFF_ONLY_ROUTES } from "@/lib/role-resolver";

const TENANT_ALLOWED_PREFIXES = [
  "/dashboard",
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
    return null;
  }

  const path = window.location.pathname;

  // ── HARD BLOCK: Employees must NEVER reach client-only routes ──
  if (userType !== "client") {
    const isClientOnlyRoute = CLIENT_ONLY_ROUTES.some(
      (prefix) => path === prefix || path.startsWith(prefix + "/")
    );
    if (isClientOnlyRoute) {
      console.warn(`[RouteGuard] Employee blocked from client route: ${path}`);
      return <Navigate to="/dashboard" replace />;
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
