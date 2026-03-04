import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Building2 } from "lucide-react";

export function MobileHeader() {
  const { profile } = useAuth();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-[#1e2a4a]">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8902e] flex items-center justify-center">
            <Building2 className="h-4 w-4 text-[#0a0e1a]" />
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-[#d4a853] to-[#f0d48a] bg-clip-text text-transparent leading-tight">
              NextWeb OS
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">
              {profile?.full_name?.split(" ")[0] || "User"}
            </p>
          </div>
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
