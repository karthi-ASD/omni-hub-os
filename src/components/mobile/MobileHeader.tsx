import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NWLogo } from "@/components/NWLogo";

export function MobileHeader() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-[#1e2a4a]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <NWLogo size="sm" />
          <p className="text-[10px] text-gray-500 leading-tight ml-1">
            {profile?.full_name?.split(" ")[0] || "User"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <GlobalSearch />
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
