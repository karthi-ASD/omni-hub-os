import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Brain, CalendarCheck, Handshake, Search } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LeadsPage = lazy(() => import("@/pages/LeadsPage"));
const LeadIntelligencePage = lazy(() => import("@/pages/LeadIntelligencePage"));
const SalesFollowUpsPage = lazy(() => import("@/pages/SalesFollowUpsPage"));
const LeadConversionApprovalsPage = lazy(() => import("@/pages/LeadConversionApprovalsPage"));
const ProspectFinderPage = lazy(() => import("@/pages/ProspectFinderPage"));

const Loading = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

export default function SalesProspectsPage() {
  usePageTitle("Prospects");
  const [tab, setTab] = useState("all");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Prospects" subtitle="Manage all your leads and prospects in one place" icon={Target} />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="all" className="gap-1.5"><Target className="h-3.5 w-3.5" />All Prospects</TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-1.5"><Brain className="h-3.5 w-3.5" />Lead Intelligence</TabsTrigger>
          <TabsTrigger value="followups" className="gap-1.5"><CalendarCheck className="h-3.5 w-3.5" />Follow-Ups</TabsTrigger>
          <TabsTrigger value="conversions" className="gap-1.5"><Handshake className="h-3.5 w-3.5" />Conversion Requests</TabsTrigger>
          <TabsTrigger value="finder" className="gap-1.5"><Search className="h-3.5 w-3.5" />Prospect Finder</TabsTrigger>
        </TabsList>
        <Suspense fallback={<Loading />}>
          <TabsContent value="all"><LeadsPage /></TabsContent>
          <TabsContent value="intelligence"><LeadIntelligencePage /></TabsContent>
          <TabsContent value="followups"><SalesFollowUpsPage /></TabsContent>
          <TabsContent value="conversions"><LeadConversionApprovalsPage /></TabsContent>
          <TabsContent value="finder"><ProspectFinderPage /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
