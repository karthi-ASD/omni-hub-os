import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface FeatureEntry {
  name: string;
  module: string;
  route: string;
  description: string;
  edgeFunction?: string;
  lastUpdated: string;
}

const FEATURE_REGISTRY: FeatureEntry[] = [
  // Core
  { name: "Dashboard", module: "Core", route: "/dashboard", description: "Main user dashboard with widgets and stats", lastUpdated: "2026-03-01" },
  { name: "Executive Dashboard", module: "Core", route: "/executive-dashboard", description: "High-level business metrics for admins", lastUpdated: "2026-03-01" },
  { name: "Team Directory", module: "Core", route: "/team-directory", description: "View all team members", lastUpdated: "2026-03-01" },
  { name: "Calendar", module: "Core", route: "/calendar", description: "Shared calendar with events", lastUpdated: "2026-03-01" },
  { name: "Notifications", module: "Core", route: "/notifications", description: "User notification center", lastUpdated: "2026-03-01" },

  // Sales & CRM
  { name: "Inquiries", module: "Sales & CRM", route: "/inquiries", description: "Incoming business inquiries", edgeFunction: "public-inquiry, website-lead-capture", lastUpdated: "2026-03-10" },
  { name: "Leads Pipeline", module: "Sales & CRM", route: "/leads", description: "Sales lead management and tracking", lastUpdated: "2026-03-10" },
  { name: "Deals Pipeline", module: "Sales & CRM", route: "/deals", description: "Deal stage management board", lastUpdated: "2026-03-10" },
  { name: "Deal Room", module: "Sales & CRM", route: "/deal-room", description: "Collaborative deal workspace", lastUpdated: "2026-03-10" },
  { name: "Proposals", module: "Sales & CRM", route: "/proposals", description: "Create and manage proposals", lastUpdated: "2026-03-10" },
  { name: "Contracts", module: "Sales & CRM", route: "/contracts", description: "Contract management", lastUpdated: "2026-03-10" },
  { name: "Sales Dashboard", module: "Sales", route: "/sales-dashboard", description: "Sales team performance dashboard", lastUpdated: "2026-03-10" },
  { name: "Sales Prospects", module: "Sales", route: "/sales/prospects", description: "Prospect management for sales dept", lastUpdated: "2026-03-10" },
  { name: "Sales Pipeline", module: "Sales", route: "/sales/pipeline", description: "Sales dept pipeline board", lastUpdated: "2026-03-10" },
  { name: "Sales Activities", module: "Sales", route: "/sales/activities", description: "Sales activity tracking", lastUpdated: "2026-03-10" },
  { name: "Sales Command Center", module: "Sales Admin", route: "/sales-command-center", description: "Admin view of sales operations", lastUpdated: "2026-03-10" },

  // Clients
  { name: "Clients", module: "Clients", route: "/clients", description: "Client list and management", lastUpdated: "2026-03-15" },
  { name: "Client Approvals", module: "Accounts", route: "/lead-conversion-approvals", description: "Approve lead-to-client conversions", lastUpdated: "2026-03-15" },
  { name: "Client Intelligence", module: "Accounts", route: "/accounts/client-intelligence-dashboard", description: "AI-powered client insights", edgeFunction: "ai-client-risk-assessment", lastUpdated: "2026-03-15" },
  { name: "Statewide Clients", module: "Accounts", route: "/statewide-clients", description: "Clients organized by state/location", lastUpdated: "2026-03-15" },

  // Super Admin Client Management
  { name: "SA Client Management", module: "Super Admin", route: "/super-admin-clients", description: "Super Admin client lifecycle management (edit, delete, merge)", edgeFunction: "super-admin-client-ops", lastUpdated: "2026-03-17" },
  { name: "Reset Client Password", module: "Super Admin", route: "/super-admin-clients", description: "Allows Super Admin to manually reset client login passwords", edgeFunction: "reset-client-password", lastUpdated: "2026-03-17" },
  { name: "Update Client Email", module: "Super Admin", route: "/super-admin-clients", description: "Change client email across auth and profile", edgeFunction: "update-client-email", lastUpdated: "2026-03-17" },
  { name: "Login As Client", module: "Super Admin", route: "/super-admin-clients", description: "Impersonate a client account for support", edgeFunction: "login-as-client", lastUpdated: "2026-03-17" },

  // Finance & Accounts
  { name: "Accounts Dashboard", module: "Accounts", route: "/accounts-dashboard", description: "Finance department overview", lastUpdated: "2026-03-10" },
  { name: "Invoices", module: "Finance", route: "/invoices", description: "Invoice creation and tracking", lastUpdated: "2026-03-10" },
  { name: "Payments", module: "Finance", route: "/payments", description: "Payment tracking and reconciliation", lastUpdated: "2026-03-10" },
  { name: "Renewals", module: "Finance", route: "/renewals", description: "Service renewal management", lastUpdated: "2026-03-10" },
  { name: "Recurring Revenue", module: "Finance", route: "/recurring-revenue", description: "MRR/ARR tracking dashboard", lastUpdated: "2026-03-10" },
  { name: "Finance Overview", module: "Finance", route: "/finance", description: "Financial overview and P&L", lastUpdated: "2026-03-10" },
  { name: "Xero Sync", module: "Finance", route: "/invoices", description: "Sync invoices, payments and contacts from Xero", edgeFunction: "xero-sync", lastUpdated: "2026-03-12" },

  // SEO
  { name: "SEO Dashboard", module: "SEO", route: "/seo-team", description: "SEO team operational dashboard", lastUpdated: "2026-03-10" },
  { name: "SEO Projects", module: "SEO", route: "/seo-ops", description: "SEO project management", lastUpdated: "2026-03-10" },
  { name: "SEO Engine", module: "SEO", route: "/seo", description: "SEO audit, keyword research, and optimization tools", edgeFunction: "seo-domain-analyze, seo-competitor-fetch, seo-automations", lastUpdated: "2026-03-10" },
  { name: "SEO Client Reports", module: "SEO", route: "/seo-client-reports", description: "Generate and manage SEO reports for clients", edgeFunction: "seo-monthly-reports", lastUpdated: "2026-03-10" },
  { name: "GSC Sync", module: "SEO", route: "/seo", description: "Google Search Console data synchronization", edgeFunction: "seo-gsc-sync", lastUpdated: "2026-03-10" },

  // Delivery
  { name: "Projects", module: "Delivery", route: "/projects", description: "Project management and tracking", lastUpdated: "2026-03-01" },
  { name: "Tasks", module: "Delivery", route: "/tasks", description: "Task management board", lastUpdated: "2026-03-01" },
  { name: "Website Dev Stages", module: "Delivery", route: "/website-dev-stages", description: "Website development stage tracking", lastUpdated: "2026-03-01" },
  { name: "Content Management", module: "Delivery", route: "/content-management", description: "Content creation and publishing", lastUpdated: "2026-03-01" },
  { name: "Job CRM", module: "Delivery", route: "/job-crm", description: "Job/service request management", edgeFunction: "job-notifications", lastUpdated: "2026-03-01" },

  // Support
  { name: "Unified Ticket Center", module: "Support", route: "/unified-tickets", description: "Centralized ticket management", edgeFunction: "ticket-ai-classify, ticket-auto-reply, ticket-notifications", lastUpdated: "2026-03-10" },
  { name: "Internal Tickets", module: "Support", route: "/internal-tickets", description: "Internal team ticket system", lastUpdated: "2026-03-10" },
  { name: "CS Dashboard", module: "Support", route: "/cs-dashboard", description: "Customer success metrics", lastUpdated: "2026-03-10" },
  { name: "Knowledge Base", module: "Support", route: "/knowledge-base", description: "Self-service knowledge articles", lastUpdated: "2026-03-10" },
  { name: "Email Config", module: "Support", route: "/email-config", description: "Email inbox configuration for tickets", edgeFunction: "poll-email-inboxes, inbound-email, ticket-email-processor", lastUpdated: "2026-03-10" },

  // HR
  { name: "HR Analytics Dashboard", module: "HR", route: "/hr/analytics", description: "HR performance metrics and analytics", lastUpdated: "2026-03-05" },
  { name: "Employees", module: "HR", route: "/hr/employees", description: "Employee directory and management", lastUpdated: "2026-03-05" },
  { name: "Departments", module: "HR", route: "/hr/departments", description: "Department structure management", lastUpdated: "2026-03-05" },
  { name: "Org Chart", module: "HR", route: "/hr/org-chart", description: "Organization hierarchy visualization", lastUpdated: "2026-03-05" },
  { name: "Leave Management", module: "HR", route: "/hr/leave", description: "Leave requests and approval", lastUpdated: "2026-03-05" },
  { name: "Attendance", module: "HR", route: "/hr/attendance", description: "Employee attendance tracking", lastUpdated: "2026-03-05" },
  { name: "Payroll", module: "HR", route: "/hr/payroll", description: "Payroll processing and management", lastUpdated: "2026-03-05" },
  { name: "Performance", module: "HR", route: "/hr/performance", description: "Employee performance reviews", lastUpdated: "2026-03-05" },
  { name: "Daily Insights", module: "HR", route: "/daily-insights", description: "Daily team productivity insights", lastUpdated: "2026-03-05" },
  { name: "Internal Broadcast", module: "HR", route: "/internal-broadcast", description: "Company-wide announcements", lastUpdated: "2026-03-05" },

  // AI & Automation
  { name: "AI Brain", module: "AI", route: "/ai-brain", description: "Central AI knowledge and training hub", lastUpdated: "2026-03-08" },
  { name: "AI Agents", module: "AI", route: "/ai-agents", description: "Conversational AI agents for chat and voice", edgeFunction: "ai-chatbot, ai-engine, ai-sales-assistant", lastUpdated: "2026-03-08" },
  { name: "Workflow Automation", module: "AI", route: "/workflow-automation", description: "No-code workflow automation builder", lastUpdated: "2026-03-08" },
  { name: "Autopilot Inbox", module: "AI", route: "/autopilot/inbox", description: "AI-managed autonomous task inbox", lastUpdated: "2026-03-08" },
  { name: "AI Finance Forecast", module: "AI", route: "/finance", description: "AI-powered financial forecasting", edgeFunction: "ai-finance-forecast", lastUpdated: "2026-03-08" },
  { name: "AI Report Generator", module: "AI", route: "/reports", description: "AI-generated business reports", edgeFunction: "ai-report-generator", lastUpdated: "2026-03-08" },

  // Marketing
  { name: "Advocacy Engine", module: "Marketing", route: "/advocacy-engine", description: "Customer advocacy and referral campaigns", lastUpdated: "2026-03-01" },
  { name: "Marketing Hub", module: "Marketing", route: "/marketing", description: "Marketing campaign management", lastUpdated: "2026-03-01" },
  { name: "Ads Analytics", module: "Marketing", route: "/analytics", description: "Ad campaign performance tracking", edgeFunction: "ads-sync", lastUpdated: "2026-03-01" },
  { name: "Communications", module: "Marketing", route: "/communications", description: "Multi-channel communication center", edgeFunction: "send-sms, whatsapp-send-message", lastUpdated: "2026-03-01" },

  // WhatsApp & Comms
  { name: "WhatsApp Automation", module: "Communications", route: "/communications", description: "WhatsApp message automation", edgeFunction: "whatsapp-automation, whatsapp-incoming-webhook, whatsapp-send-message, whatsapp-test-send", lastUpdated: "2026-03-10" },
  { name: "SMS / OTP", module: "Communications", route: "/communications", description: "SMS sending and OTP verification", edgeFunction: "send-sms, send-otp", lastUpdated: "2026-03-10" },
  { name: "Voice Agent", module: "Communications", route: "/communications", description: "AI voice agent for calls", edgeFunction: "process-voice-agent-queue, plivo-answer, plivo-callback, plivo-ai-response", lastUpdated: "2026-03-10" },

  // Admin
  { name: "Settings", module: "Admin", route: "/settings", description: "System and business settings", lastUpdated: "2026-03-01" },
  { name: "User Management", module: "Admin", route: "/users", description: "User accounts and permissions", lastUpdated: "2026-03-01" },
  { name: "Role Management", module: "Admin", route: "/role-management", description: "Role definitions and access control", lastUpdated: "2026-03-01" },
  { name: "Department Config", module: "Admin", route: "/department-config", description: "Department structure configuration", lastUpdated: "2026-03-01" },
  { name: "App Module Settings", module: "Admin", route: "/app-module-settings", description: "Enable/disable app modules", lastUpdated: "2026-03-01" },
  { name: "Business Onboarding Wizard", module: "Admin", route: "/business-onboarding", description: "Guided setup for new businesses", lastUpdated: "2026-03-01" },
  { name: "Audit Logs", module: "Admin", route: "/audit-logs", description: "System-wide activity audit trail", lastUpdated: "2026-03-01" },
  { name: "SA Tools", module: "Super Admin", route: "/super-admin-tools", description: "Super Admin diagnostic tools", lastUpdated: "2026-03-01" },
  { name: "Business Admin Management", module: "Super Admin", route: "/business-admin-management", description: "Manage tenant organizations", lastUpdated: "2026-03-01" },
  { name: "System Health", module: "Super Admin", route: "/system-health", description: "Platform health monitoring dashboard", lastUpdated: "2026-03-01" },
  { name: "Feature Registry", module: "Super Admin", route: "/feature-registry", description: "Central directory of all system features and routes", lastUpdated: "2026-03-17" },

  // Edge functions without direct UI
  { name: "Create Business Account", module: "Backend", route: "-", description: "Edge function to register new business tenants", edgeFunction: "create-business-account", lastUpdated: "2026-03-01" },
  { name: "Create Client Auth", module: "Backend", route: "-", description: "Create auth account for a client", edgeFunction: "create-client-auth", lastUpdated: "2026-03-10" },
  { name: "Client Self Register", module: "Backend", route: "-", description: "Public client self-registration endpoint", edgeFunction: "client-self-register", lastUpdated: "2026-03-10" },
  { name: "Webhook Router", module: "Backend", route: "-", description: "Central webhook routing for external integrations", edgeFunction: "webhook-router", lastUpdated: "2026-03-10" },
  { name: "Process Reminders", module: "Backend", route: "-", description: "Scheduled reminder processing", edgeFunction: "process-reminders", lastUpdated: "2026-03-10" },
  { name: "Domain Expiry Check", module: "Backend", route: "-", description: "Check client domain expiry dates", edgeFunction: "check-domain-expiry", lastUpdated: "2026-03-10" },
  { name: "Hosting Alerts", module: "Backend", route: "-", description: "Monitor hosting health and alerts", edgeFunction: "check-hosting-alerts", lastUpdated: "2026-03-10" },
];

