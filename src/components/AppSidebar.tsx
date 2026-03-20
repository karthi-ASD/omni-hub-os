import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { NWLogo } from "@/components/NWLogo";
import { TenantSelector } from "@/components/TenantSelector";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { NAV_SECTIONS, type NavItem, type NavSection } from "@/components/sidebar/nav-sections";
import { NEXTWEB_SERVICES_SECTIONS, getCRMSections } from "@/components/sidebar/client-nav-sections";

function matchesDept(list: string[] | undefined, deptName: string | null): boolean {
  if (!list || list.length === 0 || !deptName) return false;
  const lower = deptName.toLowerCase();
  return list.some(d => lower.includes(d));
}

function SidebarNavSection({
  section,
  collapsed,
  pathname,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <SidebarGroup key={section.title}>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold px-2">
          {section.title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map(item => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/")
              || (item.to.includes("?") && pathname === item.to.split("?")[0] && typeof window !== "undefined" && window.location.search === "?" + item.to.split("?")[1]);
            return (
              <SidebarMenuItem key={item.to + item.label}>
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
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const {
    profile,
    isSuperAdmin,
    roles,
    signOut,
    selectedTenantId,
    allBusinesses,
    dashboardShell,
    activeBusinessName,
    activeCRMType,
  } = useAuth();
  const { departmentName } = useEmployeeDepartment();

  const isTenantShell = dashboardShell === "client" || dashboardShell === "business_admin";
  const isStaffShell = dashboardShell === "internal_staff" || dashboardShell === "super_admin";
  const activeCRMSections = getCRMSections(activeCRMType);
  const hasCustomCRM = !!activeCRMType && activeCRMType !== "generic";

  console.log("[NAV DEBUG]", {
    userId: profile?.user_id,
    roles,
    dashboardShell,
    clientUserId: null,
    visibleSections: isTenantShell
      ? [...NEXTWEB_SERVICES_SECTIONS.map(section => section.title), ...(hasCustomCRM ? activeCRMSections.map(section => section.title) : [])]
      : NAV_SECTIONS.map(section => section.title),
    hiddenSections: [],
  });

  if (isTenantShell) {
    const businessName = activeBusinessName || profile?.full_name || "My Business";
    const renderedSections = [
      ...NEXTWEB_SERVICES_SECTIONS.map(section => section.title),
      ...(hasCustomCRM ? activeCRMSections.map(section => section.title) : []),
    ];

    console.log("[SIDEBAR SOURCE]", {
      dashboardShell,
      sectionsRendered: renderedSections,
    });

    return (
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-3">
          <div className={cn("flex flex-col gap-1 transition-all", collapsed && "items-center")}>
            {!collapsed && (
              <span className="text-xs font-bold text-sidebar-accent-foreground leading-tight truncate">
                {businessName}
              </span>
            )}
            <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
              <NWLogo size="sm" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-sidebar-foreground/50 uppercase tracking-wider font-medium">
                    Powered by NextWeb
                  </span>
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          {NEXTWEB_SERVICES_SECTIONS.map(section => (
            <SidebarNavSection key={section.title} section={section} collapsed={collapsed} pathname={location.pathname} />
          ))}

          {hasCustomCRM && (
            <>
              <div className="px-2 py-2">
                <Separator className="bg-sidebar-foreground/10" />
                {!collapsed && (
                  <p className="text-[9px] uppercase tracking-widest text-sidebar-foreground/40 font-bold mt-2 px-2">
                    My Business CRM
                  </p>
                )}
              </div>
              {activeCRMSections.map(section => (
                <SidebarNavSection key={section.title} section={section} collapsed={collapsed} pathname={location.pathname} />
              ))}
            </>
          )}
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

  const filteredSections = isStaffShell ? NAV_SECTIONS.filter(section => {
    if (dashboardShell === "super_admin") return true;
    if (section.departments && !matchesDept(section.departments, departmentName)) return false;
    if (section.hiddenFromDepartments && matchesDept(section.hiddenFromDepartments, departmentName)) return false;
    return true;
  }) : [];

  const filterItems = (items: NavItem[]) =>
    items.filter(item => {
      if (item.roles && !item.roles.some(r => roles.includes(r as any))) return false;
      if (dashboardShell === "super_admin") return true;
      if (item.hiddenFromDepartments && matchesDept(item.hiddenFromDepartments, departmentName)) return false;
      if (item.departments && !matchesDept(item.departments, departmentName)) return false;
      return true;
    });

  const renderedSections = filteredSections
    .map(section => ({ ...section, items: filterItems(section.items) }))
    .filter(section => section.items.length > 0)
    .map(section => section.title);

  console.log("[SIDEBAR SOURCE]", {
    dashboardShell,
    sectionsRendered: renderedSections,
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3">
        <div className={cn("flex items-center gap-2.5 transition-all", collapsed && "justify-center")}>
          <NWLogo size="sm" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-sidebar-accent-foreground leading-tight truncate">
                {dashboardShell === "super_admin" ? "NextWeb OS" : "NextWeb Staff"}
              </span>
              <span className="text-[10px] text-sidebar-foreground leading-tight truncate">
                {profile?.full_name?.split(" ")[0] || "User"}
              </span>
            </div>
          )}
        </div>
        {!collapsed && isSuperAdmin && dashboardShell === "super_admin" && (
          <div className="mt-2 space-y-1.5">
            <TenantSelector />
            {selectedTenantId && (
              <div className="px-2 py-1 rounded bg-primary/10 text-[10px] text-primary font-medium truncate">
                Viewing: {allBusinesses.find(b => b.id === selectedTenantId)?.name || "Tenant"}
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {filteredSections.map(section => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;

          console.log("[SECTION CHECK]", {
            title: section.title,
            userType: dashboardShell,
            visible: true,
            childCount: visibleItems.length,
          });

          return (
            <SidebarNavSection
              key={section.title}
              section={{ ...section, items: visibleItems }}
              collapsed={collapsed}
              pathname={location.pathname}
            />
          );
        })}
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
