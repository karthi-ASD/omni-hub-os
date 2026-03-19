import { useState, useEffect } from "react";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorPipelineModule } from "@/components/business-crm/InvestorPipelineModule";
import { PropertyPortfolioModule } from "@/components/business-crm/PropertyPortfolioModule";
import { DealsModule } from "@/components/business-crm/DealsModule";
import { PartnerNetworkModule } from "@/components/business-crm/PartnerNetworkModule";
import { ActivityFeedModule } from "@/components/business-crm/ActivityFeedModule";
import { CRMSettingsModule } from "@/components/business-crm/CRMSettingsModule";
import { useSearchParams } from "react-router-dom";
import {
  Users, Building2, Handshake, Network, Activity, Settings,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Building2, Handshake, Network, Activity, Settings,
};

const MODULE_MAP: Record<string, React.FC> = {
  investor_pipeline: InvestorPipelineModule,
  properties: PropertyPortfolioModule,
  deals: DealsModule,
  partners: PartnerNetworkModule,
  activities: ActivityFeedModule,
  settings: CRMSettingsModule,
};

export default function BusinessCRMPage() {
  const { tabs, hasCustomCRM } = useBusinessCRM();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || tabs[0]?.key || "investor_pipeline";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">My Business CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Your dedicated workspace for managing investors, properties, and deals</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setSearchParams({ tab: v })}
        className="w-full"
      >
        <TabsList className="bg-card border border-border h-auto flex-wrap gap-1 p-1">
          {tabs.map((tab) => {
            const Icon = ICON_MAP[tab.icon || ""] || Activity;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="gap-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const ModuleComponent = MODULE_MAP[tab.key];
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