const MODULE_COLORS: Record<string, string> = {
  "Core": "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Sales & CRM": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Sales": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Sales Admin": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "Clients": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Accounts": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Finance": "bg-green-500/10 text-green-700 dark:text-green-300",
  "SEO": "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "Delivery": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "Support": "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "HR": "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  "AI": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Marketing": "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "Communications": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Admin": "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  "Super Admin": "bg-red-500/10 text-red-700 dark:text-red-300",
  "Backend": "bg-gray-500/10 text-gray-700 dark:text-gray-300",
};

export default function FeatureRegistryPage() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");

  const modules = useMemo(() => ["All", ...Array.from(new Set(FEATURE_REGISTRY.map(f => f.module))).sort()], []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return FEATURE_REGISTRY.filter(f => {
      if (moduleFilter !== "All" && f.module !== moduleFilter) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.route.includes(q) || (f.edgeFunction?.toLowerCase().includes(q));
    });
  }, [search, moduleFilter]);

  if (!isSuperAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied.</div>;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Central directory of all {FEATURE_REGISTRY.length} system features, modules, routes and edge functions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features, routes, edge functions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modules.map(m => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                moduleFilter === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Feature Name</TableHead>
              <TableHead className="min-w-[100px]">Module</TableHead>
              <TableHead className="min-w-[180px]">Route URL</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="min-w-[180px]">Edge Function / API</TableHead>
              <TableHead className="min-w-[110px]">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-foreground">{f.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={MODULE_COLORS[f.module] || ""}>
                    {f.module}
                  </Badge>
                </TableCell>
                <TableCell>
                  {f.route !== "-" ? (
                    <button
                      onClick={() => navigate(f.route)}
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      {f.route}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.description}</TableCell>
                <TableCell>
                  {f.edgeFunction ? (
                    <div className="flex flex-wrap gap-1">
                      {f.edgeFunction.split(", ").map(fn => (
                        <Badge key={fn} variant="outline" className="text-xs font-mono">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.lastUpdated}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No features found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
