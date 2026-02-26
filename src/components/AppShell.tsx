import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Users, BarChart3, FileText, Briefcase,
  ClipboardList, Ticket, Receipt, PieChart, Megaphone,
  UserCog, MessageSquare, FolderKanban, Target,
  Settings, Shield, LogOut, ChevronLeft, ChevronRight,
  LayoutDashboard, Menu, Calendar, Clock, Globe, Mail,
  Activity, TrendingUp, Brain, Palette, Bot, Handshake, PresentationIcon,
  Store, Smartphone, Server, Landmark, Banknote, Gavel, ShieldAlert,
  Rocket, Building, BarChartBig, Map, Eye, Coins,
  Gauge, Siren, Database, FileCheck, GitBranch,
  PlayCircle, Plug, ClipboardCheck,
  CalendarDays, DollarSign, Network, KeyRound,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TenantSelector } from "@/components/TenantSelector";
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
  { label: "Calendar", icon: Calendar, to: "/calendar", enabled: true },
  { label: "Leads", icon: Target, to: "/leads", enabled: true },
  { label: "Inquiries", icon: MessageSquare, to: "/inquiries", enabled: true },
  { label: "Reminders", icon: Clock, to: "/reminders", enabled: true },
  { label: "Deals", icon: FolderKanban, to: "/deals", enabled: true },
  { label: "Proposals", icon: FileText, to: "/proposals", enabled: true },
  { label: "Contracts", icon: FileText, to: "/contracts", enabled: true },
  { label: "Clients", icon: Users, to: "/clients", enabled: true },
  { label: "Projects", icon: Briefcase, to: "/projects", enabled: true },
  { label: "Invoices", icon: Receipt, to: "/invoices", enabled: true },
  { label: "Payments", icon: BarChart3, to: "/payments", enabled: true },
  { label: "Billing", icon: PieChart, to: "/billing", enabled: true },
  { label: "Customer Billing", icon: Receipt, to: "/tenant-billing", enabled: true },
  { label: "Gateways", icon: Settings, to: "/gateways", enabled: true },
  { label: "SEO", icon: Globe, to: "/seo", enabled: true },
  { label: "GEO Engine", icon: Globe, to: "/geo-engine", enabled: true },
  { label: "Communications", icon: Mail, to: "/communications", enabled: true },
  { label: "Analytics", icon: TrendingUp, to: "/analytics", enabled: true },
  { label: "Analytics Integrations", icon: TrendingUp, to: "/analytics-integrations", enabled: true },
  { label: "AI Insights", icon: Brain, to: "/ai-insights", enabled: true },
  { label: "AI Agents", icon: Bot, to: "/ai-agents", enabled: true },
  { label: "Marketplace", icon: Store, to: "/marketplace", enabled: true },
  { label: "Job CRM", icon: Briefcase, to: "/job-crm", enabled: true },
  { label: "Tasks", icon: ClipboardList, to: "/tasks", enabled: false },
  { label: "Tickets", icon: Ticket, to: "/tickets", enabled: false },
  { label: "Workforce", icon: UserCog, to: "/workforce", enabled: true },
  { label: "Leave", icon: CalendarDays, to: "/leave", enabled: true },
  { label: "Reports", icon: PieChart, to: "/reports", enabled: false },
  { label: "Marketing", icon: Megaphone, to: "/marketing", enabled: false },
];

