import { StatCard } from "@/components/ui/stat-card";
import { FolderKanban, TrendingUp, Search, Users, DollarSign, Pause, CheckCircle } from "lucide-react";
import type { SeoOverviewStats } from "@/hooks/useSeoOverviewStats";

interface Props {
  stats: SeoOverviewStats;
  loading?: boolean;
}

export function SeoOverviewCards({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="Total Projects"
        value={stats.totalProjects}
        icon={FolderKanban}
        gradient="from-primary to-accent"
        loading={loading}
      />
      <StatCard
        label="Active"
        value={stats.activeProjects}
        icon={TrendingUp}
        gradient="from-success to-emerald-500"
        loading={loading}
      />
      <StatCard
        label="Onboarding"
        value={stats.onboarding}
        icon={Search}
        gradient="from-warning to-orange-500"
        loading={loading}
      />
      <StatCard
        label="Paused"
        value={stats.paused}
        icon={Pause}
        gradient="from-muted-foreground to-muted-foreground"
        loading={loading}
      />
      <StatCard
        label="SEO Clients"
        value={stats.totalClients}
        icon={Users}
        gradient="from-violet-500 to-purple-500"
        loading={loading}
      />
      <StatCard
        label="Monthly Revenue"
        value={`$${stats.monthlyRevenue.toLocaleString()}`}
        icon={DollarSign}
        gradient="from-success to-teal-500"
        loading={loading}
      />
    </div>
  );
}
