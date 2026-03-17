import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/mobile/BottomNav";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BroadcastPopup } from "@/components/notifications/BroadcastPopup";

const AppShell = () => {

  const { profile } = useAuth();
  const businessId = profile?.business_id;
  const isMobile = useIsMobile();

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Top Bar */}
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
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
  );
};

export default AppShell;
