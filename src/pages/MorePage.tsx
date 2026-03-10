import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, FolderKanban, FileText, Briefcase, Receipt, BarChart3,
  PieChart, Globe, Mail, TrendingUp, Brain, Bot, Store, Calendar, Clock,
  Shield, Settings, LogOut, Users, Building2, Activity, Palette, Megaphone,
  UserCog, CalendarDays, Ticket, Phone, DollarSign,
  Sparkles, MessageCircle, Plug, ShieldCheck, Factory, PhoneCall, Zap, Workflow, Inbox,
  Route, CreditCard, Gauge, Eye, Server, Landmark, Scale, Map, Target as TargetIcon,
  Rocket, GitBranch, Trophy, Layers, Umbrella, BarChart2, BookOpen, Lock, Cpu,
  Flag, ListChecks, CheckCircle, FileBarChart, Network, Heart, Bell, Wrench,
  Headphones, ThumbsUp,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

interface MenuSection {
  title: string;
  description: string;
  items: MenuItem[];
  roles?: string[];
}

const superAdminSections: MenuSection[] = [
  {
    title: "1 · Platform Overview",
    description: "Overall platform health and activity",
    items: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Activity Timeline", icon: Activity, to: "/activity-timeline" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Analytics", icon: BarChart2, to: "/analytics" },
    ],
  },
  {
    title: "2 · Tenant Management",
    description: "Business accounts, domains, and usage",
    items: [
      { label: "Businesses", icon: Building2, to: "/businesses" },
      { label: "Websites", icon: Globe, to: "/websites" },
      { label: "Usage Analytics", icon: BarChart2, to: "/usage-analytics" },
      { label: "White Label", icon: Palette, to: "/white-label" },
      { label: "Demo Mode", icon: Eye, to: "/demo-mode" },
    ],
  },
  {
    title: "3 · Sales Management",
    description: "Full sales pipeline from inquiry to contract",
    items: [
      { label: "Inquiries", icon: MessageSquare, to: "/inquiries" },
      { label: "Leads", icon: TargetIcon, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Proposals", icon: FileText, to: "/proposals" },
      { label: "Contracts", icon: FileText, to: "/contracts" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Client 360", icon: Heart, to: "/client-360" },
      { label: "Lead Routing", icon: Route, to: "/lead-routing" },
      { label: "AI Sales Brain", icon: Brain, to: "/ai-sales-brain" },
    ],
  },
  {
    title: "4 · Customer Service",
    description: "AI-powered support, ticketing, and customer success",
    items: [
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard" },
      { label: "Tickets", icon: Ticket, to: "/tickets" },
      { label: "Company Accounts", icon: Building2, to: "/company-accounts" },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
      { label: "CSAT Surveys", icon: ThumbsUp, to: "/satisfaction-surveys" },
      { label: "CS Reports", icon: BarChart3, to: "/cs-reports" },
      { label: "AI Assistant", icon: Bot, to: "/ai-assistant-settings" },
      { label: "CS Automation", icon: Zap, to: "/cs-automation" },
      { label: "Customer Portal", icon: Globe, to: "/customer-portal" },
      { label: "Customer App", icon: Globe, to: "/customer-app" },
      { label: "Staff App", icon: Headphones, to: "/staff-app" },
      { label: "SLA Monitor", icon: Gauge, to: "/sla" },
    ],
  },
  {
    title: "5 · Agency Operations",
    description: "Command center, client projects, task pipeline, workload, and SLA",
    items: [
      { label: "Command Center", icon: Gauge, to: "/agency-command" },
      { label: "Client Projects", icon: Briefcase, to: "/client-projects" },
      { label: "Task Pipeline", icon: FolderKanban, to: "/task-pipeline" },
      { label: "Workload Monitor", icon: BarChart2, to: "/workload-monitor" },
      { label: "SLA Monitor", icon: Gauge, to: "/sla-monitor" },
    ],
  },
  {
    title: "6 · Delivery Operations",
    description: "Projects, tasks, and service tracking",
    items: [
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Tasks", icon: ListChecks, to: "/tasks" },
      { label: "Job CRM", icon: Wrench, to: "/job-crm" },
      { label: "Reminders", icon: Clock, to: "/reminders" },
    ],
  },
  {
    title: "7 · Marketing & SEO Operations",
    description: "SEO projects, tasks, blogs, GMB, social media, rankings, AI & execution",
    items: [
      { label: "SEO Engine", icon: Globe, to: "/seo" },
      { label: "SEO Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "SEO Team", icon: Users, to: "/seo-team" },
      { label: "SEO Intel", icon: Sparkles, to: "/seo-ops" },
      { label: "Marketing", icon: Megaphone, to: "/marketing" },
      { label: "Geo Engine", icon: Map, to: "/geo-engine" },
      { label: "Competitive Intel", icon: TargetIcon, to: "/competitive-intel" },
      { label: "Communications", icon: Mail, to: "/communications" },
      { label: "Analytics Intg.", icon: Plug, to: "/analytics-integrations" },
      { label: "Reports", icon: FileBarChart, to: "/reports" },
    ],
  },
  {
    title: "7 · Finance",
    description: "Billing, invoices, payments, and forecasting",
    items: [
      { label: "Billing", icon: PieChart, to: "/billing" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: BarChart3, to: "/payments" },
      { label: "Tenant Billing", icon: CreditCard, to: "/tenant-billing" },
      { label: "Platform Billing", icon: CreditCard, to: "/platform-billing" },
      { label: "Gateways", icon: CreditCard, to: "/gateways" },
      { label: "Revenue Intel", icon: TrendingUp, to: "/revenue-intelligence" },
    ],
  },
  {
    title: "8 · HR & Workforce",
    description: "HR management, departments, employees, leave, payroll, performance, tasks, analytics",
    items: [
      { label: "Departments", icon: Building2, to: "/hr/departments" },
      { label: "Employee Dir.", icon: Users, to: "/hr/employees" },
      { label: "Leave Mgmt", icon: CalendarDays, to: "/hr/leave" },
      { label: "Payroll", icon: DollarSign, to: "/hr/payroll" },
      { label: "Performance", icon: Trophy, to: "/hr/performance" },
      { label: "HR Tasks", icon: ListChecks, to: "/hr/tasks" },
      { label: "HR Analytics", icon: BarChart2, to: "/hr/analytics" },
      { label: "Workforce", icon: UserCog, to: "/workforce" },
      { label: "Leave (Old)", icon: CalendarDays, to: "/leave" },
      { label: "Org Chart", icon: Network, to: "/org-chart" },
    ],
  },
  {
    title: "9 · Intelligence & AI",
    description: "AI Brain, agents, learning, and growth engine",
    items: [
      { label: "AI Brain", icon: Brain, to: "/ai-brain" },
      { label: "AI Sales Brain", icon: Sparkles, to: "/ai-sales-brain" },
      { label: "AI Learning", icon: BookOpen, to: "/ai-learning" },
      { label: "AI Intelligence", icon: Brain, to: "/ai-intelligence" },
      { label: "AI Insights", icon: Sparkles, to: "/ai-insights" },
      { label: "AI Agents", icon: Bot, to: "/autonomous-agents" },
      { label: "AI Voice", icon: Phone, to: "/ai-voice-agents" },
      { label: "Agent Factory", icon: Factory, to: "/agent-factory" },
      { label: "Voice Agent", icon: PhoneCall, to: "/voice-agent" },
      { label: "Growth Engine", icon: Rocket, to: "/growth-engine" },
    ],
  },
  {
    title: "10 · Security & Compliance",
    description: "Vault, audits, backups, approvals, and compliance",
    items: [
      { label: "Vault", icon: Lock, to: "/vault" },
      { label: "Audit Logs", icon: Shield, to: "/audit-logs" },
      { label: "Backups", icon: Server, to: "/backups" },
      { label: "Compliance", icon: ShieldCheck, to: "/compliance" },
      { label: "Governance", icon: Scale, to: "/governance-controls" },
      { label: "Consent", icon: ShieldCheck, to: "/consent-compliance" },
    ],
  },
  {
    title: "🔧 System Settings",
    description: "Users, roles, integrations, and system config",
    items: [
      { label: "Users", icon: Users, to: "/users" },
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "System Monitor", icon: Server, to: "/system-monitor" },
      { label: "Providers", icon: Plug, to: "/providers" },
      { label: "Marketplace", icon: Store, to: "/marketplace" },
      { label: "App Factory", icon: Cpu, to: "/app-factory" },
    ],
  },
  {
    title: "🏢 Corporate & Expansion",
    description: "Investor relations, fundraising, IPO, and franchise",
    items: [
      { label: "Investor Dash", icon: Landmark, to: "/investor-dashboard" },
      { label: "Investor Pitch", icon: Trophy, to: "/investor-pitch" },
      { label: "Partners", icon: Briefcase, to: "/partners" },
      { label: "Corporate", icon: Building2, to: "/corporate-structure" },
      { label: "Fundraising", icon: Rocket, to: "/fundraising" },
      { label: "Governance", icon: Scale, to: "/governance" },
      { label: "Risk Mgmt", icon: Umbrella, to: "/risk-management" },
      { label: "Expansion", icon: Map, to: "/expansion-engine" },
      { label: "Acquisitions", icon: Layers, to: "/acquisitions" },
      { label: "IPO Readiness", icon: Flag, to: "/ipo-readiness" },
      { label: "Franchise", icon: GitBranch, to: "/franchise-blueprint" },
      { label: "Capital", icon: DollarSign, to: "/capital-allocation" },
      { label: "Infrastructure", icon: Server, to: "/infrastructure" },
      { label: "Observability", icon: Eye, to: "/observability" },
      { label: "Incidents", icon: Umbrella, to: "/incidents" },
      { label: "Releases", icon: Rocket, to: "/releases" },
      { label: "Go Live", icon: CheckCircle, to: "/go-live" },
      { label: "Dependencies", icon: GitBranch, to: "/dependencies" },
      { label: "QA Checklist", icon: ListChecks, to: "/qa-checklist" },
    ],
  },
];

const tenantAdminSections: MenuSection[] = [
  {
    title: "Dashboard",
    description: "Your business overview and key metrics",
    items: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
    ],
  },
  {
    title: "Leads & Sales",
    description: "All potential customers captured from forms, ads, and campaigns",
    items: [
      { label: "Inquiries", icon: MessageSquare, to: "/inquiries" },
      { label: "Leads", icon: TargetIcon, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Proposals", icon: FileText, to: "/proposals" },
      { label: "Contracts", icon: FileText, to: "/contracts" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "AI Sales Brain", icon: Brain, to: "/ai-sales-brain" },
    ],
  },
  {
    title: "Jobs / Projects",
    description: "Track projects, assign tasks, and monitor delivery",
    items: [
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Tasks", icon: ListChecks, to: "/tasks" },
      { label: "Job CRM", icon: Wrench, to: "/job-crm" },
      { label: "Reminders", icon: Clock, to: "/reminders" },
    ],
  },
  {
    title: "Marketing / SEO",
    description: "SEO projects, tasks, keyword tracking, and reports",
    items: [
      { label: "SEO Engine", icon: Globe, to: "/seo" },
      { label: "SEO Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "SEO Team", icon: Users, to: "/seo-team" },
      { label: "Marketing", icon: Megaphone, to: "/marketing" },
      { label: "Communications", icon: Mail, to: "/communications" },
      { label: "Reports", icon: FileBarChart, to: "/reports" },
    ],
  },
  {
    title: "Billing",
    description: "Invoices, payments, and financial overview",
    items: [
      { label: "Billing", icon: PieChart, to: "/billing" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: BarChart3, to: "/payments" },
    ],
  },
  {
    title: "HR & Employees",
    description: "Departments, employees, leave, payroll, performance, and tasks",
    items: [
      { label: "Departments", icon: Building2, to: "/hr/departments" },
      { label: "Employee Dir.", icon: Users, to: "/hr/employees" },
      { label: "Leave Mgmt", icon: CalendarDays, to: "/hr/leave" },
      { label: "Payroll", icon: DollarSign, to: "/hr/payroll" },
      { label: "Performance", icon: Trophy, to: "/hr/performance" },
      { label: "HR Tasks", icon: ListChecks, to: "/hr/tasks" },
      { label: "HR Analytics", icon: BarChart2, to: "/hr/analytics" },
      { label: "Workforce", icon: UserCog, to: "/workforce" },
      { label: "Org Chart", icon: Network, to: "/org-chart" },
    ],
  },
  {
    title: "Communications",
    description: "Conversations, autopilot inbox, and messaging",
    items: [
      { label: "Inbox", icon: Inbox, to: "/autopilot/inbox" },
      { label: "Conversations", icon: MessageCircle, to: "/conversations" },
      { label: "Sequences", icon: Workflow, to: "/autopilot/sequences" },
    ],
  },
  {
    title: "Customer Service",
    description: "AI-powered support, ticketing, and customer success",
    items: [
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard" },
      { label: "Tickets", icon: Ticket, to: "/tickets" },
      { label: "Company Accounts", icon: Building2, to: "/company-accounts" },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
      { label: "CSAT Surveys", icon: ThumbsUp, to: "/satisfaction-surveys" },
      { label: "CS Reports", icon: BarChart3, to: "/cs-reports" },
      { label: "AI Assistant", icon: Bot, to: "/ai-assistant-settings" },
      { label: "CS Automation", icon: Zap, to: "/cs-automation" },
      { label: "Customer Portal", icon: Globe, to: "/customer-portal" },
    ],
  },
  {
    title: "Company Settings",
    description: "Users, settings, audit logs, and integrations",
    items: [
      { label: "Users", icon: Users, to: "/users" },
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Websites", icon: Globe, to: "/websites" },
      { label: "Audit Logs", icon: Shield, to: "/audit-logs" },
      { label: "Vault", icon: Lock, to: "/vault" },
    ],
  },
];

const managerSections: MenuSection[] = [
  {
    title: "Department Management",
    description: "Your team, tasks, and department operations",
    items: [
      { label: "Team Dashboard", icon: BarChart3, to: "/manager-dashboard" },
      { label: "My HR Portal", icon: UserCog, to: "/my-dashboard" },
      { label: "Leave Requests", icon: CalendarDays, to: "/hr/leave" },
      { label: "Performance", icon: Trophy, to: "/hr/performance" },
      { label: "HR Tasks", icon: ListChecks, to: "/hr/tasks" },
    ],
  },
  {
    title: "My Work",
    description: "Your tasks, calendar, and reminders",
    items: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "Tasks", icon: ListChecks, to: "/tasks" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Reminders", icon: Clock, to: "/reminders" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
    ],
  },
  {
    title: "CRM",
    description: "Leads, deals, and client management",
    items: [
      { label: "Leads", icon: TargetIcon, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Projects", icon: Briefcase, to: "/projects" },
    ],
  },
  {
    title: "Communication",
    description: "Inbox and conversations",
    items: [
      { label: "Inbox", icon: Inbox, to: "/autopilot/inbox" },
      { label: "Conversations", icon: MessageCircle, to: "/conversations" },
    ],
  },
];

const employeeSections: MenuSection[] = [
  {
    title: "My Work",
    description: "Your tasks, calendar, and reminders",
    items: [
      { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
      { label: "My HR Portal", icon: UserCog, to: "/my-dashboard" },
      { label: "Tasks", icon: ListChecks, to: "/tasks" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Reminders", icon: Clock, to: "/reminders" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
    ],
  },
  {
    title: "CRM",
    description: "Leads, deals, and client management",
    items: [
      { label: "Leads", icon: TargetIcon, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Projects", icon: Briefcase, to: "/projects" },
    ],
  },
  {
    title: "Communication",
    description: "Inbox and conversations",
    items: [
      { label: "Inbox", icon: Inbox, to: "/autopilot/inbox" },
      { label: "Conversations", icon: MessageCircle, to: "/conversations" },
    ],
  },
  {
    title: "Customer Service",
    description: "Support dashboard, tickets, and knowledge base",
    items: [
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard" },
      { label: "Tickets", icon: Ticket, to: "/tickets" },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
      { label: "CSAT Surveys", icon: ThumbsUp, to: "/satisfaction-surveys" },
      { label: "CS Reports", icon: BarChart3, to: "/cs-reports" },
    ],
  },
];

const MorePage = () => {
  const { profile, roles, signOut, isSuperAdmin, isBusinessAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const isManager = hasRole("manager");

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const sections = isSuperAdmin
    ? superAdminSections
    : isBusinessAdmin
    ? tenantAdminSections
    : isManager
    ? managerSections
    : employeeSections;

  return (
    <div className="pb-4 animate-fade-in">
      {/* Profile card */}
      <div className="relative overflow-hidden rounded-lg gradient-primary p-5 mb-6">
        <div className="relative z-10 flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary-foreground/30">
            <AvatarFallback className="text-lg bg-primary-foreground text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-primary-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-primary-foreground/60 truncate">{profile?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="h-3 w-3 text-primary-foreground/80" />
              <p className="text-xs text-primary-foreground/80 capitalize font-medium">
                {roles.join(", ").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department sections */}
      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          <div className="px-1 pb-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
              {section.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{section.description}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {section.items.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg hover:bg-secondary active:bg-secondary/80 transition-colors border border-transparent hover:border-border"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight line-clamp-2">
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
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium text-sm hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default MorePage;
