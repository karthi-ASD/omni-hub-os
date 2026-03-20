import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, Users, Building2, GitBranch, Landmark,
  Network, CheckSquare, MessageSquare, FileText, TrendingUp, BarChart3,
  Zap, Smartphone, Settings, Activity, Target, FolderKanban,
  ClipboardList, DollarSign, PhoneCall, StickyNote, Briefcase, Sun,
  Filter, MapPinned, Handshake, Banknote, UserCheck, Shield, Inbox, PieChart,
} from "lucide-react";

// Real Estate / ACE1 Command Centre modules
import { ACE1ExecutiveDashboard } from "@/components/business-crm/ACE1ExecutiveDashboard";
import { LeadsModule } from "@/components/business-crm/LeadsModule";
import { QualificationDeskModule } from "@/components/business-crm/QualificationDeskModule";
import { PropertyMatchingModule } from "@/components/business-crm/PropertyMatchingModule";
import { InvestorsModule } from "@/components/business-crm/InvestorsModule";
import { OpportunitiesModule } from "@/components/business-crm/OpportunitiesModule";
import { DealPipelineModule } from "@/components/business-crm/DealPipelineModule";
import { PropertyInventoryModule } from "@/components/business-crm/PropertyInventoryModule";
import { ProjectsDevelopersModule } from "@/components/business-crm/ProjectsDevelopersModule";
import { AccountsCommissionsModule } from "@/components/business-crm/AccountsCommissionsModule";
import { HRTeamModule } from "@/components/business-crm/HRTeamModule";
import { TasksFollowupsModule } from "@/components/business-crm/TasksFollowupsModule";
import { CommunicationsModule } from "@/components/business-crm/CommunicationsModule";
import { ClientPortalMgmtModule } from "@/components/business-crm/ClientPortalMgmtModule";
import { TicketingSupportModule } from "@/components/business-crm/TicketingSupportModule";
import { ReportsModule } from "@/components/business-crm/ReportsModule";
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
  Filter, MapPinned, Handshake, Banknote, UserCheck, Shield, Inbox, PieChart,
};

// ACE1 Command Centre module map (16 modules)
const REAL_ESTATE_MODULE_MAP: Record<string, React.FC> = {
  executive_dashboard: ACE1ExecutiveDashboard,
  leads: LeadsModule,
  qualification_desk: QualificationDeskModule,
  property_matching: PropertyMatchingModule,
  investors: InvestorsModule,
  opportunities: OpportunitiesModule,
  deal_pipeline: DealPipelineModule,
  property_inventory: PropertyInventoryModule,
  projects_developers: ProjectsDevelopersModule,
  accounts_commissions: AccountsCommissionsModule,
  hr_team: HRTeamModule,
  tasks_followups: TasksFollowupsModule,
  communications: CommunicationsModule,
  client_portal_mgmt: ClientPortalMgmtModule,
  ticketing_support: TicketingSupportModule,
  reports: ReportsModule,
  business_settings: BusinessSettingsModule,
};

const SERVICE_MODULE_MAP: Record<string, React.FC> = {
  leads: ServiceLeadsModule,
  clients: () => <div className="text-center py-12 text-muted-foreground">Clients module coming soon</div>,
  opportunities: OpportunitiesModule,
  deal_pipeline: DealPipelineModule,
  sales_crm: ServiceSalesCRMModule,
  projects: SolarProjectsCRMModule,
  tasks_followups: TasksFollowupsModule,
  calendar: () => <div className="text-center py-12 text-muted-foreground">Calendar coming soon</div>,
  reports: ReportsModule,
  invoices: () => <div className="text-center py-12 text-muted-foreground">Invoices module coming soon</div>,
  payments: () => <div className="text-center py-12 text-muted-foreground">Payments module coming soon</div>,
  communications: CommunicationsModule,
  notes: () => <div className="text-center py-12 text-muted-foreground">Notes module coming soon</div>,
  business_settings: BusinessSettingsModule,
};

const CRM_SUBTITLES: Record<string, string> = {
  real_estate: "Property Investment Command System",
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

  const title = isRealEstate ? `${businessName} Command Centre` : `${businessName} CRM`;
  const subtitle = CRM_SUBTITLES[crmType || "generic"] || CRM_SUBTITLES.generic;

  // Real estate: direct module rendering via sidebar (no tab bar)
  if (isRealEstate) {
    const ModuleComponent = REAL_ESTATE_MODULE_MAP[activeTab] || ACE1ExecutiveDashboard;
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

  // Service CRM
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
