import { useMemo } from "react";
import { useSeoProjects, SeoProject } from "@/hooks/useSeoProjects";

export interface SeoOverviewStats {
  totalProjects: number;
  activeProjects: number;
  onboarding: number;
  paused: number;
  totalClients: number;
  monthlyRevenue: number;
  totalKeywords: number;
  projectsByStatus: { status: string; count: number }[];
  projectsByPackage: { package: string; count: number }[];
  recentProjects: SeoProject[];
}

export function useSeoOverviewStats() {
  const { projects, loading } = useSeoProjects();

  const stats = useMemo<SeoOverviewStats>(() => {
    const normalize = (s: string) => s.toLowerCase();
    const active = projects.filter(p => normalize(p.project_status) === "active").length;
    const onboarding = projects.filter(p => normalize(p.project_status) === "onboarding").length;
    const paused = projects.filter(p => normalize(p.project_status) === "paused").length;
    const uniqueClients = new Set(projects.filter(p => p.client_id).map(p => p.client_id)).size;
    const revenue = projects.reduce((sum, p: any) => sum + (Number(p.monthly_fee) || 0), 0);

    // Group by status
    const statusMap = new Map<string, number>();
    projects.forEach(p => {
      const s = normalize(p.project_status);
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    });
    const projectsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // Group by package
    const packageMap = new Map<string, number>();
    projects.forEach(p => {
      const pkg = p.service_package || "basic";
      packageMap.set(pkg, (packageMap.get(pkg) || 0) + 1);
    });
    const projectsByPackage = Array.from(packageMap.entries()).map(([pkg, count]) => ({ package: pkg, count }));

    const recentProjects = [...projects].slice(0, 5);

    return {
      totalProjects: projects.length,
      activeProjects: active,
      onboarding,
      paused,
      totalClients: uniqueClients,
      monthlyRevenue: revenue,
      totalKeywords: 0,
      projectsByStatus,
      projectsByPackage,
      recentProjects,
    };
  }, [projects]);

  return { stats, projects, loading };
}
