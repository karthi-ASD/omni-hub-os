import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientSeoProject } from "@/hooks/useClientSeoProject";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ArrowRight, Calendar, MapPin, Ticket, Package } from "lucide-react";
import { toast } from "sonner";
import { createClientPortalTicket } from "@/lib/client-ticket-utils";

const ClientSeoProjectsPage = () => {
  usePageTitle("My SEO Projects");
  const { profile, clientId, user } = useAuth();
  const { projects, loading } = useClientSeoProject();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleRequestProject = async () => {
    if (!clientId || !user?.id || submitting) return;
    try {
      setSubmitting(true);
      await createClientPortalTicket({
        clientId,
        requesterUserId: user.id,
        requesterName: profile?.full_name,
        requesterEmail: profile?.email,
        subject: "New SEO Project Request",
        description: "I would like to request a new SEO project. Please contact me to discuss the scope and goals.",
        department: "seo",
        priority: "medium",
        category: "project_request",
      });
      toast.success("Project request submitted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My SEO Projects</h1>
          <p className="text-sm text-muted-foreground">Track your SEO campaigns and performance.</p>
        </div>
        <Button onClick={handleRequestProject} variant="outline" className="gap-2" disabled={submitting}>
          <Ticket className="h-4 w-4" /> {submitting ? "Submitting ticket..." : "Request New Project"}
        </Button>
      </div>

      {projects.length === 0 ? (
        <ClientPortalEmptyState
          icon={Globe}
          action={<Button onClick={handleRequestProject} disabled={submitting}>{submitting ? "Submitting ticket..." : "Request SEO Project"}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer rounded-2xl border-0 shadow-elevated transition-all hover-lift group"
              onClick={() => navigate(`/client-seo-projects/${project.id}`)}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold transition-colors group-hover:text-primary">{project.project_name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" /> {project.website_domain || "—"}
                    </p>
                  </div>
                  <Badge variant={project.project_status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {project.project_status}
                  </Badge>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {project.service_package || "Standard"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {project.contract_start ? new Date(project.contract_start).toLocaleDateString("en-AU") : "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.target_location || "—"}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                    View Details <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientSeoProjectsPage;
