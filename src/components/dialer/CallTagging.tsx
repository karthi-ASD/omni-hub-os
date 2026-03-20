import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Thermometer, Snowflake, AlertTriangle } from "lucide-react";
import type { CallTag } from "@/services/dialerService";

interface CallTaggingProps {
  onTag: (tag: CallTag) => void;
  disabled?: boolean;
}

const TAG_CONFIG: { tag: CallTag; label: string; icon: React.ElementType; className: string }[] = [
  { tag: "hot_lead", label: "Hot", icon: Flame, className: "border-red-300 hover:bg-red-50 text-red-700" },
  { tag: "warm_lead", label: "Warm", icon: Thermometer, className: "border-amber-300 hover:bg-amber-50 text-amber-700" },
  { tag: "cold_lead", label: "Cold", icon: Snowflake, className: "border-blue-300 hover:bg-blue-50 text-blue-700" },
  { tag: "spam", label: "Spam", icon: AlertTriangle, className: "border-gray-300 hover:bg-gray-50 text-gray-700" },
];

export function CallTagging({ onTag, disabled }: CallTaggingProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Tag Call</p>
      <div className="flex flex-wrap gap-1.5">
        {TAG_CONFIG.map(({ tag, label, icon: Icon, className }) => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            className={`h-7 text-xs gap-1 ${className}`}
            onClick={() => onTag(tag)}
            disabled={disabled}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
