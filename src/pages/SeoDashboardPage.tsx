import { useState } from "react";
import { useSeoOverviewStats } from "@/hooks/useSeoOverviewStats";
import { useSeoProjects } from "@/hooks/useSeoProjects";
import { useClients } from "@/hooks/useClients";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoOverviewCards } from "@/components/seo/SeoOverviewCards";
import { SeoOverviewCharts } from "@/components/seo/SeoOverviewCharts";
import { SeoProjectsTable } from "@/components/seo/SeoProjectsTable";
import { SeoCreateProjectDialog } from "@/components/seo/SeoCreateProjectDialog";
import { Globe, Plus, LayoutDashboard, FolderKanban } from "lucide-react";

const SeoDashboardPage = () => {
  const { stats, loading } = useSeoOverviewStats();
  const { projects, create, updateProject } = useSeoProjects();
  const { clients } = useClients();
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
        title="SEO Command Center"
        subtitle="Unified SEO project management, keywords, rankings & performance"
        icon={Globe}
        actions={[{ label: "New Project", icon: Plus, onClick: () => setCreateOpen(true) }]}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SeoOverviewCards stats={stats} loading={loading} />
          <SeoOverviewCharts stats={stats} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <SeoProjectsTable
            projects={projects}
            loading={loading}
            getClientName={getClientName}
            onStatusChange={(id, status) => updateProject(id, { project_status: status })}
          />
        </TabsContent>
      </Tabs>

      <SeoCreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default SeoDashboardPage;
