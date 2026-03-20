import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
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
  const { profile, isSuperAdmin, isBusinessAdmin, isClientUser, roles, signOut } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const { hasCustomCRM, crmType } = useBusinessCRM();

  const isAdmin = isSuperAdmin || isBusinessAdmin;
  const activeCRMSections = getCRMSections(crmType);

  // Safety fallback: show client sidebar if user has a CRM type mapped,
  // even if client_users record is missing
  const isClientUserSafe = isClientUser || (!!crmType && !isSuperAdmin && !isBusinessAdmin);

  console.log("=== SIDEBAR DEBUG ===");
  console.log("isClientUser:", isClientUser);
  console.log("isClientUserSafe:", isClientUserSafe);
  console.log("isSuperAdmin:", isSuperAdmin);
  console.log("isBusinessAdmin:", isBusinessAdmin);
  console.log("profile.business_id:", profile?.business_id);
  console.log("expected ACE1 ID:", "fcd55dac-804b-462f-8a95-1d49cdd0b03d");
  console.log("hasCustomCRM:", hasCustomCRM);
  console.log("crmType:", crmType);
  console.log("CRM Sections:", activeCRMSections);

  const debugPanel = !collapsed ? (
    <div className="px-2 pb-2">
      <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-2 py-2 text-[10px] text-destructive break-words">
        {JSON.stringify({
          isClientUser,
          isClientUserSafe,
          businessId: profile?.business_id,
          crmType,
          hasCustomCRM,
        })}
      </div>
    </div>
  ) : null;

  // ── Client users get separated navigation ──
  if (isClientUserSafe) {
    return (
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-3">
          <div className={cn("flex items-center gap-2.5 transition-all", collapsed && "justify-center")}>
            <NWLogo size="sm" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-sidebar-accent-foreground leading-tight truncate">
                  Client Portal
                </span>
                <span className="text-[10px] text-sidebar-foreground leading-tight truncate">
                  {profile?.full_name?.split(" ")[0] || "User"}
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          {debugPanel}

          {/* Section A: NextWeb Services (always shown) */}
          {NEXTWEB_SERVICES_SECTIONS.map(section => (
            <SidebarNavSection key={section.title} section={section} collapsed={collapsed} pathname={location.pathname} />
          ))}

          {/* Section B: My Business CRM (only if hasCustomCRM) */}
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

  // ── Staff / admin navigation ──

  const filteredSections = NAV_SECTIONS.filter(section => {
    if (isAdmin) return true;
    if (section.departments && !matchesDept(section.departments, departmentName)) return false;
    if (section.hiddenFromDepartments && matchesDept(section.hiddenFromDepartments, departmentName)) return false;
    return true;
  });

  const filterItems = (items: NavItem[]) =>
    items.filter(item => {
      if (item.roles && !item.roles.some(r => roles.includes(r as any))) return false;
      if (isAdmin) return true;
      if (item.hiddenFromDepartments && matchesDept(item.hiddenFromDepartments, departmentName)) return false;
      if (item.departments && !matchesDept(item.departments, departmentName)) return false;
      return true;
    });

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
        {debugPanel}
        {filteredSections.map(section => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;
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
