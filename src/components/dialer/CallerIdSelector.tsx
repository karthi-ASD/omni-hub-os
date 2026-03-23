import { useMyCallerIds } from "@/hooks/useAgentCallerIds";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, AlertTriangle } from "lucide-react";

interface CallerIdSelectorProps {
  selectedCallerId: string;
  onSelect: (callerId: string) => void;
  disabled?: boolean;
}

export function CallerIdSelector({ selectedCallerId, onSelect, disabled }: CallerIdSelectorProps) {
  const { data: callerIds = [], isLoading } = useMyCallerIds();

  console.log("AVAILABLE_NUMBERS:", callerIds.map((c) => c.plivo_number));
  console.log("CALLER_ID_SELECTED:", selectedCallerId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Phone className="h-3 w-3 animate-pulse" />
        Loading caller ID...
      </div>
    );
  }

  if (callerIds.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>❌ No outgoing number assigned. Contact admin.</span>
      </div>
    );
  }

  // Auto-select default if nothing selected
  if (!selectedCallerId && callerIds.length > 0) {
    const defaultId = callerIds.find((c) => c.is_default) || callerIds[0];
    setTimeout(() => onSelect(defaultId.plivo_number), 0);
  }

  if (callerIds.length === 1) {
    const cid = callerIds[0];
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted text-xs">
        <Phone className="h-3 w-3 text-emerald-600" />
        <span className="font-medium">{cid.label}</span>
        <Badge variant="outline" className="text-[10px] font-mono">{cid.plivo_number}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        <Phone className="h-3 w-3" /> Caller ID
      </label>
      <Select value={selectedCallerId} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select caller ID" />
        </SelectTrigger>
        <SelectContent>
          {callerIds.map((cid) => (
            <SelectItem key={cid.id} value={cid.plivo_number} className="text-xs">
              {cid.label} ({cid.plivo_number})
              {cid.is_default && <Badge variant="secondary" className="ml-1 text-[9px]">Default</Badge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
