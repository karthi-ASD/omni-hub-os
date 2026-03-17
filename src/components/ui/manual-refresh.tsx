import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ManualRefreshProps {
  onRefresh: () => void | Promise<void>;
  lastUpdated?: Date | null;
  className?: string;
}

export function ManualRefresh({ onRefresh, lastUpdated, className }: ManualRefreshProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className ?? ""}`}>
      {lastUpdated && (
        <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClick} title="Refresh data">
        <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
