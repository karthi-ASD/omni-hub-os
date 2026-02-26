import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Users, BarChart3, FileText, Briefcase,
  ClipboardList, Ticket, Receipt, PieChart, Megaphone,
  UserCog, Search, MessageSquare, FolderKanban, Target,
  Settings, Shield, Bell, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Menu,
} from "lucide-react";
import { NavLink as RouterNavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", enabled: true },
  { label: "Leads", icon: Target, to: "/leads", enabled: false },
  { label: "Inquiries", icon: MessageSquare, to: "/inquiries", enabled: false },
  { label: "Pipeline", icon: FolderKanban, to: "/pipeline", enabled: false },
  { label: "Proposals", icon: FileText, to: "/proposals", enabled: false },
  { label: "Clients", icon: Users, to: "/clients", enabled: false },
  { label: "Projects", icon: Briefcase, to: "/projects", enabled: false },
  { label: "Tasks", icon: ClipboardList, to: "/tasks", enabled: false },
  { label: "Tickets", icon: Ticket, to: "/tickets", enabled: false },
  { label: "Invoices", icon: Receipt, to: "/invoices", enabled: false },
  { label: "Reports", icon: PieChart, to: "/reports", enabled: false },
  { label: "Marketing", icon: Megaphone, to: "/marketing", enabled: false },
  { label: "HR", icon: UserCog, to: "/hr", enabled: false },
];

const adminNav = [
  { label: "Businesses", icon: Building2, to: "/businesses", roles: ["super_admin"] as const },
  { label: "Users", icon: Users, to: "/users", roles: ["super_admin", "business_admin"] as const },
  { label: "Settings", icon: Settings, to: "/settings", roles: ["super_admin", "business_admin"] as const },
  { label: "Audit Logs", icon: Shield, to: "/audit-logs", roles: ["super_admin", "business_admin"] as const },
];

const AppShell = () => {
  const { profile, roles, signOut, isSuperAdmin, isBusinessAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const visibleAdminNav = adminNav.filter((item) =>
    item.roles.some((r) => roles.includes(r))
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-accent-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-bold text-sidebar-accent-foreground">NextWeb OS</span>}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className={`text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 ${collapsed ? "text-center" : "px-3"}`}>
          {collapsed ? "•" : "Main"}
        </p>
        {mainNav.map((item) => (
          <div key={item.label}>
            {item.enabled ? (
              <RouterNavLink
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </RouterNavLink>
            ) : (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/30 cursor-not-allowed ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            )}
          </div>
        ))}

        {visibleAdminNav.length > 0 && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            <p className={`text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 ${collapsed ? "text-center" : "px-3"}`}>
              {collapsed ? "•" : "Admin"}
            </p>
            {visibleAdminNav.map((item) => (
              <RouterNavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </RouterNavLink>
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden lg:block border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-60"}`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm cursor-not-allowed">
              <Search className="h-4 w-4" />
              <span>Search... (coming soon)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" disabled>
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                      {profile?.full_name}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {roles.join(", ").replace(/_/g, " ")}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
