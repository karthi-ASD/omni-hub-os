import { useMemo } from "react";
import { TrendingUp, TrendingDown, Eye, Phone, MapPin, Users, Sparkles } from "lucide-react";

interface NarrativeItem {
  text: string;
  emphasis: string;
  icon: React.ReactNode;
  positive: boolean;
}

interface NarrativeSummaryProps {
  type: "analytics" | "maps";
  metrics: {
    totalViews?: number;
    totalUsers?: number;
    totalSessions?: number;
    totalCalls?: number;
    totalDirections?: number;
    growthPct?: number;
    viewsGrowth?: number;
    latestRating?: number;
    latestReviews?: number;
  };
}

export function NarrativeSummary({ type, metrics }: NarrativeSummaryProps) {
  const items = useMemo(() => {
    const out: NarrativeItem[] = [];

    if (type === "analytics") {
      if (metrics.totalUsers && metrics.totalUsers > 0) {
        out.push({
          text: "Your website was visited by",
          emphasis: `${metrics.totalUsers.toLocaleString()} people`,
          icon: <Users className="h-5 w-5" />,
          positive: true,
        });
      }
      if (metrics.growthPct !== undefined && metrics.growthPct !== 0) {
        out.push({
          text: metrics.growthPct > 0 ? "Traffic grew by" : "Traffic decreased by",
          emphasis: `${metrics.growthPct > 0 ? "+" : ""}${metrics.growthPct.toFixed(1)}%`,
          icon: metrics.growthPct > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
          positive: metrics.growthPct > 0,
        });
      }
      if (metrics.totalSessions && metrics.totalSessions > 0) {
        out.push({
          text: "Total browsing sessions recorded",
          emphasis: metrics.totalSessions.toLocaleString(),
          icon: <Eye className="h-5 w-5" />,
          positive: true,
        });
      }
    }

    if (type === "maps") {
      if (metrics.totalViews && metrics.totalViews > 0) {
        out.push({
          text: "Your business was viewed",
          emphasis: `${metrics.totalViews.toLocaleString()} times`,
          icon: <Eye className="h-5 w-5" />,
          positive: true,
        });
      }
      if (metrics.viewsGrowth !== undefined && metrics.viewsGrowth !== 0) {
        out.push({
          text: metrics.viewsGrowth > 0 ? "Visibility increased by" : "Visibility changed by",
          emphasis: `${metrics.viewsGrowth > 0 ? "+" : ""}${metrics.viewsGrowth.toFixed(1)}%`,
          icon: metrics.viewsGrowth > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
          positive: metrics.viewsGrowth > 0,
        });
      }
      if (metrics.totalCalls && metrics.totalCalls > 0) {
        out.push({
          text: "Customers called your business",
          emphasis: `${metrics.totalCalls} times`,
          icon: <Phone className="h-5 w-5" />,
          positive: true,
        });
      }
      if (metrics.totalDirections && metrics.totalDirections > 0) {
        out.push({
          text: "People requested directions to you",
          emphasis: `${metrics.totalDirections} times`,
          icon: <MapPin className="h-5 w-5" />,
          positive: true,
        });
      }
    }

    return out.slice(0, 3);
  }, [type, metrics]);

  if (items.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl p-4 border transition-all animate-fade-in ${
            item.positive
              ? "bg-primary/5 border-primary/15"
              : "bg-destructive/5 border-destructive/15"
          }`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${item.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground leading-tight">{item.text}</p>
              <p className={`text-xl font-extrabold tracking-tight mt-0.5 ${item.positive ? "text-primary" : "text-destructive"}`}>
                {item.emphasis}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">in the last 30 days</p>
            </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl ${item.positive ? "bg-primary/5" : "bg-destructive/5"}`} />
        </div>
      ))}
    </div>
  );
}
