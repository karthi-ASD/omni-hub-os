import { useState, useEffect } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftRestoreBannerProps {
  draftKey: string;
  onRestore: (data: any) => void;
  onDiscard?: () => void;
}

export function DraftRestoreBanner({ draftKey, onRestore, onDiscard }: DraftRestoreBannerProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`draft:${draftKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only show if draft has meaningful data (at least one non-empty value)
        const hasData = Object.values(parsed).some(
          (v) => v !== null && v !== undefined && v !== "",
        );
        if (hasData) {
          setDraft(parsed);
          setVisible(true);
        }
      }
    } catch {
      // corrupt draft — ignore
    }
  }, [draftKey]);

  if (!visible) return null;

  const handleRestore = () => {
    onRestore(draft);
    setVisible(false);
  };

  const handleDiscard = () => {
    localStorage.removeItem(`draft:${draftKey}`);
    setVisible(false);
    onDiscard?.();
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">
        You have unsaved changes from a previous session.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={handleRestore} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          Restore
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDiscard} className="h-7 text-xs text-muted-foreground">
          <Trash2 className="h-3 w-3 mr-1" />
          Discard
        </Button>
      </div>
    </div>
  );
}
