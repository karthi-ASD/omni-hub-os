import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed() {
  const { items, loading } = useActivityFeed(15);

  const getIcon = (source: string) =>
    source === "audit" ? Shield : Activity;

  const getBadgeVariant = (source: string) =>
    source === "audit" ? "secondary" : "outline";

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
            {items.map((item) => {
              const Icon = getIcon(item.source);
              return (
                <div
                  key={`${item.source}-${item.id}`}
                  className="flex items-center gap-3 py-2.5 px-2.5 rounded-lg hover:bg-muted/40 transition-all duration-200 group"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.event_type.replace(/_/g, " ")}
                    </p>
                    {item.entity_type && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.entity_type}
                        {item.entity_id && ` · ${item.entity_id.slice(0, 8)}…`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getBadgeVariant(item.source)} className="text-[9px] font-semibold rounded-md">
                      {item.source}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
