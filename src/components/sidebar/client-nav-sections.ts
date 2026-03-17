import {
  Home, Users, Receipt, Search, BarChart3, Globe, Ticket,
  FileText, FolderKanban, Target, Phone, Star, Settings,
  Building2, Briefcase, DollarSign, Calendar, Headphones,
  ClipboardList, UserCog, Heart,
} from "lucide-react";
import type { NavItem, NavSection } from "./nav-sections";

/**
 * Navigation sections shown to client portal users.
 * Section 1: My NextWeb Services (what the service provider delivers)
 * Section 2: My Business CRM (the client's own CRM)
 */
export const CLIENT_NAV_SECTIONS: NavSection[] = [
  {
    title: "My Services",
    items: [
      { label: "Dashboard", icon: Home, to: "/dashboard" },
      { label: "My Package", icon: Briefcase, to: "/my-billing" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "SEO Projects", icon: Search, to: "/seo" },
      { label: "Reports", icon: BarChart3, to: "/client-reports" },
      { label: "Support Tickets", icon: Ticket, to: "/unified-tickets" },
      { label: "Files", icon: FileText, to: "/projects" },
    ],
  },
  {
    title: "My Business CRM",
    items: [
      { label: "My Leads", icon: Target, to: "/leads" },
      { label: "My Customers", icon: Users, to: "/clients" },
      { label: "My Deals", icon: FolderKanban, to: "/deals" },
      { label: "My Calls", icon: Phone, to: "/calendar" },
      { label: "My Employees", icon: Users, to: "/hr/employees" },
      { label: "My Reports", icon: BarChart3, to: "/reports" },
      { label: "Settings", icon: Settings, to: "/settings" },
    ],
  },
];
