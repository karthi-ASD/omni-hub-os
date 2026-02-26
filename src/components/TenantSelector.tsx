import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export const TenantSelector = () => {
  const { isSuperAdmin, allBusinesses, selectedTenantId, selectTenant } = useAuth();

  if (!isSuperAdmin || allBusinesses.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedTenantId || ""}
        onValueChange={(val) => selectTenant(val || null)}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <SelectValue placeholder="Select tenant" />
        </SelectTrigger>
        <SelectContent>
          {allBusinesses.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name} {b.status !== "active" ? `(${b.status})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
