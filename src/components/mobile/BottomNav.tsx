import { NavLink, useLocation } from "react-router-dom";
import { Home, Target, ClipboardList, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, to: "/dashboard" },
  { label: "Leads", icon: Target, to: "/leads" },
  { label: "Inbox", icon: MessageCircle, to: "/autopilot/inbox" },
  { label: "Tasks", icon: ClipboardList, to: "/tasks" },
  { label: "More", icon: MoreHorizontal, to: "/more" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.to === "/more"
              ? location.pathname === "/more"
              : location.pathname.startsWith(tab.to);

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300",
                isActive && "bg-primary/10"
              )}>
                <tab.icon className={cn("h-[18px] w-[18px] transition-all", isActive && "stroke-[2.5]")} />
                {isActive && (
                  <div className="absolute -bottom-0.5 h-[3px] w-5 bg-primary rounded-full shadow-glow-sm" />
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
