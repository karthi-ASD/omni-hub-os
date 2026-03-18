import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OnboardingStep } from "@/hooks/usePackageOnboarding";

interface Props {
  steps: OnboardingStep[];
  progress: number;
  completedCount: number;
  isReadOnly: boolean;
  onUpdateStatus?: (stepId: string, status: OnboardingStep["status"]) => void;
}

const statusIcon = (status: OnboardingStep["status"]) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "in_progress": return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    default: return <Circle className="h-5 w-5 text-muted-foreground/40" />;
  }
};

export default function PackageOnboardingProgress({ steps, progress, completedCount, isReadOnly, onUpdateStatus }: Props) {
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
            {!isReadOnly && onUpdateStatus && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
