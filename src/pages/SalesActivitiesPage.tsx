import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Phone, MessageSquare, FileText, PhoneForwarded, Radio } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ColdCallingPage = lazy(() => import("@/pages/ColdCallingPage"));
const ConversationsPage = lazy(() => import("@/pages/ConversationsPage"));

import { CommunicationTimeline } from "@/components/crm/CommunicationTimeline";
import { CallbacksPanel } from "@/components/crm/CallbacksPanel";
import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { Card, CardContent } from "@/components/ui/card";

function NotesTab() {
  return (
    <Card>
      <CardContent className="p-6 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">CRM notes and AI-generated summaries will appear here.</p>
        <p className="text-xs mt-1">Notes are automatically captured from lead and client interactions.</p>
      </CardContent>
    </Card>
  );
}

const Loading = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

export default function SalesActivitiesPage() {
  usePageTitle("Activities");
  const [tab, setTab] = useState("calls");
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Activities" subtitle="All your sales interactions in one place" icon={Activity} />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="calls" className="gap-1.5"><Phone className="h-3.5 w-3.5" />Calls</TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Conversations</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><Radio className="h-3.5 w-3.5" />Communication Log</TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-1.5"><PhoneForwarded className="h-3.5 w-3.5" />Callbacks</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Notes</TabsTrigger>
        </TabsList>
        <Suspense fallback={<Loading />}>
          <TabsContent value="calls"><ColdCallingPage /></TabsContent>
          <TabsContent value="conversations"><ConversationsPage /></TabsContent>
          <TabsContent value="communications">
            {businessId && <AdminCommunicationDashboard businessId={businessId} />}
          </TabsContent>
          <TabsContent value="callbacks">
            {businessId && <CallbacksPanel businessId={businessId} showAllStatuses />}
          </TabsContent>
          <TabsContent value="notes"><NotesTab /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}