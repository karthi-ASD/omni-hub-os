import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Bot, Search, BookOpen } from "lucide-react";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AISalesAssistantPage = lazy(() => import("@/pages/AISalesAssistantPage"));
const SalesSeoPitchPage = lazy(() => import("@/pages/SalesSeoPitchPage"));
const SalesKnowledgeBasePage = lazy(() => import("@/pages/SalesKnowledgeBasePage"));

const Loading = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
  </div>
);

export default function SalesToolsPage() {
  usePageTitle("Sales Tools");
  const [tab, setTab] = useState("ai-assistant");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sales Tools" subtitle="AI-powered utilities to boost your sales performance" icon={Wrench} />
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="ai-assistant" className="gap-1.5"><Bot className="h-3.5 w-3.5" />AI Assistant</TabsTrigger>
          <TabsTrigger value="seo-intel" className="gap-1.5"><Search className="h-3.5 w-3.5" />SEO Intel</TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Knowledge Center</TabsTrigger>
        </TabsList>
        <Suspense fallback={<Loading />}>
          <TabsContent value="ai-assistant"><AISalesAssistantPage /></TabsContent>
          <TabsContent value="seo-intel"><SalesSeoPitchPage /></TabsContent>
          <TabsContent value="knowledge"><SalesKnowledgeBasePage /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
