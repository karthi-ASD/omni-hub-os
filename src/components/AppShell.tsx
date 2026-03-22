import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/mobile/BottomNav";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingDialer } from "@/components/dialer/FloatingDialer";
import { PersistentDialerConsumer } from "@/components/dialer/PersistentDialerConsumer";
import { ActiveCallBar } from "@/components/dialer/ActiveCallBar";
import { BusinessThemeProvider } from "@/components/business-crm/BusinessThemeProvider";
import { BrowserDialerProvider } from "@/contexts/BrowserDialerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BroadcastPopup } from "@/components/notifications/BroadcastPopup";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { logDialerEvent } from "@/hooks/useBrowserDialer";
import { useEffect, useRef } from "react";

const shellMeta = {
  super_admin: {
    title: "NextWeb Super Admin",
    subtitle: "Global tenant oversight and platform controls.",
  },
  internal_staff: {
    title: "NextWeb Staff Workspace",
    subtitle: "Internal operations, delivery, and service management.",
  },
  client_business: {
    title: "Business Workspace",
    subtitle: "Tenant-scoped CRM and business operations.",
  },
  client_portal: {
    title: "Client Portal",
    subtitle: "Your services, reporting, and business growth workspace.",
  },
} as const;

const ShellLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AppShell = () => {
  const { profile, isAuthResolved, dashboardShell, activeBusinessName } = useAuth();
  const location = useLocation();
  const businessId = profile?.business_id;
  const isMobile = useIsMobile();
  useActivityTracking(); // Global activity + behaviour tracking
  const shellInfo = shellMeta[dashboardShell];
  const shellTitle = dashboardShell === "client_business" || dashboardShell === "client_portal"
    ? activeBusinessName || shellInfo.title
    : shellInfo.title;
  const hideChatWidget = location.pathname.startsWith("/sales/dialer") || location.pathname.startsWith("/dialer");

  const shellRenderCount = useRef(0);
  const prevPathRef = useRef(location.pathname);
  const hasStableShellRef = useRef(false);
  const stableShellRef = useRef<{ shell: keyof typeof shellMeta; businessId: string | null; businessName: string | null } | null>(null);
  shellRenderCount.current++;

  useEffect(() => {
    logDialerEvent("APP_SHELL_RENDER_START", { renderCount: shellRenderCount.current, dashboardShell, pathname: window.location.pathname, isAuthResolved, businessId });
    if (isAuthResolved) {
      hasStableShellRef.current = true;
      stableShellRef.current = { shell: dashboardShell, businessId, businessName: activeBusinessName };
      logDialerEvent("APP_SHELL_RENDER_SUCCESS", { renderCount: shellRenderCount.current, dashboardShell, pathname: window.location.pathname });
    } else if (hasStableShellRef.current) {
      logDialerEvent("APP_SHELL_BLANK_SCREEN_GUARD_TRIGGERED", { pathname: window.location.pathname });
    } else {
      logDialerEvent("APP_SHELL_RENDER_BLOCKED_REASON", { reason: "auth_not_resolved_initial", pathname: window.location.pathname });
    }
  }, [dashboardShell, businessId, activeBusinessName, isAuthResolved]);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      logDialerEvent("ROUTE_CHANGE_DETECTED", { from: prevPathRef.current, to: location.pathname });
      logDialerEvent("APP_SHELL_STILL_MOUNTED_AFTER_ROUTE_CHANGE", { renderCount: shellRenderCount.current, to: location.pathname });
      logDialerEvent("ROUTE_TREE_REBUILT", { from: prevPathRef.current, to: location.pathname });
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const effectiveShell = isAuthResolved ? dashboardShell : (stableShellRef.current?.shell ?? dashboardShell);
  const effectiveBusinessId = isAuthResolved ? businessId : (stableShellRef.current?.businessId ?? businessId);
  const effectiveBusinessName = isAuthResolved ? activeBusinessName : (stableShellRef.current?.businessName ?? activeBusinessName);
  const effectiveShellInfo = shellMeta[effectiveShell];
  const effectiveShellTitle = effectiveShell === "client_business" || effectiveShell === "client_portal"
    ? effectiveBusinessName || effectiveShellInfo.title
    : effectiveShellInfo.title;

  if (!isAuthResolved && !hasStableShellRef.current) {
    return <ShellLoading />;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-background gradient-mesh">
        <MobileHeader />
        <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
          <Outlet />
        </main>
        <FloatingActionButton />
        <BottomNav />
        <BroadcastPopup />
        {effectiveBusinessId && !hideChatWidget && (
          <ChatWidget
            businessId={effectiveBusinessId}
            title="AI Support"
            subtitle="Powered by AI • Ask anything"
          />
        )}
      </div>
    );
  }

  return (
    <BrowserDialerProvider>
      <PersistentDialerConsumer />
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <ActiveCallBar />
              <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                  <div className="min-w-0 hidden md:block">
                      <p className="text-sm font-semibold text-foreground truncate">{effectiveShellTitle}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{effectiveShellInfo.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <GlobalSearch />
                  <ThemeToggle />
                  <NotificationBell />
                </div>
              </header>
              <main className="flex-1 p-6 overflow-y-auto gradient-mesh">
                <div className="max-w-[1400px] mx-auto">
                  <Outlet />
                </div>
              </main>
            </div>
            <FloatingDialer />
            <BroadcastPopup />
            {effectiveBusinessId && !hideChatWidget && (
              <ChatWidget
                businessId={effectiveBusinessId}
                title="AI Support"
                subtitle="Powered by AI • Ask anything"
              />
            )}
          </div>
        </SidebarProvider>
      </BusinessThemeProvider>
    </BrowserDialerProvider>
  );
};

export default AppShell;
