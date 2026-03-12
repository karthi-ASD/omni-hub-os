import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { NWLogo } from "@/components/NWLogo";
import { TenantSelector } from "@/components/TenantSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home, Target, FolderKanban, Users, ClipboardList, Globe, BarChart3,
  Receipt, Briefcase, Mail, Bot, Settings, Shield, Ticket,
  Calendar, Megaphone, Headphones, Building2, FileText, Zap,
  Phone, DollarSign, Wrench, Network, Heart, PieChart,
  Palette, Activity, Layers, UserCog, LogOut, Search, Bell,
  BookOpen, Lock, Cpu, Workflow, Store, Gauge, Brain,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", icon: Home, to: "/dashboard" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
    ],
  },
  {
    title: "Sales & CRM",
    items: [
      { label: "Inquiries", icon: Mail, to: "/inquiries" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Proposals", icon: FileText, to: "/proposals" },
      { label: "Contracts", icon: FileText, to: "/contracts" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Tasks", icon: ClipboardList, to: "/tasks" },
      { label: "Website Dev", icon: Globe, to: "/website-dev-stages" },
      { label: "Content Mgmt", icon: FileText, to: "/content-management" },
      { label: "Job CRM", icon: Wrench, to: "/job-crm" },
    ],
  },
  {
    title: "Marketing & SEO",
    items: [
      { label: "SEO Engine", icon: Search, to: "/seo" },
      { label: "SEO Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "Marketing", icon: Megaphone, to: "/marketing" },
      { label: "Ads", icon: BarChart3, to: "/analytics" },
      { label: "Communications", icon: Mail, to: "/communications" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Tickets", icon: Ticket, to: "/tickets" },
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard" },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: DollarSign, to: "/payments" },
      { label: "Finance", icon: PieChart, to: "/finance" },
    ],
  },
  {
    title: "HR",
    items: [
      { label: "Employees", icon: Users, to: "/hr/employees" },
      { label: "Departments", icon: Building2, to: "/hr/departments" },
      { label: "Leave", icon: Calendar, to: "/hr/leave" },
      { label: "Payroll", icon: DollarSign, to: "/hr/payroll" },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      { label: "AI Brain", icon: Brain, to: "/ai-brain" },
      { label: "AI Agents", icon: Bot, to: "/ai-agents" },
      { label: "Automation", icon: Zap, to: "/workflow-automation" },
      { label: "Autopilot", icon: Cpu, to: "/autopilot/inbox" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Users", icon: UserCog, to: "/users" },
      { label: "Roles", icon: Shield, to: "/role-management" },
      { label: "Audit Logs", icon: Activity, to: "/audit-logs" },
      { label: "SA Tools", icon: Wrench, to: "/super-admin-tools", roles: ["super_admin"] },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, isSuperAdmin, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3">
        <div className={cn("flex items-center gap-2.5 transition-all", collapsed && "justify-center")}>
          <NWLogo size="sm" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-sidebar-accent-foreground leading-tight truncate">
                NextWeb OS
              </span>
              <span className="text-[10px] text-sidebar-foreground leading-tight truncate">
                {profile?.full_name?.split(" ")[0] || "User"}
              </span>
            </div>
          )}
        </div>
        {!collapsed && isSuperAdmin && (
          <div className="mt-2">
            <TenantSelector />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {NAV_SECTIONS.map(section => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold px-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map(item => {
                  const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.to}
                          end={item.to === "/dashboard"}
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-all",
                            active
                              ? "bg-sidebar-accent text-sidebar-primary font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
