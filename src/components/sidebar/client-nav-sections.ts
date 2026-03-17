import {
  Home, Users, Receipt, Search, BarChart3, Ticket,
  Target, Phone, Settings, Briefcase, Calendar,
  Building2, GitBranch,
} from "lucide-react";
import type { NavSection } from "./nav-sections";

export const CLIENT_NAV_SECTIONS: NavSection[] = [
  {
    title: "My Services",
    items: [
      { label: "Dashboard", icon: Home, to: "/dashboard" },
      { label: "My Package", icon: Briefcase, to: "/my-billing" },
      { label: "Billing & Invoices", icon: Receipt, to: "/my-billing" },
      { label: "SEO Projects", icon: Search, to: "/client-seo-projects" },
      { label: "Reports", icon: BarChart3, to: "/client-reports" },
      { label: "Support Tickets", icon: Ticket, to: "/unified-tickets" },
    ],
  },
  {
    title: "My Business CRM",
    items: [
      { label: "My Leads", icon: Target, to: "/leads" },
      { label: "My Customers", icon: Users, to: "/clients" },
      { label: "My Deals", icon: Building2, to: "/deals" },
      { label: "My Calls", icon: Phone, to: "/calendar" },
      { label: "Departments", icon: Calendar, to: "/client-departments" },
      { label: "My Employees", icon: Users, to: "/client-employees" },
      { label: "My Reports", icon: BarChart3, to: "/reports" },
      { label: "Settings", icon: Settings, to: "/settings" },
    ],
  },
];
