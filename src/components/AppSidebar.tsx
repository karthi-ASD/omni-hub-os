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
import { LogOut } from "lucide-react";
import { NAV_SECTIONS, type NavItem, type NavSection } from "@/components/sidebar/nav-sections";
import { CLIENT_NAV_SECTIONS } from "@/components/sidebar/client-nav-sections";

function matchesDept(list: string[] | undefined, deptName: string | null): boolean {
  if (!list || list.length === 0 || !deptName) return false;
  const lower = deptName.toLowerCase();
  return list.some(d => lower.includes(d));
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, isSuperAdmin, isBusinessAdmin, roles, signOut } = useAuth();
  const { departmentName } = useEmployeeDepartment();

  const isAdmin = isSuperAdmin || isBusinessAdmin;

  const filteredSections = NAV_SECTIONS.filter(section => {
    // Admins see everything
    if (isAdmin) return true;
    // Dept-specific sections: only show if user is in that dept
    if (section.departments && !matchesDept(section.departments, departmentName)) return false;
    // Hidden from dept sections
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
        {filteredSections.map(section => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.title}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold px-2">
                  {section.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map(item => {
                    const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
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
