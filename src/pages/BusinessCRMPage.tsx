import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, Users, Building2, GitBranch, Landmark,
  Network, CheckSquare, MessageSquare, FileText, TrendingUp, BarChart3,
  Zap, Smartphone, Settings, Activity, Target, FolderKanban,
  ClipboardList, DollarSign, PhoneCall, StickyNote, Briefcase, Sun,
} from "lucide-react";

// Real Estate CRM modules
import { ExecutiveDashboardModule } from "@/components/business-crm/ExecutiveDashboardModule";
import { LeadsModule } from "@/components/business-crm/LeadsModule";
import { InvestorsModule } from "@/components/business-crm/InvestorsModule";
import { OpportunitiesModule } from "@/components/business-crm/OpportunitiesModule";
import { DealPipelineModule } from "@/components/business-crm/DealPipelineModule";
import { ProjectsDevelopersModule } from "@/components/business-crm/ProjectsDevelopersModule";
import { PartnersModule } from "@/components/business-crm/PartnersModule";
import { TasksFollowupsModule } from "@/components/business-crm/TasksFollowupsModule";
import { CommunicationsModule } from "@/components/business-crm/CommunicationsModule";
import { DocumentsModule } from "@/components/business-crm/DocumentsModule";
import { PortfolioGrowthModule } from "@/components/business-crm/PortfolioGrowthModule";
import { ReportsModule } from "@/components/business-crm/ReportsModule";
import { AutomationsModule } from "@/components/business-crm/AutomationsModule";
import { MobileAppModule } from "@/components/business-crm/MobileAppModule";
import { BusinessSettingsModule } from "@/components/business-crm/BusinessSettingsModule";

// Service CRM modules
import { ServiceLeadsModule } from "@/components/service-crm/ServiceLeadsModule";
import { ServiceSalesCRMModule } from "@/components/service-crm/ServiceSalesCRMModule";
import { SolarProjectsCRMModule } from "@/components/service-crm/SolarProjectsCRMModule";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, UserPlus, Users, Building2, GitBranch, Landmark,
  Network, CheckSquare, MessageSquare, FileText, TrendingUp, BarChart3,
  Zap, Smartphone, Settings, Activity, Target, FolderKanban,
  ClipboardList, DollarSign, PhoneCall, StickyNote, Briefcase, Sun,
};

const REAL_ESTATE_MODULE_MAP: Record<string, React.FC> = {
  executive_dashboard: ExecutiveDashboardModule,
  leads: LeadsModule,
  investors: InvestorsModule,
  opportunities: OpportunitiesModule,
  deal_pipeline: DealPipelineModule,
  projects_developers: ProjectsDevelopersModule,
  partners: PartnersModule,
  tasks_followups: TasksFollowupsModule,
  communications: CommunicationsModule,
  documents: DocumentsModule,
  portfolio_growth: PortfolioGrowthModule,
  reports: ReportsModule,
  automations: AutomationsModule,
  mobile_app: MobileAppModule,
  business_settings: BusinessSettingsModule,
};

const SERVICE_MODULE_MAP: Record<string, React.FC> = {
  leads: ServiceLeadsModule,
  clients: () => <div className="text-center py-12 text-muted-foreground">Clients module coming soon</div>,
  opportunities: OpportunitiesModule,
  deal_pipeline: DealPipelineModule,
  sales_crm: ServiceSalesCRMModule,
  projects: () => <div className="text-center py-12 text-muted-foreground">Projects module coming soon</div>,
  tasks_followups: TasksFollowupsModule,
  calendar: () => <div className="text-center py-12 text-muted-foreground">Calendar coming soon</div>,
  reports: ReportsModule,
  invoices: () => <div className="text-center py-12 text-muted-foreground">Invoices module coming soon</div>,
  payments: () => <div className="text-center py-12 text-muted-foreground">Payments module coming soon</div>,
  communications: CommunicationsModule,
  notes: () => <div className="text-center py-12 text-muted-foreground">Notes module coming soon</div>,
  business_settings: BusinessSettingsModule,
};

// Dynamic CRM type subtitles
const CRM_SUBTITLES: Record<string, string> = {
  real_estate: "Your dedicated workspace for managing investors, properties, and deals",
  service: "Manage leads, proposals, and service operations",
  finance: "Financial services workspace",
  generic: "Your business workspace",
};

export default function BusinessCRMPage() {
  const { tabs, hasCustomCRM, crmType, isRealEstate, businessName } = useBusinessCRM();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = crmType === "service" ? "leads" : (tabs[0]?.key || "executive_dashboard");
  const activeTab = searchParams.get("tab") || defaultTab;

  if (!hasCustomCRM) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-foreground">No Custom CRM Configured</h2>
          <p className="text-muted-foreground text-sm">Contact your administrator to set up your business CRM workspace.</p>
        </div>
      </div>
    );
  }

  const title = `${businessName} CRM`;
  const subtitle = CRM_SUBTITLES[crmType || "generic"] || CRM_SUBTITLES.generic;

  // Real estate CRM: tab-based rendering from DB config
  if (isRealEstate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
          <TabsList className="bg-card border border-border h-auto flex-wrap gap-1 p-1">
            {tabs.map((tab) => {
              const Icon = ICON_MAP[tab.icon || ""] || Activity;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="gap-1.5 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {tabs.map((tab) => {
            const ModuleComponent = REAL_ESTATE_MODULE_MAP[tab.key];
            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-4">
                {ModuleComponent ? <ModuleComponent /> : (
                  <div className="text-center py-12 text-muted-foreground">Module "{tab.label}" coming soon</div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  }

  // Service CRM: render module directly
  const ModuleComponent = SERVICE_MODULE_MAP[activeTab] || SERVICE_MODULE_MAP.leads;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <ModuleComponent />
    </div>
  );
}
