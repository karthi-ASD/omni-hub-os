import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NWLogo } from "@/components/NWLogo";

export function MobileHeader() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-strong safe-area-top">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <NWLogo size="sm" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              NextWeb OS
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {profile?.full_name?.split(" ")[0] || "User"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <GlobalSearch />
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
