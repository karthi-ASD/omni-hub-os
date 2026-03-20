import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";

export const TenantSelector = () => {
  const { isSuperAdmin, allBusinesses, selectedTenantId, selectTenant } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleTenantChange = useCallback((val: string) => {
    if (!val) return;

    // Clear all cached queries to prevent stale data from previous tenant
    queryClient.clear();

    selectTenant(val);

    const businessName = allBusinesses.find(b => b.id === val)?.name || "Tenant";
    toast.success(`Switched to ${businessName}`);

    // Redirect to dashboard
    navigate("/dashboard");
  }, [queryClient, selectTenant, allBusinesses, navigate]);

  if (!isSuperAdmin || allBusinesses.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedTenantId || ""}
        onValueChange={handleTenantChange}
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
