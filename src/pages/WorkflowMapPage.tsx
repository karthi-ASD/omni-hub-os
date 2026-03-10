import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  Megaphone, Phone, Users, Briefcase, Building2, ListChecks,
  MessageSquare, CheckCircle, FileBarChart, Brain, Gauge,
  ArrowDown, ChevronRight, Zap
} from "lucide-react";

const stages = [
  {
    id: "lead",
    label: "Lead Generation",
    icon: Megaphone,
    color: "from-blue-500 to-cyan-500",
    description: "Website forms, Google Ads, Facebook Ads, referrals, cold calling",
    route: "/leads",
    details: ["AI lead scoring", "Priority tagging", "Auto-notification to Sales"],
  },
  {
    id: "sales",
    label: "Sales Process",
    icon: Phone,
    color: "from-orange-500 to-amber-500",
    description: "Qualification → Proposal → Negotiation → Deal Closed",
    route: "/deals",
    details: ["AI follow-up reminders", "Call logging", "Pipeline analytics"],
  },
  {
    id: "client",
    label: "Client Creation",
    icon: Users,
    color: "from-emerald-500 to-green-500",
    description: "Deal Won → Auto-create client profile & start onboarding",
    route: "/clients",
    details: ["Auto profile creation", "Account manager assigned", "Onboarding workflow"],
  },
  {
    id: "project",
    label: "Project Creation",
    icon: Briefcase,
    color: "from-violet-500 to-purple-500",
    description: "Project dashboard with tasks, deadlines & SLA tracking",
    route: "/client-projects",
    details: ["Auto task generation", "Department allocation", "SLA tracking"],
  },
  {
    id: "departments",
    label: "Department Allocation",
    icon: Building2,
    color: "from-pink-500 to-rose-500",
    description: "Tasks routed to SEO, Design, Dev, Content, Ads teams",
    route: "/team-hierarchy",
    details: ["Manager → Team hierarchy", "Workload balancing", "Cross-dept requests"],
  },
  {
    id: "tasks",
    label: "Task Execution",
    icon: ListChecks,
    color: "from-sky-500 to-blue-500",
    description: "New → Assigned → In Progress → Review → Completed",
    route: "/task-pipeline",
    details: ["24h SLA timer", "Kanban boards", "Priority & deadlines"],
  },
  {
    id: "collab",
    label: "Collaboration",
    icon: MessageSquare,
    color: "from-teal-500 to-cyan-500",
    description: "Internal team chat (private) + Customer communication (visible)",
    route: "/cross-dept-requests",
    details: ["Ask Customer button", "Ask Ticket Creator", "Internal tickets"],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500",
    description: "Task completed → Auto-notify client, sales & managers",
    route: "/task-pipeline",
    details: ["Auto email notifications", "Project progress update", "Completion logging"],
  },
  {
    id: "reporting",
    label: "Client Reporting",
    icon: FileBarChart,
    color: "from-indigo-500 to-violet-500",
    description: "Monthly SEO reports, milestone reports, performance analytics",
    route: "/reports",
    details: ["Auto-generated reports", "Traffic & ranking data", "Strategy recommendations"],
  },
  {
    id: "ai",
    label: "AI Optimization",
    icon: Brain,
    color: "from-fuchsia-500 to-pink-500",
    description: "AI detects issues, suggests tasks & optimizes operations",
    route: "/autonomous-agents",
    details: ["SEO issue detection", "Workload rebalancing", "Churn risk alerts"],
  },
  {
    id: "command",
    label: "Command Center",
    icon: Gauge,
    color: "from-amber-500 to-orange-500",
    description: "Agency control room with clients, projects, revenue & AI alerts",
    route: "/agency-command",
    details: ["Real-time dashboards", "Department workload", "Revenue analytics"],
  },
];

const WorkflowMapPage = () => {
  const navigate = useNavigate();
  const { stats } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Workflow Map</h1>
        <p className="text-muted-foreground">
          End-to-end flow: Lead → Sale → Project → Departments → Delivery → Reporting
        </p>
      </div>

      {/* Compact summary bar */}
      <div className="flex gap-2 flex-wrap">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted transition-colors text-xs"
              onClick={() => navigate(stage.route)}
            >
              <stage.icon className="h-3 w-3 mr-1" />
              {stage.label}
            </Badge>
            {i < stages.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Flow */}
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <div key={stage.id}>
            <Card
              className="glass-card cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group"
              onClick={() => navigate(stage.route)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <stage.icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Stage {i + 1}
                      </Badge>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {stage.label}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {stage.details.map(d => (
                        <div key={d} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-primary/60" />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-3" />
                </div>
              </CardContent>
            </Card>

            {/* Connector */}
            {i < stages.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-0.5 h-4 bg-border rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowMapPage;
