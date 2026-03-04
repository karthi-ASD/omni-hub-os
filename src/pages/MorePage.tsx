import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, FolderKanban, FileText, Briefcase, Receipt, BarChart3,
  PieChart, Globe, Mail, TrendingUp, Brain, Bot, Store, Calendar, Clock,
  Shield, Settings, LogOut, Users, Building2, Activity, Palette, Megaphone,
  UserCog, CalendarDays, Ticket, Phone, DollarSign, Briefcase as BriefcaseIcon,
  Sparkles, MessageCircle, Plug, ShieldCheck, Factory, PhoneCall, Zap, Workflow, Inbox,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  to: string;
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
    title: "Intelligence & AI",
    items: [
      { label: "AI Brain", icon: Brain, to: "/ai-brain" },
      { label: "AI Intelligence", icon: Brain, to: "/ai-intelligence" },
      { label: "Growth Engine", icon: Sparkles, to: "/growth-engine" },
      { label: "Analytics", icon: TrendingUp, to: "/analytics" },
      { label: "AI Insights", icon: Sparkles, to: "/ai-insights" },
      { label: "AI Agents", icon: Bot, to: "/ai-agents" },
      { label: "AI Voice Agents", icon: Phone, to: "/ai-voice-agents" },
      { label: "Agent Factory", icon: Factory, to: "/agent-factory" },
      { label: "Voice Agent", icon: PhoneCall, to: "/voice-agent" },
      { label: "Reports", icon: PieChart, to: "/reports" },
    ],
  },
  {
    title: "Messaging & Compliance",
    items: [
      { label: "Conversations", icon: MessageCircle, to: "/conversations" },
      { label: "Providers", icon: Plug, to: "/providers" },
      { label: "Consent", icon: ShieldCheck, to: "/consent-compliance" },
    ],
  },
  {
    title: "Autopilot",
    items: [
      { label: "Inbox", icon: Inbox, to: "/autopilot/inbox" },
      { label: "Sequences", icon: Workflow, to: "/autopilot/sequences" },
      { label: "Settings", icon: Zap, to: "/autopilot/settings" },
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0e1a] via-[#111832] to-[#0a0e1a] border border-[#1e2a4a] p-5 mb-6">
        <div className="absolute top-0 right-0 h-24 w-24 bg-[#d4a853]/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-[#d4a853]/30">
            <AvatarFallback className="text-lg bg-gradient-to-br from-[#d4a853] to-[#b8902e] text-[#0a0e1a] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="h-3 w-3 text-[#d4a853]" />
              <p className="text-xs text-[#d4a853] capitalize font-medium">
                {roles.join(", ").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu sections */}
      {visibleSections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-[10px] font-bold text-[#d4a853] uppercase tracking-[0.15em] px-1 pb-2">
            {section.title}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {section.items.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl hover:bg-[#111832] active:bg-[#1e2a4a] transition-colors border border-transparent hover:border-[#1e2a4a]"
              >
                <div className="h-10 w-10 rounded-xl bg-[#111832] border border-[#1e2a4a] flex items-center justify-center group-hover:border-[#d4a853]/30">
                  <item.icon className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-[11px] font-medium text-gray-400 text-center leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="pt-4">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default MorePage;
