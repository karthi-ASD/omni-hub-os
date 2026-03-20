import {
  Home, Users, Receipt, Search, BarChart3, Ticket,
  Target, Phone, Settings, Briefcase, Calendar,
  Building2, GitBranch, TrendingUp, Zap, MapPin, Megaphone,
  FolderKanban, FileText, Star, ClipboardList, MessageSquare,
  DollarSign, Handshake, PieChart, PhoneCall, StickyNote,
} from "lucide-react";
import type { NavSection } from "./nav-sections";

export const CLIENT_NAV_SECTIONS: NavSection[] = [
  // ── SECTION A: NextWeb Services (Global – all clients) ──
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
    ],
  },

  // ── SECTION B: My Business CRM (ACE1 Only) ──
  // B-1: Sales CRM
  {
    title: "Sales CRM",
    items: [
      { label: "Leads", icon: Target, to: "/my-crm?tab=leads" },
      { label: "Investors", icon: Users, to: "/my-crm?tab=investors" },
      { label: "Opportunities", icon: FolderKanban, to: "/my-crm?tab=opportunities" },
      { label: "Deal Pipeline", icon: TrendingUp, to: "/my-crm?tab=deal_pipeline" },
    ],
  },
  // B-2: Sales Admin
  {
    title: "Sales Admin",
    items: [
      { label: "Team Performance", icon: Star, to: "/my-crm?tab=portfolio_growth" },
      { label: "Follow-ups", icon: ClipboardList, to: "/my-crm?tab=tasks_followups" },
      { label: "Tasks", icon: Briefcase, to: "/my-crm?tab=executive_dashboard" },
    ],
  },
  // B-3: Accounts
  {
    title: "Accounts",
    items: [
      { label: "Accounts Dashboard", icon: PieChart, to: "/my-crm?tab=reports" },
      { label: "Client Approvals", icon: Handshake, to: "/my-crm?tab=partners" },
      { label: "Payments / Commissions", icon: DollarSign, to: "/my-crm?tab=documents" },
    ],
  },
  // B-4: Communication
  {
    title: "Communication",
    items: [
      { label: "Calls", icon: PhoneCall, to: "/my-crm?tab=communications" },
      { label: "Notes", icon: StickyNote, to: "/my-crm?tab=mobile_app" },
      { label: "Settings", icon: Settings, to: "/my-crm?tab=business_settings" },
    ],
  },
];
