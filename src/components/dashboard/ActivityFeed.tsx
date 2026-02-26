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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {items.map((item) => {
              const Icon = getIcon(item.source);
              return (
                <div
                  key={`${item.source}-${item.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.event_type.replace(/_/g, " ")}
                    </p>
                    {item.entity_type && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.entity_type}
                        {item.entity_id && ` · ${item.entity_id.slice(0, 8)}…`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getBadgeVariant(item.source)} className="text-[10px]">
                      {item.source}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
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