const adminNav = [
  { label: "Platform Billing", icon: Receipt, to: "/platform-billing", roles: ["super_admin"] as const },
  { label: "Businesses", icon: Building2, to: "/businesses", roles: ["super_admin"] as const },
  { label: "Users", icon: Users, to: "/users", roles: ["super_admin", "business_admin"] as const },
  { label: "Settings", icon: Settings, to: "/settings", roles: ["super_admin", "business_admin"] as const },
  { label: "Audit Logs", icon: Shield, to: "/audit-logs", roles: ["super_admin", "business_admin"] as const },
  { label: "System Monitor", icon: Activity, to: "/system-monitor", roles: ["super_admin", "business_admin"] as const },
  { label: "White-Label", icon: Palette, to: "/white-label", roles: ["super_admin", "business_admin"] as const },
  { label: "Investor Dashboard", icon: TrendingUp, to: "/investor-dashboard", roles: ["super_admin"] as const },
  { label: "Investor Pitch", icon: PresentationIcon, to: "/investor-pitch", roles: ["super_admin"] as const },
  { label: "Partners", icon: Handshake, to: "/partners", roles: ["super_admin"] as const },
  { label: "App Factory", icon: Smartphone, to: "/app-factory", roles: ["super_admin", "business_admin"] as const },
  { label: "Infrastructure", icon: Server, to: "/infrastructure", roles: ["super_admin"] as const },
  { label: "Corporate Structure", icon: Landmark, to: "/corporate-structure", roles: ["super_admin"] as const },
  { label: "Fundraising", icon: Banknote, to: "/fundraising", roles: ["super_admin"] as const },
  { label: "Governance", icon: Gavel, to: "/governance", roles: ["super_admin"] as const },
  { label: "Risk Management", icon: ShieldAlert, to: "/risk-management", roles: ["super_admin"] as const },
  { label: "Expansion Engine", icon: Rocket, to: "/expansion-engine", roles: ["super_admin"] as const },
  { label: "Acquisitions", icon: Building, to: "/acquisitions", roles: ["super_admin"] as const },
  { label: "IPO Readiness", icon: BarChartBig, to: "/ipo-readiness", roles: ["super_admin"] as const },
  { label: "Franchise Blueprint", icon: Map, to: "/franchise-blueprint", roles: ["super_admin"] as const },
  { label: "Competitive Intel", icon: Eye, to: "/competitive-intel", roles: ["super_admin"] as const },
  { label: "Capital Allocation", icon: Coins, to: "/capital-allocation", roles: ["super_admin"] as const },
  { label: "Observability", icon: Gauge, to: "/observability", roles: ["super_admin"] as const },
  { label: "Incidents", icon: Siren, to: "/incidents", roles: ["super_admin"] as const },
  { label: "Backups & DR", icon: Database, to: "/backups", roles: ["super_admin"] as const },
  { label: "Compliance", icon: FileCheck, to: "/compliance", roles: ["super_admin"] as const },
  { label: "Releases", icon: GitBranch, to: "/releases", roles: ["super_admin"] as const },
  { label: "Go-Live Playbook", icon: PlayCircle, to: "/go-live", roles: ["super_admin"] as const },
  { label: "Dependencies", icon: Plug, to: "/dependencies", roles: ["super_admin"] as const },
  { label: "QA Checklist", icon: ClipboardCheck, to: "/qa-checklist", roles: ["super_admin"] as const },
  { label: "Payroll", icon: DollarSign, to: "/payroll", roles: ["super_admin", "business_admin"] as const },
  { label: "SLA Policies", icon: ShieldAlert, to: "/sla", roles: ["super_admin", "business_admin"] as const },
  { label: "Org Chart", icon: Network, to: "/org-chart", roles: ["super_admin", "business_admin"] as const },
  { label: "Client 360", icon: Users, to: "/client-360", roles: ["super_admin", "business_admin"] as const },
  { label: "Secure Vault", icon: KeyRound, to: "/vault", roles: ["super_admin", "business_admin"] as const },
  { label: "Usage Analytics", icon: Activity, to: "/usage-analytics", roles: ["super_admin", "business_admin"] as const },
  { label: "Demo Mode", icon: PlayCircle, to: "/demo-mode", roles: ["super_admin"] as const },
  { label: "Revenue Intelligence", icon: TrendingUp, to: "/revenue-intelligence", roles: ["super_admin", "business_admin"] as const },
  { label: "Activity Timeline", icon: Clock, to: "/activity-timeline", roles: ["super_admin", "business_admin"] as const },
  { label: "Governance Controls", icon: Gavel, to: "/governance-controls", roles: ["super_admin", "business_admin"] as const },
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
        {mainNav.map((item) => {
          const isEnabled = item.enabled || isSuperAdmin || isBusinessAdmin;
          return (
          <div key={item.label}>
            {isEnabled ? (
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
          );
        })}

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
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <TenantSelector />
            <ThemeToggle />
            <NotificationBell />

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
