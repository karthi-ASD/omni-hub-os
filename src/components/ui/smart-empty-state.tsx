import { AlertCircle, Database, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EmptyVariant = "no-data" | "loading-error" | "needs-linking" | "no-results";

interface SmartEmptyStateProps {
  variant?: EmptyVariant;
  entityName?: string;
  onRetry?: () => void;
  className?: string;
}

const config: Record<EmptyVariant, { icon: React.ElementType; title: string; description: string; color: string }> = {
  "no-data": {
    icon: Database,
    title: "No data linked yet",
    description: "Your campaign is getting started. Data will appear here once linked.",
    color: "text-primary",
  },
  "loading-error": {
    icon: AlertCircle,
    title: "Unable to load data",
    description: "Please refresh or contact support if this persists.",
    color: "text-destructive",
  },
  "needs-linking": {
    icon: AlertCircle,
    title: "Data needs linking",
    description: "Some records need to be mapped to a client. Check the admin panel.",
    color: "text-yellow-600",
  },
  "no-results": {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filters.",
    color: "text-muted-foreground",
  },
};

export function SmartEmptyState({ variant = "no-data", entityName, onRetry, className }: SmartEmptyStateProps) {
  const c = config[variant];
  const Icon = c.icon;
  const title = entityName ? c.title.replace("data", entityName) : c.title;

  return (
    <Card className={`rounded-2xl border-0 shadow-sm ${className ?? ""}`}>
      <CardContent className="py-12 text-center">
        <Icon className={`h-8 w-8 mx-auto mb-3 ${c.color}`} />
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-4">{c.description}</p>
        {onRetry && variant === "loading-error" && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <Loader2 className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
