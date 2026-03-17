import { useNavigate } from "react-router-dom";
import { useClientSeoProject } from "@/hooks/useClientSeoProject";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ArrowRight, Calendar, MapPin, Ticket, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ClientSeoProjectsPage = () => {
  usePageTitle("My SEO Projects");
  const { profile, clientId } = useAuth();
  const { projects, loading } = useClientSeoProject();
  const navigate = useNavigate();

  const handleRequestProject = async () => {
    if (!profile?.business_id || !clientId) return;
    const { error } = await supabase.from("support_tickets").insert({
      business_id: profile.business_id,
      client_id: clientId,
      subject: "New SEO Project Request",
      description: "I would like to request a new SEO project. Please contact me to discuss.",
      department: "SEO",
      status: "open",
      priority: "medium",
      source: "client_portal",
    } as any);
    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Project request submitted! Our SEO team will contact you.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My SEO Projects</h1>
          <p className="text-sm text-muted-foreground">Track your SEO campaigns and performance</p>
        </div>
        <Button onClick={handleRequestProject} variant="outline" className="gap-1">
          <Ticket className="h-4 w-4" /> Request New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-16 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No SEO projects yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Your SEO projects will appear here once your campaign starts
            </p>
            <Button onClick={handleRequestProject} variant="outline">
              <Ticket className="h-4 w-4 mr-1" /> Request SEO Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="rounded-2xl border-0 shadow-elevated hover-lift transition-all cursor-pointer group"
              onClick={() => navigate(`/client-seo-projects/${p.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base group-hover:text-primary transition-colors">{p.project_name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Globe className="h-3 w-3" /> {p.website_domain || "—"}
                    </p>
                  </div>
                  <Badge variant={p.project_status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {p.project_status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {p.service_package || "Standard"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.contract_start ? new Date(p.contract_start).toLocaleDateString("en-AU") : "—"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.target_location || "—"}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:underline">
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
