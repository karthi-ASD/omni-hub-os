import { NavLink, useLocation } from "react-router-dom";
import { Home, Target, ClipboardList, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, to: "/dashboard" },
  { label: "Leads", icon: Target, to: "/leads" },
  { label: "Tasks", icon: ClipboardList, to: "/tasks" },
  { label: "Clients", icon: Users, to: "/clients" },
  { label: "More", icon: MoreHorizontal, to: "/more" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
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
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
