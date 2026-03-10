import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/mobile/BottomNav";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileHeader } from "@/components/mobile/MobileHeader";

const AppShell = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background gradient-mesh">
      <MobileHeader />
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <FloatingActionButton />
      <BottomNav />
    </div>
  );
};

export default AppShell;
