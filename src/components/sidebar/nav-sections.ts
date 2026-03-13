import {
  Home, Target, FolderKanban, Users, ClipboardList, Globe, BarChart3,
  Receipt, Briefcase, Mail, Bot, Settings, Shield, Ticket,
  Calendar, Megaphone, Headphones, Building2, FileText, Zap,
  Phone, DollarSign, Wrench, Network, Heart, PieChart,
  Palette, Activity, Layers, UserCog, LogOut, Search, Bell,
  BookOpen, Lock, Cpu, Workflow, Store, Gauge, Brain,
  TrendingUp, Code, FileEdit, PhoneCall, CalendarCheck, Handshake,
  MapPin, RefreshCw, Star, ListChecks,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  roles?: string[];
  departments?: string[];
  hiddenFromDepartments?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
  departments?: string[];
  hiddenFromDepartments?: string[];
}

const SEO_DEPTS = ["seo", "seo department", "digital marketing"];
const SALES_DEPTS = ["sales", "sales department", "business development"];
const FINANCE_DEPTS = ["finance", "accounts", "accounting"];

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", icon: Home, to: "/dashboard" },
      { label: "Executive View", icon: BarChart3, to: "/executive-dashboard", roles: ["super_admin", "business_admin"] },
      { label: "Team", icon: Users, to: "/team-directory" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
    ],
  },
  // ── Accounts / Finance Department ──
  {
    title: "Accounts",
    departments: [...FINANCE_DEPTS],
    items: [
      { label: "Accounts Dashboard", icon: PieChart, to: "/accounts-dashboard" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: DollarSign, to: "/payments" },
      { label: "Renewals", icon: RefreshCw, to: "/renewals" },
      { label: "Finance", icon: PieChart, to: "/finance" },
      { label: "Statewide Clients", icon: MapPin, to: "/statewide-clients" },
      { label: "Client Intelligence", icon: Brain, to: "/accounts/client-intelligence-dashboard" },
      { label: "Reports", icon: BarChart3, to: "/reports" },
    ],
  },
  // ── Sales Department ──
  {
    title: "Sales Operations",
    departments: [...SALES_DEPTS],
    items: [
      { label: "Sales Dashboard", icon: BarChart3, to: "/sales-dashboard" },
      { label: "Cold Calling", icon: PhoneCall, to: "/cold-calling" },
      { label: "AI Assistant", icon: Bot, to: "/ai-sales-assistant" },
      { label: "Prospect Finder", icon: Search, to: "/prospect-finder" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Follow-Ups", icon: CalendarCheck, to: "/sales-follow-ups" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Opportunities", icon: TrendingUp, to: "/sales-opportunities" },
      { label: "My Clients", icon: Users, to: "/clients" },
      { label: "Renewal Alerts", icon: RefreshCw, to: "/renewals" },
      { label: "SEO Intel (Sales)", icon: Search, to: "/sales-seo-intel" },
      { label: "Statewide Clients", icon: MapPin, to: "/statewide-clients" },
      { label: "Knowledge Center", icon: BookOpen, to: "/sales-knowledge" },
      { label: "Register Business", icon: Building2, to: "/businesses" },
      { label: "Reports", icon: BarChart3, to: "/reports" },
      { label: "Team Performance", icon: Users, to: "/sales-team-performance" },
      { label: "Tickets", icon: Ticket, to: "/internal-tickets" },
    ],
  },
  {
    title: "Sales & CRM",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
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
  // ── SEO Department ──
  {
    title: "SEO Operations",
    departments: [...SEO_DEPTS],
    items: [
      { label: "SEO Dashboard", icon: Gauge, to: "/seo-team" },
      { label: "Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "SEO Engine", icon: Search, to: "/seo" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Statewide Clients", icon: MapPin, to: "/statewide-clients" },
      { label: "Client Reports", icon: BarChart3, to: "/seo-client-reports" },
      { label: "Dev Requests", icon: Code, to: "/internal-tickets?dept=development" },
      { label: "Content Requests", icon: FileEdit, to: "/internal-tickets?dept=content" },
    ],
  },
  {
    title: "Delivery",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
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
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
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
    hiddenFromDepartments: [...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Tickets", icon: Ticket, to: "/tickets" },
      { label: "Internal Tickets", icon: Ticket, to: "/internal-tickets" },
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard", hiddenFromDepartments: SEO_DEPTS },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
    ],
  },
  {
    title: "Finance & Accounts",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: DollarSign, to: "/payments" },
      { label: "Finance", icon: PieChart, to: "/finance" },
      { label: "Renewals", icon: RefreshCw, to: "/renewals" },
      { label: "Statewide Clients", icon: MapPin, to: "/statewide-clients" },
    ],
  },
  {
    title: "HR & Team",
    items: [
      { label: "HR Dashboard", icon: Gauge, to: "/hr/analytics", roles: ["super_admin", "business_admin", "hr_manager"] },
      { label: "Employees", icon: Users, to: "/hr/employees" },
      { label: "Departments", icon: Building2, to: "/hr/departments" },
      { label: "Org Chart", icon: Network, to: "/hr/org-chart" },
      { label: "Leave Mgmt", icon: Calendar, to: "/hr/leave" },
      { label: "Attendance", icon: CalendarCheck, to: "/hr/attendance", roles: ["super_admin", "business_admin", "hr_manager", "manager"] },
      { label: "Payroll", icon: DollarSign, to: "/hr/payroll", hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS] },
      { label: "Performance", icon: Star, to: "/hr/performance", roles: ["super_admin", "business_admin", "hr_manager"] },
      { label: "HR Tasks", icon: ListChecks, to: "/hr/tasks", roles: ["super_admin", "business_admin", "hr_manager"] },
      { label: "Activity Logs", icon: Activity, to: "/audit-logs", roles: ["super_admin", "business_admin", "hr_manager"] },
    ],
  },
  {
    title: "AI & Automation",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "AI Brain", icon: Brain, to: "/ai-brain" },
      { label: "AI Agents", icon: Bot, to: "/ai-agents" },
      { label: "Automation", icon: Zap, to: "/workflow-automation" },
      { label: "Autopilot", icon: Cpu, to: "/autopilot/inbox" },
    ],
  },
  {
    title: "Admin",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Users", icon: UserCog, to: "/users" },
      { label: "Roles", icon: Shield, to: "/role-management" },
      { label: "Audit Logs", icon: Activity, to: "/audit-logs" },
      { label: "SA Tools", icon: Wrench, to: "/super-admin-tools", roles: ["super_admin"] },
    ],
  },
];
