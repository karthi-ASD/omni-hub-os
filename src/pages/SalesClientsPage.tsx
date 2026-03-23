import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, RefreshCw, Radio, PhoneForwarded } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ClientsPage = lazy(() => import("@/pages/ClientsPage"));
const StatewideClientsPage = lazy(() => import("@/pages/StatewideClientsPage"));
const RenewalsPage = lazy(() => import("@/pages/RenewalsPage"));

import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { CallbacksPanel } from "@/components/crm/CallbacksPanel";

const Loading = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

export default function SalesClientsPage() {
  usePageTitle("Clients");
  const [tab, setTab] = useState("my-clients");
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Clients" subtitle="Manage your client accounts, renewals, and coverage" icon={Users} />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="my-clients" className="gap-1.5"><Users className="h-3.5 w-3.5" />My Clients</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />Client Map</TabsTrigger>
          <TabsTrigger value="renewals" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Renewal Alerts</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><Radio className="h-3.5 w-3.5" />Communications</TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-1.5"><PhoneForwarded className="h-3.5 w-3.5" />Callbacks</TabsTrigger>
        </TabsList>
        <Suspense fallback={<Loading />}>
          <TabsContent value="my-clients"><ClientsPage /></TabsContent>
          <TabsContent value="map"><StatewideClientsPage /></TabsContent>
          <TabsContent value="renewals"><RenewalsPage /></TabsContent>
          <TabsContent value="communications">
            {businessId && <AdminCommunicationDashboard businessId={businessId} />}
          </TabsContent>
          <TabsContent value="callbacks">
            {businessId && <CallbacksPanel businessId={businessId} showAllStatuses />}
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}