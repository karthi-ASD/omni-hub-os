import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { OnboardingStep } from "@/hooks/usePackageOnboarding";

interface Props {
  steps: OnboardingStep[];
  progress: number;
  completedCount: number;
  canEditOnboarding: boolean;
  onUpdateStatus?: (stepId: string, status: OnboardingStep["status"]) => void;
}

const statusIcon = (status: OnboardingStep["status"]) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in_progress": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    default: return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "completed": return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Completed</Badge>;
    case "in_progress": return <Badge className="bg-primary/15 text-primary border-primary/30">In Progress</Badge>;
    default: return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
  }
};

export default function PackageOnboardingProgress({ steps, progress, completedCount, canEditOnboarding, onUpdateStatus }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Setup Progress</h3>
        <span className="text-sm font-medium text-primary">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{completedCount} of {steps.length} steps completed</p>

      <div className="space-y-2 mt-4">
        {steps.map(step => (
          <div key={step.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-3">
              {statusIcon(step.status)}
              <span className={`text-sm ${step.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {step.step_name}
              </span>
            </div>
            {canEditOnboarding && onUpdateStatus ? (
              <Select
                value={step.status}
                onValueChange={(val) => onUpdateStatus(step.id, val as OnboardingStep["status"])}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              statusLabel(step.status)
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
