import {
  Home, Users, Receipt, Search, BarChart3, Ticket,
  Target, Phone, Settings, Briefcase, Calendar,
  Building2, GitBranch, TrendingUp, Zap, MapPin, Megaphone,
  FolderKanban, FileText, Star, ClipboardList, MessageSquare,
  DollarSign, Handshake, PieChart, PhoneCall, StickyNote,
  Headphones, Globe, Send, Sun, Wrench,
  LayoutDashboard, Filter, MapPinned, UserCheck, Banknote,
  Shield, Inbox, HeadphonesIcon,
} from "lucide-react";
import type { NavSection } from "./nav-sections";
import type { CRMType } from "@/hooks/useBusinessCRM";

// ══════════════════════════════════════════════════════════════
// SECTION A: NextWeb Services (Global – identical for ALL clients)
// ══════════════════════════════════════════════════════════════
export const NEXTWEB_SERVICES_SECTIONS: NavSection[] = [
  {
    title: "NextWeb Services",
    items: [
      { label: "Dashboard", icon: Home, to: "/dashboard" },
      { label: "Performance Intelligence", icon: Zap, to: "/client-performance-intelligence" },
      { label: "My Package", icon: Briefcase, to: "/my-package" },
      { label: "Billing & Invoices", icon: Receipt, to: "/my-billing" },
      { label: "SEO Projects", icon: Search, to: "/client-seo-projects" },
      { label: "Reports", icon: BarChart3, to: "/client-reports" },
      { label: "Support Tickets", icon: Ticket, to: "/unified-tickets" },
      { label: "Website Intelligence", icon: GitBranch, to: "/client-website-structure" },
      { label: "Local Presence", icon: MapPin, to: "/client-local-presence" },
      { label: "Lead Dashboard", icon: Megaphone, to: "/client-leads-dashboard" },
      { label: "NextWeb Services", icon: Headphones, to: "/nextweb-services" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// SECTION B: Business CRM Sections (per CRM type)
// ══════════════════════════════════════════════════════════════

// ── ACE1 Command Centre (Real Estate Investment Advisory) ──
const REAL_ESTATE_CRM_SECTIONS: NavSection[] = [
  {
    title: "Command Centre",
    items: [
      { label: "Executive Dashboard", icon: LayoutDashboard, to: "/my-crm?tab=executive_dashboard" },
    ],
  },
  {
    title: "Lead Management",
    items: [
      { label: "Lead Engine", icon: Target, to: "/my-crm?tab=leads" },
      { label: "Qualification Desk", icon: Filter, to: "/my-crm?tab=qualification_desk" },
      { label: "Property Matching", icon: MapPinned, to: "/my-crm?tab=property_matching" },
    ],
  },
  {
    title: "Investor Relations",
    items: [
      { label: "Investors & Clients", icon: Users, to: "/my-crm?tab=investors" },
      { label: "Opportunities & Pipeline", icon: FolderKanban, to: "/my-crm?tab=opportunities" },
      { label: "Deal Management", icon: Handshake, to: "/my-crm?tab=deal_pipeline" },
      { label: "Property Inventory", icon: Building2, to: "/my-crm?tab=property_inventory" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Accounts & Commissions", icon: Banknote, to: "/my-crm?tab=accounts_commissions" },
      { label: "HR & Team Management", icon: UserCheck, to: "/my-crm?tab=hr_team" },
      { label: "Tasks & Follow-Ups", icon: ClipboardList, to: "/my-crm?tab=tasks_followups" },
      { label: "Communication Hub", icon: MessageSquare, to: "/my-crm?tab=communications" },
    ],
  },
  {
    title: "Support & Insights",
    items: [
      { label: "Client Portal Management", icon: Shield, to: "/my-crm?tab=client_portal_mgmt" },
      { label: "Ticketing & Support", icon: Inbox, to: "/my-crm?tab=ticketing_support" },
      { label: "Reports & Insights", icon: PieChart, to: "/my-crm?tab=reports" },
      { label: "Settings", icon: Settings, to: "/my-crm?tab=business_settings" },
    ],
  },
];

// Service business CRM (Green Ultimate and similar)
const SERVICE_CRM_SECTIONS: NavSection[] = [
  {
    title: "Leads",
    items: [
      { label: "All Leads", icon: Target, to: "/my-crm?tab=leads" },
      { label: "Sales CRM", icon: FolderKanban, to: "/my-crm?tab=sales_crm" },
      { label: "Opportunities", icon: TrendingUp, to: "/my-crm?tab=opportunities" },
      { label: "Deal Pipeline", icon: GitBranch, to: "/my-crm?tab=deal_pipeline" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Projects", icon: Briefcase, to: "/my-crm?tab=projects" },
      { label: "Solar Projects", icon: Sun, to: "/solar-projects" },
      { label: "Solar Dashboard", icon: BarChart3, to: "/solar-dashboard" },
      { label: "Installations", icon: Wrench, to: "/solar-installations" },
      { label: "Tasks", icon: ClipboardList, to: "/my-crm?tab=tasks_followups" },
      { label: "Calendar", icon: Calendar, to: "/my-crm?tab=calendar" },
    ],
  },
  {
    title: "Accounts",
    items: [
      { label: "Dashboard", icon: PieChart, to: "/my-crm?tab=reports" },
      { label: "Invoices", icon: Receipt, to: "/my-crm?tab=invoices" },
      { label: "Payments", icon: DollarSign, to: "/my-crm?tab=payments" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Calls", icon: PhoneCall, to: "/my-crm?tab=communications" },
      { label: "Notes", icon: StickyNote, to: "/my-crm?tab=notes" },
      { label: "Settings", icon: Settings, to: "/my-crm?tab=business_settings" },
    ],
  },
];

// Finance CRM (future)
const FINANCE_CRM_SECTIONS: NavSection[] = [];

// Generic fallback
const GENERIC_CRM_SECTIONS: NavSection[] = [];

// ══════════════════════════════════════════════════════════════
// CRM Type → Sections Map
// ══════════════════════════════════════════════════════════════
const CRM_SECTIONS_MAP: Record<CRMType, NavSection[]> = {
  real_estate: REAL_ESTATE_CRM_SECTIONS,
  service: SERVICE_CRM_SECTIONS,
  finance: FINANCE_CRM_SECTIONS,
  generic: GENERIC_CRM_SECTIONS,
};

/**
 * Get the CRM heading label for a given CRM type.
 * Real estate uses "Command Centre", others use "Business CRM".
 */
export function getCRMHeading(crmType: CRMType | null, businessName?: string): string {
  if (crmType === "real_estate") {
    return `${businessName || "My"} Command Centre`;
  }
  return "My Business CRM";
}

/**
 * Get CRM sidebar sections for a given CRM type.
 * Returns empty array if type is unknown.
 */
export function getCRMSections(crmType: CRMType | null): NavSection[] {
  if (!crmType) return [];
  return CRM_SECTIONS_MAP[crmType] || [];
}

// Legacy export for backward compat (defaults to real_estate)
export const BUSINESS_CRM_SECTIONS = REAL_ESTATE_CRM_SECTIONS;
