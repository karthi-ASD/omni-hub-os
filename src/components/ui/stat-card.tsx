import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  alert?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label, value, icon: Icon, gradient = "from-primary to-accent",
  trend, trendLabel, subtitle, loading, className, alert, onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border-0 shadow-elevated hover-lift transition-all duration-300",
        alert && "ring-1 ring-destructive/20",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 relative z-10">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center shadow-glow-sm group-hover:scale-110 transition-transform",
                `bg-gradient-to-br ${gradient}`,
              )}>
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mb-1">{value}</p>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend >= 0 ? "text-success" : "text-destructive",
              )}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}% {trendLabel || "vs last month"}
              </div>
            )}
            {subtitle && !trend && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300",
        gradient,
      )} />
    </Card>
  );
}
