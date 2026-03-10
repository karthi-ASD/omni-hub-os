import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, Phone, Users, Briefcase, Building2, ListChecks,
  MessageSquare, CheckCircle, FileBarChart, Brain, Gauge,
  ChevronRight, Zap, Receipt, Ticket, Heart, RefreshCcw, Clock,
  FileText, Shield, Bell,
} from "lucide-react";

const stages = [
  {
    id: "lead", label: "1 · Lead Generation", icon: Megaphone,
    color: "from-blue-500 to-cyan-500", route: "/leads",
    description: "Website forms, Google Ads, Facebook Ads, referrals, cold calling, walk-ins",
    details: ["AI lead scoring", "Priority tagging", "Auto-notify Sales"],
  },
  {
    id: "sales", label: "2 · Sales Process", icon: Phone,
    color: "from-orange-500 to-amber-500", route: "/deals",
    description: "Qualification → Proposal → Negotiation → Contract → Deal Closed",
    details: ["AI follow-ups", "Call logging", "Pipeline analytics"],
  },
  {
    id: "client", label: "3 · Client Creation", icon: Users,
    color: "from-emerald-500 to-green-500", route: "/clients",
    description: "Deal Won → Auto-create client, account manager, portal access",
    details: ["Auto profile", "Account manager", "Portal access"],
  },
  {
    id: "onboarding", label: "4 · Customer Onboarding", icon: Clock,
    color: "from-teal-500 to-emerald-500", route: "/client-projects",
    description: "Hosting details, domain access, Google access, design assets collection",
    details: ["Onboarding checklist", "Department assignment", "Deadline tracking"],
  },
  {
    id: "project", label: "5 · Project Creation", icon: Briefcase,
    color: "from-violet-500 to-purple-500", route: "/client-projects",
    description: "Project dashboard with tasks, deadlines, departments & SLA tracking",
    details: ["Auto task generation", "Multi-department", "SLA tracking"],
  },
  {
    id: "departments", label: "6 · Department Allocation", icon: Building2,
    color: "from-pink-500 to-rose-500", route: "/team-hierarchy",
    description: "Tasks routed to SEO, Design, Dev, Content, Ads, Accounts teams",
    details: ["Manager hierarchy", "Workload balance", "Cross-dept requests"],
  },
  {
    id: "delivery", label: "7 · Service Delivery", icon: ListChecks,
    color: "from-sky-500 to-blue-500", route: "/task-pipeline",
    description: "New → Assigned → In Progress → Review → Completed (24h SLA)",
    details: ["Kanban boards", "SLA timer", "Department workflows"],
  },
  {
    id: "collab", label: "8 · Collaboration", icon: MessageSquare,
    color: "from-teal-500 to-cyan-500", route: "/cross-dept-requests",
    description: "Internal team chat (private) + Customer communication (visible)",
    details: ["Ask Customer", "Ask Ticket Creator", "Internal tickets"],
  },
  {
    id: "support", label: "9 · Customer Support", icon: Ticket,
    color: "from-amber-500 to-yellow-500", route: "/tickets",
    description: "Multi-channel tickets: portal, email, calls, mobile app",
    details: ["Call-based tickets", "SLA escalation", "Resolution workflow"],
  },
  {
    id: "billing", label: "10 · Billing & Revenue", icon: Receipt,
    color: "from-green-500 to-emerald-500", route: "/billing",
    description: "Invoices, payment tracking, subscriptions, renewal alerts",
    details: ["Invoice generation", "Payment status", "Revenue tracking"],
  },
  {
    id: "completion", label: "11 · Project Completion", icon: CheckCircle,
    color: "from-lime-500 to-green-500", route: "/task-pipeline",
    description: "Task completed → Auto-notify client, sales & managers via email",
    details: ["Completion logging", "Auto notifications", "Progress update"],
  },
  {
    id: "satisfaction", label: "12 · Customer Satisfaction", icon: Heart,
    color: "from-rose-500 to-pink-500", route: "/satisfaction-surveys",
    description: "CSAT/NPS surveys after ticket closure & project completion",
    details: ["Rating capture", "Feedback analysis", "Satisfaction scores"],
  },
  {
    id: "reporting", label: "13 · Reporting & Analytics", icon: FileBarChart,
    color: "from-indigo-500 to-violet-500", route: "/reports",
    description: "Sales, revenue, department productivity, customer satisfaction",
    details: ["Monthly reports", "Performance analytics", "Conversion rates"],
  },
  {
    id: "renewals", label: "14 · Renewals & Upsells", icon: RefreshCcw,
    color: "from-cyan-500 to-blue-500", route: "/deals",
    description: "Contract expiry alerts, upsell opportunities, cross-sell suggestions",
    details: ["Expiry tracking", "Upsell detection", "Revenue growth"],
  },
  {
    id: "timeline", label: "15 · Account Timeline", icon: Shield,
    color: "from-slate-500 to-gray-500", route: "/account-timeline",
    description: "Single source of truth: calls, deals, tasks, tickets, invoices, notes",
    details: ["Unified history", "Module filtering", "Audit trail"],
  },
  {
    id: "ai", label: "16 · AI Optimization", icon: Brain,
    color: "from-fuchsia-500 to-pink-500", route: "/autonomous-agents",
    description: "AI detects delays, churn risk, workload imbalance & suggests actions",
    details: ["SEO issue detection", "Workload rebalancing", "Churn alerts"],
  },
];

const WorkflowMapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mega Agency Workflow Map</h1>
        <p className="text-muted-foreground">
          Complete lifecycle: Lead → Sale → Onboard → Deliver → Support → Bill → Renew → Report
        </p>
      </div>

      {/* Compact nav bar */}
      <div className="flex gap-1.5 flex-wrap">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-0.5">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted transition-colors text-[10px] px-1.5 py-0.5"
              onClick={() => navigate(stage.route)}
            >
              <stage.icon className="h-3 w-3 mr-0.5" />
              {stage.label.split(" · ")[1]}
            </Badge>
            {i < stages.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Flow */}
      <div className="space-y-1.5">
        {stages.map((stage, i) => (
          <div key={stage.id}>
            <Card
              className="glass-card cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group"
              onClick={() => navigate(stage.route)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <stage.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{stage.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {stage.details.map(d => (
                        <div key={d} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Zap className="h-2.5 w-2.5 text-primary/60" /> {d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                </div>
              </CardContent>
            </Card>
            {i < stages.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-0.5 h-3 bg-border rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowMapPage;
