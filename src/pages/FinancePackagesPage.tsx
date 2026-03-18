import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { Layers, AlertTriangle, Eye, Plus, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface ClientWithPackage {
  id: string;
  contact_name: string;
  email: string | null;
  client_packages: { id: string; package_name: string; total_value: number }[];
}

export default function FinancePackagesPage() {
  const navigate = useNavigate();
  const { roles, profile } = useAuth();
  const { departmentName } = useEmployeeDepartment();

  const deptLower = (departmentName || "").toLowerCase();
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts") || deptLower.includes("accounting");
  const isAdmin = roles.some(r => ["super_admin", "business_admin"].includes(r));
  const isFinance = isAdmin || isFinanceDept;

  const [clients, setClients] = useState<ClientWithPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  console.log("FINANCE PACKAGES DEBUG", { roles, departmentName, isFinanceDept, isAdmin, isFinance });

  useEffect(() => {
    if (!profile?.business_id || !isFinance) return;
    const load = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, contact_name, email, client_packages(id, package_name, total_value)")
        .eq("business_id", profile.business_id)
        .is("deleted_at", null)
        .order("contact_name");
      setClients((data as unknown as ClientWithPackage[]) || []);
      setLoading(false);
    };
    load();
  }, [profile?.business_id, isFinance]);

  if (!roles || roles.length === 0) return null;

  if (!isFinance) {
    return (
      <div className="p-10 text-center text-destructive font-semibold">
        Unauthorized — Finance department access only
      </div>
    );
  }

  const filtered = clients.filter(c =>
    (c.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const clientsWithoutPackage = filtered.filter(c => !c.client_packages || c.client_packages.length === 0);
  const clientsWithPackage = filtered.filter(c => c.client_packages && c.client_packages.length > 0);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Finance — Client Packages
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage client subscriptions, pricing, and billing packages
        </p>
      </div>

      {clientsWithoutPackage.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {clientsWithoutPackage.length} client{clientsWithoutPackage.length > 1 ? "s" : ""} need package setup
          </span>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(client => {
                const pkg = client.client_packages?.[0];
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email || "—"}</TableCell>
                    <TableCell>
                      {pkg ? (
                        <Badge variant="secondary">{pkg.package_name}</Badge>
                      ) : (
                        <Badge variant="destructive">No Package</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {pkg ? `$${Number(pkg.total_value).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={pkg ? "outline" : "default"}
                        onClick={() => navigate(`/client-package/${client.id}`)}
                      >
                        {pkg ? (
                          <><Eye className="h-3.5 w-3.5 mr-1" /> View</>
                        ) : (
                          <><Plus className="h-3.5 w-3.5 mr-1" /> Create</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
