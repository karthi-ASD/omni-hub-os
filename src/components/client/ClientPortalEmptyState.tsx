import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Sparkles } from "lucide-react";

interface ClientPortalEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ClientPortalEmptyState({
  icon: Icon = Sparkles,
  title = "Your campaign is getting started",
  message = "Your campaign is getting started. Data will appear soon.",
  action,
  className,
}: ClientPortalEmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
