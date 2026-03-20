import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/mobile/BottomNav";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingDialer } from "@/components/dialer/FloatingDialer";
import { BusinessThemeProvider } from "@/components/business-crm/BusinessThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BroadcastPopup } from "@/components/notifications/BroadcastPopup";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useEffect } from "react";

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
  const businessId = profile?.business_id;
  const isMobile = useIsMobile();
  useActivityTracking(); // Global activity + behaviour tracking
  const shellInfo = shellMeta[dashboardShell];
  const shellTitle = dashboardShell === "client_business" || dashboardShell === "client_portal"
    ? activeBusinessName || shellInfo.title
    : shellInfo.title;

  useEffect(() => {
    console.log("[SHELL RENDER]", {
      dashboardShell,
      pathname: window.location.pathname,
      businessId,
      activeBusinessName,
    });
  }, [dashboardShell, businessId, activeBusinessName]);

  if (!isAuthResolved) {
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
        {businessId && (
          <ChatWidget
            businessId={businessId}
            title="AI Support"
            subtitle="Powered by AI • Ask anything"
          />
        )}
      </div>
    );
  }

  return (
    <BusinessThemeProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <div className="min-w-0 hidden md:block">
                  <p className="text-sm font-semibold text-foreground truncate">{shellTitle}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{shellInfo.subtitle}</p>
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
          {businessId && (
            <ChatWidget
              businessId={businessId}
              title="AI Support"
              subtitle="Powered by AI • Ask anything"
            />
          )}
        </div>
      </SidebarProvider>
    </BusinessThemeProvider>
  );
};

export default AppShell;
