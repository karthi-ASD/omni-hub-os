import {
  Home, Target, FolderKanban, Users, ClipboardList, Globe, BarChart3,
  Receipt, Briefcase, Mail, Bot, Settings, Shield, Ticket,
  Calendar, Megaphone, Headphones, Building2, FileText, Zap,
  Phone, DollarSign, Wrench, Network, Heart, PieChart,
  Palette, Activity, Layers, UserCog, LogOut, Search, Bell,
  BookOpen, Lock, Cpu, Workflow, Store, Gauge, Brain,
  TrendingUp, Code, FileEdit,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  roles?: string[];
  /** departments that can see this item (if set, only these depts see it) */
  departments?: string[];
  /** if true, hidden from listed departments */
  hiddenFromDepartments?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
  /** only show this section to these departments */
  departments?: string[];
  /** hide this section from these departments */
  hiddenFromDepartments?: string[];
}

const SEO_DEPTS = ["seo", "seo department", "digital marketing"];
const FINANCE_DEPTS = ["finance", "accounts", "accounting"];

export const NAV_SECTIONS: NavSection[] = [
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
    hiddenFromDepartments: SEO_DEPTS,
    items: [
      { label: "Inquiries", icon: Mail, to: "/inquiries" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Proposals", icon: FileText, to: "/proposals" },
      { label: "Contracts", icon: FileText, to: "/contracts" },
      { label: "SEO Intel (Sales)", icon: Search, to: "/sales-seo-intel" },
    ],
  },
  {
    title: "SEO Operations",
    departments: [...SEO_DEPTS],
    items: [
      { label: "SEO Dashboard", icon: Gauge, to: "/seo-team" },
      { label: "Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "SEO Engine", icon: Search, to: "/seo" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Client Reports", icon: BarChart3, to: "/seo-client-reports" },
      { label: "Dev Requests", icon: Code, to: "/internal-tickets?dept=development" },
      { label: "Content Requests", icon: FileEdit, to: "/internal-tickets?dept=content" },
    ],
  },
  {
    title: "Delivery",
    hiddenFromDepartments: SEO_DEPTS,
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
    hiddenFromDepartments: SEO_DEPTS,
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
      { label: "Internal Tickets", icon: Ticket, to: "/internal-tickets" },
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard", hiddenFromDepartments: SEO_DEPTS },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
    ],
  },
  {
    title: "Finance",
    hiddenFromDepartments: SEO_DEPTS,
    items: [
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: DollarSign, to: "/payments" },
      { label: "Finance", icon: PieChart, to: "/finance" },
    ],
  },
  {
    title: "HR & Team",
    items: [
      { label: "Team Members", icon: Users, to: "/hr/employees" },
      { label: "Departments", icon: Building2, to: "/hr/departments" },
      { label: "Leave", icon: Calendar, to: "/hr/leave" },
      { label: "Payroll", icon: DollarSign, to: "/hr/payroll", hiddenFromDepartments: SEO_DEPTS },
    ],
  },
  {
    title: "AI & Automation",
    hiddenFromDepartments: SEO_DEPTS,
    items: [
      { label: "AI Brain", icon: Brain, to: "/ai-brain" },
      { label: "AI Agents", icon: Bot, to: "/ai-agents" },
      { label: "Automation", icon: Zap, to: "/workflow-automation" },
      { label: "Autopilot", icon: Cpu, to: "/autopilot/inbox" },
    ],
  },
  {
    title: "Admin",
    hiddenFromDepartments: SEO_DEPTS,
    items: [
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Users", icon: UserCog, to: "/users" },
      { label: "Roles", icon: Shield, to: "/role-management" },
      { label: "Audit Logs", icon: Activity, to: "/audit-logs" },
      { label: "SA Tools", icon: Wrench, to: "/super-admin-tools", roles: ["super_admin"] },
    ],
  },
];
