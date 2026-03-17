import { Check, Loader2 } from "lucide-react";

interface AutoSaveIndicatorProps {
  isDirty: boolean;
  /** Pass true while the debounce timer is active */
  isSaving?: boolean;
  className?: string;
}

export function AutoSaveIndicator({ isDirty, isSaving, className }: AutoSaveIndicatorProps) {
  if (!isDirty && !isSaving) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground ${className ?? ""}`}>
      {isSaving ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving draft…
        </>
      ) : isDirty ? (
        <>
          <Check className="h-3 w-3 text-primary" />
          Draft saved
        </>
      ) : null}
    </span>
  );
}
