import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/mobile/BottomNav";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useAuth } from "@/contexts/AuthContext";

const AppShell = () => {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background gradient-mesh">
      <MobileHeader />
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <FloatingActionButton />
      <BottomNav />
      {businessId && (
        <ChatWidget
          businessId={businessId}
          title="AI Support"
          subtitle="Powered by AI • Ask anything"
        />
      )}
    </div>
  );
};

export default AppShell;
