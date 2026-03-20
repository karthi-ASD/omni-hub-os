import {
  Home, Target, FolderKanban, Users, ClipboardList, Globe, BarChart3,
  Receipt, Briefcase, Mail, Bot, Settings, Shield, Ticket,
  Calendar, Megaphone, Headphones, Building2, FileText, Zap,
  Phone, DollarSign, Wrench, Network, Heart, PieChart, ClipboardCheck,
  Palette, Activity, Layers, UserCog, LogOut, Search, Bell,
  BookOpen, Lock, Cpu, Workflow, Store, Gauge, Brain,
  TrendingUp, Code, FileEdit, PhoneCall, CalendarCheck, Handshake,
  MapPin, RefreshCw, Star, ListChecks, Inbox, Sparkles, Plug, Sun,
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
  // ── NextWeb Master (Super Admin Only) ──
  {
    title: "NextWeb Master",
    items: [
      { label: "Master Dashboard", icon: Gauge, to: "/nextweb-master", roles: ["super_admin"] },
      { label: "All Clients", icon: Building2, to: "/nextweb-clients", roles: ["super_admin"] },
      { label: "Service Requests", icon: Inbox, to: "/admin-service-requests", roles: ["super_admin"] },
    ],
  },
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
      { label: "Client Approvals", icon: Handshake, to: "/lead-conversion-approvals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Payments", icon: DollarSign, to: "/payments" },
      { label: "Renewals", icon: RefreshCw, to: "/renewals" },
      { label: "Recurring Revenue", icon: TrendingUp, to: "/recurring-revenue" },
      { label: "Finance", icon: PieChart, to: "/finance" },
      { label: "Statewide Clients", icon: MapPin, to: "/statewide-clients" },
      { label: "Client Intelligence", icon: Brain, to: "/accounts/client-intelligence-dashboard" },
      { label: "Packages", icon: Layers, to: "/finance/packages" },
      { label: "Reports", icon: BarChart3, to: "/reports" },
    ],
  },
  // ── Sales Department ──
  {
    title: "Sales",
    departments: [...SALES_DEPTS],
    items: [
      { label: "Dashboard", icon: BarChart3, to: "/sales-dashboard" },
      { label: "Prospects", icon: Target, to: "/sales/prospects" },
      { label: "Pipeline", icon: FolderKanban, to: "/sales/pipeline" },
      { label: "Clients", icon: Users, to: "/sales/clients" },
      { label: "Dialer", icon: Phone, to: "/sales/dialer" },
      { label: "My Calls", icon: Headphones, to: "/sales/dialer/my-dashboard" },
      { label: "Team Calls", icon: Users, to: "/sales/dialer/team-dashboard", roles: ["super_admin", "business_admin", "admin", "sales_manager"] },
      { label: "Recordings", icon: Mic, to: "/sales/dialer/recordings" },
      { label: "Call Analytics", icon: BarChart3, to: "/sales/dialer/analytics", roles: ["super_admin", "business_admin", "admin", "sales_manager"] },
      { label: "Proposals", icon: FileText, to: "/sales/proposals" },
      { label: "Activities", icon: PhoneCall, to: "/sales/activities" },
      { label: "Tools", icon: Wrench, to: "/sales/tools" },
    ],
  },
  {
    title: "Sales Admin",
    departments: [...SALES_DEPTS],
    items: [
      { label: "Command Center", icon: Gauge, to: "/sales-command-center", roles: ["super_admin", "business_admin"] },
      { label: "Team Performance", icon: Users, to: "/sales-team-performance", roles: ["super_admin", "business_admin"] },
      { label: "Reports", icon: BarChart3, to: "/reports" },
      { label: "Register Business", icon: Building2, to: "/businesses" },
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
      { label: "Deal Room", icon: FileText, to: "/deal-room" },
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
      { label: "Lead Capture", icon: Target, to: "/seo-lead-capture" },
      { label: "Integrations", icon: Plug, to: "/integrations-overview" },
    ],
  },
  {
    title: "Delivery",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Solar Projects", icon: Sun, to: "/solar-projects" },
      { label: "Solar Dashboard", icon: BarChart3, to: "/solar-dashboard" },
      { label: "Installations", icon: Wrench, to: "/solar-installations" },
      { label: "Tasks", icon: ClipboardList, to: "/tasks" },
      { label: "Website Dev", icon: Globe, to: "/website-dev-stages" },
      { label: "Content Mgmt", icon: FileText, to: "/content-management" },
      { label: "Job CRM", icon: Wrench, to: "/job-crm" },
      { label: "Integrations", icon: Plug, to: "/integrations-overview" },
    ],
  },
  {
    title: "Marketing & SEO",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "SEO Engine", icon: Search, to: "/seo" },
      { label: "SEO Projects", icon: FolderKanban, to: "/seo-ops" },
      { label: "Advocacy Engine", icon: Heart, to: "/advocacy-engine" },
      { label: "Marketing", icon: Megaphone, to: "/marketing" },
      { label: "Ads", icon: BarChart3, to: "/analytics" },
      { label: "Communications", icon: Mail, to: "/communications" },
    ],
  },
  {
    title: "Support",
    hiddenFromDepartments: [...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Ticket Center", icon: Inbox, to: "/unified-tickets" },
      { label: "WhatsApp Support", icon: Phone, to: "/whatsapp-support" },
      { label: "Tickets (Legacy)", icon: Ticket, to: "/tickets" },
      { label: "Internal Tickets", icon: Ticket, to: "/internal-tickets" },
      { label: "CS Dashboard", icon: Headphones, to: "/cs-dashboard", hiddenFromDepartments: SEO_DEPTS },
      { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" },
      { label: "Email Config", icon: Mail, to: "/email-config", roles: ["super_admin", "business_admin"] },
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
      { label: "Daily Insights", icon: Sparkles, to: "/daily-insights" },
      { label: "Internal Broadcast", icon: Megaphone, to: "/internal-broadcast", roles: ["super_admin", "business_admin", "hr_manager"] },
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
  // ── My Business CRM (per-business custom workspace) ──
  {
    title: "My Business CRM",
    items: [
      { label: "CRM Workspace", icon: Briefcase, to: "/my-crm" },
    ],
  },
  {
    title: "Admin",
    hiddenFromDepartments: [...SEO_DEPTS, ...SALES_DEPTS, ...FINANCE_DEPTS],
    items: [
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Users", icon: UserCog, to: "/users" },
      { label: "Roles", icon: Shield, to: "/role-management" },
      { label: "Dept Config", icon: Layers, to: "/department-config", roles: ["super_admin", "business_admin"] },
      { label: "App Modules", icon: Store, to: "/app-module-settings", roles: ["super_admin", "business_admin"] },
      { label: "Customizations", icon: Sparkles, to: "/customization-requests", roles: ["super_admin", "business_admin"] },
      { label: "Setup Wizard", icon: Workflow, to: "/business-onboarding", roles: ["super_admin", "business_admin"] },
      { label: "Audit Logs", icon: Activity, to: "/audit-logs" },
      { label: "SA Tools", icon: Wrench, to: "/super-admin-tools", roles: ["super_admin"] },
      { label: "SA Clients", icon: Users, to: "/super-admin-clients", roles: ["super_admin"] },
      { label: "Business Mgmt", icon: Building2, to: "/business-admin-management", roles: ["super_admin"] },
      { label: "System Health", icon: Activity, to: "/system-health", roles: ["super_admin"] },
      { label: "Integrations", icon: Plug, to: "/integrations-overview", roles: ["super_admin"] },
      { label: "Feature Registry", icon: ClipboardCheck, to: "/feature-registry", roles: ["super_admin"] },
      { label: "Data Integrity", icon: Shield, to: "/client-data-integrity", roles: ["super_admin"] },
    ],
  },
];
