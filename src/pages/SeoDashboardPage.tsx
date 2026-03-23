import { useState } from "react";
import { useSeoOverviewStats } from "@/hooks/useSeoOverviewStats";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useAllClientsDropdown } from "@/hooks/useAllClientsDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoOverviewCards } from "@/components/seo/SeoOverviewCards";
import { SeoOverviewCharts } from "@/components/seo/SeoOverviewCharts";
import { SeoProjectsTable } from "@/components/seo/SeoProjectsTable";
import { SeoCreateProjectDialog } from "@/components/seo/SeoCreateProjectDialog";
import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { CallbacksPanel } from "@/components/crm/CallbacksPanel";
import { Globe, Plus, LayoutDashboard, FolderKanban, Radio, PhoneForwarded } from "lucide-react";

const SeoDashboardPage = () => {
  const { stats, loading } = useSeoOverviewStats();
  const { projects, create, updateProject } = useSeoProjects();
  const { clients } = useAllClientsDropdown();
  const { profile } = useAuth();
  const businessId = profile?.business_id;
  const [createOpen, setCreateOpen] = useState(false);

  const getClientName = (id: string | null) => {
    if (!id) return "—";
    return clients.find(c => c.id === id)?.contact_name || "Unknown";
  };

  const handleCreate = async (form: Parameters<typeof create>[0]) => {
    await create(form);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SEO Dashboard"
        subtitle="Overview of all SEO campaigns and performance"
        icon={Globe}
        actions={[{ label: "New Project", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5"><FolderKanban className="h-3.5 w-3.5" />Projects</TabsTrigger>
          <TabsTrigger value="communications" className="gap-1.5"><Radio className="h-3.5 w-3.5" />Communications</TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-1.5"><PhoneForwarded className="h-3.5 w-3.5" />Callbacks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SeoOverviewCards stats={stats} loading={loading} />
          <SeoOverviewCharts stats={stats} />
        </TabsContent>

        <TabsContent value="projects">
          <SeoProjectsTable
            projects={projects}
            loading={false}
            getClientName={getClientName}
            onStatusChange={(id, status) => updateProject(id, { project_status: status })}
          />
        </TabsContent>

        <TabsContent value="communications">
          {businessId && <AdminCommunicationDashboard businessId={businessId} />}
        </TabsContent>

        <TabsContent value="callbacks">
          {businessId && <CallbacksPanel businessId={businessId} showAllStatuses />}
        </TabsContent>
      </Tabs>

      <SeoCreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default SeoDashboardPage;
