import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SeoProject } from "@/hooks/useSeoProjects";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  onboarding: "bg-warning/10 text-warning",
  paused: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

interface Props {
  projects: SeoProject[];
  loading: boolean;
  getClientName: (id: string | null) => string;
  onStatusChange: (id: string, status: string) => void;
}

export function SeoProjectsTable({ projects, loading, getClientName, onStatusChange }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardContent className="py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No SEO projects yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Create your first project to get started</p>
        </CardContent>
      </Card>
    );
  }

  const normalize = (s: string) => s.toLowerCase();

  return (
    <Card className="rounded-2xl border-0 shadow-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Project</TableHead>
            <TableHead className="font-semibold">Domain</TableHead>
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Package</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map(p => {
            const status = normalize(p.project_status);
            return (
              <TableRow
                key={p.id}
                className="cursor-pointer group"
                onClick={() => navigate(`/seo/${p.id}`)}
              >
                <TableCell className="font-medium">{p.project_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-foreground">{p.website_domain}</span>
                  </div>
                </TableCell>
                <TableCell>{getClientName(p.client_id)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">{p.service_package}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.target_location || "—"}</TableCell>
                <TableCell>
                  <Badge className={statusColors[status] || ""} variant="secondary">{status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    {status === "onboarding" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(p.id, "active")}>Activate</Button>
                    )}
                    {status === "active" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(p.id, "paused")}>Pause</Button>
                    )}
                    {status === "paused" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange(p.id, "active")}>Resume</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(`/seo/${p.id}`)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
