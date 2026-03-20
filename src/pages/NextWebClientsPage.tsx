import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Building2, Eye, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function NextWebClientsPage() {
  const { isSuperAdmin, selectTenant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["nextweb-all-businesses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, status, created_at, slug, email, owner_name, crm_type")
        .order("name");
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Get user counts per business
  const { data: userCounts = {} } = useQuery({
    queryKey: ["nextweb-user-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("business_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        if (p.business_id) counts[p.business_id] = (counts[p.business_id] || 0) + 1;
      });
      return counts;
    },
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = businesses.filter((b: any) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitchToClient = (businessId: string) => {
    queryClient.clear();
    selectTenant(businessId);
    const businessName = businesses.find((b: any) => b.id === businessId)?.name || "Tenant";
    toast.success(`Switched to ${businessName}`);
    navigate("/dashboard");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
          <p className="text-sm text-muted-foreground">{businesses.length} businesses registered on the platform</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Business Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">CRM Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Users</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{b.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {CRM_TYPE_MAP[b.id] || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{(userCounts as any)[b.id] || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {format(new Date(b.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => handleSwitchToClient(b.id)}
                      >
                        <Eye className="h-3 w-3" />
                        Switch View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
