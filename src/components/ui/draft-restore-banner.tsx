import { useState, useEffect } from "react";
import { AlertTriangle, RotateCcw, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const DRAFT_EXPIRY_MS = 48 * 60 * 60 * 1000;

interface DraftRestoreBannerProps {
  draftKey: string;
  onRestore: (data: any) => void;
  onDiscard?: () => void;
}

export function DraftRestoreBanner({ draftKey, onRestore, onDiscard }: DraftRestoreBannerProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [age, setAge] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`draft:${draftKey}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Support envelope format
      const data = parsed?.data ?? parsed;
      const updatedAt = parsed?.updatedAt ?? null;

      // Expiry check
      if (updatedAt && Date.now() - updatedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(`draft:${draftKey}`);
        return;
      }

      // Validate meaningful data
      if (!data || typeof data !== "object") return;
      const hasData = Object.values(data).some(
        (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
      );
      if (!hasData) return;

      setDraft(data);
      setAge(updatedAt ? formatDistanceToNow(updatedAt, { addSuffix: true }) : "");
      setVisible(true);
    } catch {
      localStorage.removeItem(`draft:${draftKey}`);
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
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">You have unsaved changes from a previous session.</p>
        {age && <p className="text-[10px] text-muted-foreground">Saved {age}</p>}
      </div>
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

/** Banner shown when another tab saved a newer version */
interface CrossTabConflictBannerProps {
  visible: boolean;
  onAcceptRemote: () => void;
  onKeepCurrent: () => void;
}

export function CrossTabConflictBanner({ visible, onAcceptRemote, onKeepCurrent }: CrossTabConflictBannerProps) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <RefreshCw className="h-4 w-4 text-yellow-600 shrink-0" />
      <p className="text-sm text-foreground flex-1">Newer changes found from another session.</p>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={onAcceptRemote} className="h-7 text-xs">Use latest</Button>
        <Button size="sm" variant="ghost" onClick={onKeepCurrent} className="h-7 text-xs text-muted-foreground">Keep current</Button>
      </div>
    </div>
  );
}
