import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, FolderKanban, FileText, Briefcase, Receipt, BarChart3,
  PieChart, Globe, Mail, TrendingUp, Brain, Bot, Store, Calendar, Clock,
  Shield, Settings, LogOut, Users, Building2, Activity, Palette, Megaphone,
  UserCog, CalendarDays, Ticket, Phone, DollarSign, Briefcase as BriefcaseIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  to: string;
  badge?: string;
}

const menuSections: { title: string; items: MenuItem[]; roles?: string[] }[] = [
  {
    title: "Sales & CRM",
    items: [
      { label: "Inquiries", icon: MessageSquare, to: "/inquiries" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Proposals", icon: FileText, to: "/proposals" },
      { label: "Contracts", icon: FileText, to: "/contracts" },
      { label: "Job CRM", icon: BriefcaseIcon, to: "/job-crm" },
    ],
  },
  {
    title: "Projects & Work",
    items: [
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Reminders", icon: Clock, to: "/reminders" },
      { label: "Tickets", icon: Ticket, to: "/tickets" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: BarChart3, to: "/payments" },
      { label: "Billing", icon: PieChart, to: "/billing" },
    ],
  },
  {
    title: "Marketing & SEO",
    items: [
      { label: "SEO", icon: Globe, to: "/seo" },
      { label: "Communications", icon: Mail, to: "/communications" },
      { label: "Marketing", icon: Megaphone, to: "/marketing" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Analytics", icon: TrendingUp, to: "/analytics" },
      { label: "AI Insights", icon: Brain, to: "/ai-insights" },
      { label: "AI Agents", icon: Bot, to: "/ai-agents" },
      { label: "Reports", icon: PieChart, to: "/reports" },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Workforce", icon: UserCog, to: "/workforce" },
      { label: "Leave", icon: CalendarDays, to: "/leave" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Businesses", icon: Building2, to: "/businesses" },
      { label: "Users", icon: Users, to: "/users" },
      { label: "Audit Logs", icon: Shield, to: "/audit-logs" },
      { label: "Settings", icon: Settings, to: "/settings" },
    ],
    roles: ["super_admin", "business_admin"],
  },
];

const MorePage = () => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const visibleSections = menuSections.filter(
    (s) => !s.roles || s.roles.some((r) => roles.includes(r as any))
  );

  return (
    <div className="pb-4 animate-fade-in">
      {/* Profile card */}
      <div className="px-4 py-5 flex items-center gap-4 border-b border-border">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg bg-primary text-primary-foreground font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{profile?.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {roles.join(", ").replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Menu sections */}
      {visibleSections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-5 pb-2">
            {section.title}
          </p>
          <div className="grid grid-cols-4 gap-1 px-3">
            {section.items.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="px-4 pt-6">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-medium text-sm"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default MorePage;
