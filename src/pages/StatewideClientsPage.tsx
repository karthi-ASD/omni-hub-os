import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { usePageTitle } from "@/hooks/usePageTitle";
import { MapPin, Search, Filter } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const AU_STATES = [
  "All States",
  "New South Wales", "NSW",
  "Victoria", "VIC",
  "Queensland", "QLD",
  "South Australia", "SA",
  "Western Australia", "WA",
  "Tasmania", "TAS",
  "Northern Territory", "NT",
  "Australian Capital Territory", "ACT",
];

const SERVICE_CATEGORIES = [
  "All Services", "SEO", "Web Development", "PPC", "Social Media",
  "Mobile Apps", "Hosting", "Content", "Reputation Management",
];

const STATUS_OPTIONS = ["All", "active", "cancelled", "pending", "prospect"];

const StatewideClientsPage = () => {
  usePageTitle("Statewide Clients");
  const { clients } = useClients();
  const { isSuperAdmin, isBusinessAdmin } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const isAdmin = isSuperAdmin || isBusinessAdmin;

  const [stateFilter, setStateFilter] = useState("All States");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const dept = (departmentName || "").toLowerCase();
  const isAccounts = dept.includes("account") || dept.includes("finance");
  const isSEO = dept.includes("seo") || dept.includes("digital");
  const isSales = dept.includes("sales") || dept.includes("business dev");

  // Determine column visibility based on department
  const showFinancials = isAdmin || isAccounts;
  const showSEOData = isAdmin || isSEO;

  const filtered = useMemo(() => {
    return clients.filter((c: any) => {
      if (stateFilter !== "All States") {
        const clientState = (c.state || "").toLowerCase();
        if (!clientState.includes(stateFilter.toLowerCase())) return false;
      }
      if (serviceFilter !== "All Services") {
        if ((c.service_category || "").toLowerCase() !== serviceFilter.toLowerCase()) return false;
      }
      if (statusFilter !== "All") {
        if (c.client_status !== statusFilter) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        if (
          !(c.contact_name || "").toLowerCase().includes(s) &&
          !(c.company_name || "").toLowerCase().includes(s) &&
          !(c.email || "").toLowerCase().includes(s) &&
          !(c.city || "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [clients, stateFilter, serviceFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader heading="Statewide Clients" text="Filter and view clients across all states and service categories" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AU_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            <Filter className="inline h-3.5 w-3.5 mr-1" />
            {filtered.length} clients found
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  {showSEOData && <TableHead>SEO Manager</TableHead>}
                  {showFinancials && <TableHead>Contract Value</TableHead>}
                  {showFinancials && <TableHead>Payment Status</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showFinancials && showSEOData ? 10 : 8} className="text-center py-8 text-muted-foreground">
                      No clients match the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 100).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.contact_name}</TableCell>
                      <TableCell>{c.company_name || "—"}</TableCell>
                      <TableCell>{c.city || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {c.state || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.service_category || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.client_status === "active" ? "default" : "secondary"}>
                          {c.client_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.salesperson_owner || "—"}</TableCell>
                      {showSEOData && <TableCell>{c.assigned_seo_manager_id ? "Assigned" : "—"}</TableCell>}
                      {showFinancials && (
                        <TableCell>${(c.contract_value || 0).toLocaleString()}</TableCell>
                      )}
                      {showFinancials && (
                        <TableCell>
                          <Badge variant={c.payment_status === "overdue" ? "destructive" : "outline"}>
                            {c.payment_status || "current"}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatewideClientsPage;
